// PostToolUse(Edit|Write|MultiEdit|NotebookEdit): Claude 가 고친 코드 파일을 '문서 점검 대기'에 적는다.
// opt-in 레포(lib.mjs OPT_IN_MARKERS)에서만 동작한다. 문서·테스트·.claude 파일은 대상이 아니다.
// 짝은 update-docs-gate.mjs(Stop).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { gitRoot, isCode, isOptedIn, readStdinJson, stateFile } from "./lib.mjs";

function main() {
  const data = readStdinJson();
  const input = data?.tool_input ?? {};
  const path = input.file_path || input.notebook_path;
  const sid = data?.session_id;
  if (!path || !sid) return;

  const abs = resolve(path);
  const root = gitRoot(dirname(abs));
  if (!root || !isOptedIn(root)) return;
  const rel = relative(root, abs);
  if (rel.startsWith("..") || !isCode(rel)) return;

  const { dir, file } = stateFile(sid);
  let state = {};
  try {
    state = JSON.parse(readFileSync(file, "utf8"));
  } catch {}
  const files = (state[root] ??= []);
  if (files.includes(rel)) return;
  files.push(rel);
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, JSON.stringify(state));
}

try {
  main();
} catch {
  // 기록 실패로 작업을 막지 않는다
}
