// SessionStart: opt-in 레포면 작업 흐름(workflow.md)과 질문 방식(SessionStart.md)을 세션 컨텍스트에 넣는다.
// matcher 를 두지 않아 compact 뒤 재주입도 이 훅에 기댄다(matcher 없는 훅이 compact 에도 실행되는지는 미확인).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { gitRoot, isOptedIn, readStdinJson } from "./lib.mjs";

const DOCS = ["../workflow.md", "../SessionStart.md"].map((p) => fileURLToPath(new URL(p, import.meta.url)));

function main() {
  const data = readStdinJson();
  const root = gitRoot(data?.cwd || process.cwd());
  if (!root || !isOptedIn(root)) return;
  const additionalContext = DOCS.map((f) => readFileSync(f, "utf8").trim()).join("\n\n");
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext } }));
}

try {
  main();
} catch {
  // 주입 실패로 세션을 막지 않는다
}
