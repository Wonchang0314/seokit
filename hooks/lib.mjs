// 훅 공용: opt-in 판정, 코드 파일 판정, 상태 파일 위치.
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, extname, join } from "node:path";
import { spawnSync } from "node:child_process";

// 이 중 하나가 레포에 있어야 훅이 동작한다. 두 번째는 플러그인 이전 방식(프로젝트 안 update-docs 스킬) 호환.
const OPT_IN_MARKERS = [".claude/docs-map.md", ".claude/skills/update-docs/SKILL.md"];
const DOC_EXT = new Set([".md", ".mdx", ".txt", ".rst"]);
const SKIP_DIRS = [".claude/", "docs/", "trash/", "node_modules/", ".git/"];
const TEST_PAT = /(\.(test|spec)\.[^/]+$|\/__tests__\/|\/src\/test\/|\/tests?\/)/;

export function readStdinJson() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return null;
  }
}

export function gitRoot(dir) {
  while (dir && !existsSync(dir)) dir = dirname(dir);
  const res = spawnSync("git", ["-C", dir, "rev-parse", "--show-toplevel"], { encoding: "utf8", timeout: 5000 });
  return res.status === 0 ? res.stdout.trim() || null : null;
}

export function isOptedIn(root) {
  return OPT_IN_MARKERS.some((m) => existsSync(join(root, m)));
}

export function isCode(rel) {
  if (DOC_EXT.has(extname(rel).toLowerCase())) return false;
  if (SKIP_DIRS.some((d) => rel.startsWith(d))) return false;
  return !TEST_PAT.test("/" + rel);
}

export function stateFile(sessionId) {
  const dir = process.env.SEOKIT_STATE_DIR || join(homedir(), ".claude/state/update-docs");
  return { dir, file: join(dir, `${sessionId}.json`) };
}
