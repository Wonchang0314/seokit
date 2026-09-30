// Stop: '문서 점검 대기'에 코드 파일이 있으면 종료를 한 번 막고 update-docs 실행을 지시한다.
// 막는 즉시 대기 목록을 비우므로 같은 수정으로 두 번 막지 않는다(무한 반복 방지).
// 점검 라운드(stop_hook_active) 중 새로 생긴 수정은 막지 않고 비운다. 짝은 update-docs-track.mjs.
import { existsSync, readFileSync, rmSync } from "node:fs";
import { readStdinJson, stateFile } from "./lib.mjs";

const MAX_LIST = 30;

function main() {
  const data = readStdinJson();
  const sid = data?.session_id;
  if (!sid) return;
  const { file } = stateFile(sid);
  if (!existsSync(file)) return;
  let state;
  try {
    state = JSON.parse(readFileSync(file, "utf8"));
  } finally {
    rmSync(file, { force: true });
  }
  if (data.stop_hook_active || !Object.values(state).some((f) => f.length)) return;

  const lines = [];
  for (const [root, files] of Object.entries(state)) {
    lines.push(`[${root}]`, ...files.slice(0, MAX_LIST).map((p) => `- ${p}`));
    if (files.length > MAX_LIST) lines.push(`- … 외 ${files.length - MAX_LIST}개`);
  }
  const reason =
    "이번 작업에서 아래 코드 파일이 수정됐다. 끝내기 전에 update-docs 스킬을 실행해 " +
    "관련 문서(.claude/docs-map.md 대응표가 가리키는 문서)가 구현과 맞는지 점검·갱신하고, " +
    "마지막에 '문서 점검: 갱신 <파일들> / 불필요 <이유>' 한 줄로 보고하라.\n" +
    lines.join("\n");
  process.stdout.write(JSON.stringify({ decision: "block", reason }));
}

try {
  main();
} catch {
  // 게이트 오류로 종료를 막지 않는다
}
