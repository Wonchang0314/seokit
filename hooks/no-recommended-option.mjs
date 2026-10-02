// PreToolUse(AskUserQuestion): 선택지에 추천 표시가 붙어 있으면 호출을 막고 이유를 돌려준다.
// 괄호로 감싼 표시만 본다 — '추천 피드' 같은 일반 단어는 막지 않는다. 행동 규칙은 SessionStart.md.
import { gitRoot, isOptedIn, readStdinJson } from "./lib.mjs";

const MARK = /[(\[（]\s*(recommended|추천|권장)\s*[)\]）]/i;

const REASON =
  "선택지에 추천 표시가 붙어 있어 호출을 막았다. 설계 판단이 걸린 질문이면 AskUserQuestion 을 쓰지 말고 " +
  "본문에서 열린 질문으로 묻고, 사용자가 자기 접근과 근거를 설명할 때까지 의견은 보류한다. " +
  "이미 합의한 범위의 승인·사실 확인·취향 질문이면 추천 표시를 빼고 다시 호출한다.";

function main() {
  const data = readStdinJson();
  const questions = data?.tool_input?.questions;
  if (!Array.isArray(questions)) return;
  const marked = questions.some(
    (q) => Array.isArray(q?.options) && q.options.some((o) => MARK.test(`${o?.label ?? ""}\n${o?.description ?? ""}`)),
  );
  if (!marked) return;
  const root = gitRoot(data.cwd || process.cwd());
  if (!root || !isOptedIn(root)) return;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: REASON },
    }),
  );
}

try {
  main();
} catch {
  // 검사 오류로 질문을 막지 않는다
}
