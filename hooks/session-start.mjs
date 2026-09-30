// SessionStart: opt-in 레포면 작업 흐름(workflow.md)을 세션 컨텍스트에 넣는다.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { gitRoot, isOptedIn, readStdinJson } from "./lib.mjs";

const WORKFLOW = fileURLToPath(new URL("../workflow.md", import.meta.url));

function main() {
  const data = readStdinJson();
  const root = gitRoot(data?.cwd || process.cwd());
  if (!root || !isOptedIn(root)) return;
  const additionalContext = readFileSync(WORKFLOW, "utf8");
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext } }));
}

try {
  main();
} catch {
  // 주입 실패로 세션을 막지 않는다
}
