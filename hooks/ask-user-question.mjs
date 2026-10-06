// PreToolUse(AskUserQuestion): 선택지에 추천 표시가 붙어 있으면 호출을 막고 이유를 돌려준다.
// 표시가 없으면 질문마다 선택지 순서를 섞는다 — 모델은 선호하는 안을 첫 번째에 두는 버릇이 있다.
// 괄호로 감싼 표시만 본다 — '추천 피드' 같은 일반 단어는 막지 않는다. 행동 규칙은 SessionStart.md.
import { gitRoot, isOptedIn, readStdinJson } from "./lib.mjs";

const MARK = /[(\[（]\s*(recommended|추천|권장)\s*[)\]）]/i;

const REASON = "선택지에 추천 표시가 붙어 있어 호출을 막았다. 추천 표시를 빼고 다시 호출한다.";

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function emit(output) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", ...output } }));
}

function main() {
  const data = readStdinJson();
  const input = data?.tool_input;
  const questions = input?.questions;
  if (!Array.isArray(questions)) return;
  const hasOptions = (q) => Array.isArray(q?.options) && q.options.length > 1;
  if (!questions.some(hasOptions)) return;
  const root = gitRoot(data.cwd || process.cwd());
  if (!root || !isOptedIn(root)) return;

  const marked = questions.some(
    (q) => hasOptions(q) && q.options.some((o) => MARK.test(`${o?.label ?? ""}\n${o?.description ?? ""}`)),
  );
  if (marked) return emit({ permissionDecision: "deny", permissionDecisionReason: REASON });

  // allow 는 질문 UI 를 건너뛰고 빈 답을 돌려주는 사례가 있어(anthropics/claude-code#12672) ask 로 넘긴다.
  // updatedInput 은 부분이 아니라 전체 입력이어야 한다.
  emit({
    permissionDecision: "ask",
    updatedInput: { ...input, questions: questions.map((q) => (hasOptions(q) ? { ...q, options: shuffled(q.options) } : q)) },
  });
}

try {
  main();
} catch {
  // 검사 오류로 질문을 막지 않는다
}
