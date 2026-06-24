#!/usr/bin/env node
// PostToolUse hook — .ts/.tsx 편집 직후 설치처 ESLint 로 enforce 룰을 검사하고
// 위반 시 하드 차단(decision:block)한다. 전제조건(설치처 eslint·plugin·parser) 미충족 시
// 조용히 통과(exit 0)해 review-only 폴백으로 떨어진다. 자세한 설계는 README "Lint 강제" 참조.

import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { customRules, enforcedRules } from "../eslint/seokit.config.js";

function readStdin() {
  return new Promise((res) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => res(data));
    process.stdin.on("error", () => res(""));
  });
}

function shouldSkip(filePath) {
  if (!/\.(ts|tsx)$/.test(filePath)) return true; // .ts/.tsx 전용
  if (/\.(gen|d)\.ts$/.test(filePath)) return true; // 자동 생성 코드
  if (/\.(test|spec)\.[tj]sx?$/.test(filePath)) return true; // 테스트 파일은 느슨
  return false;
}

// file_path 상위로 올라가며 node_modules 를 가진 디렉터리(=설치처 루트)를 찾는다.
function findInstallRoot(startDir) {
  let dir = startDir;
  while (dir) {
    if (existsSync(join(dir, "node_modules"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

async function main() {
  const raw = await readStdin();
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const filePath = input?.tool_input?.file_path;
  if (!filePath || shouldSkip(filePath)) process.exit(0);

  const absFile = resolve(filePath);
  const installRoot = findInstallRoot(dirname(absFile)) ?? findInstallRoot(process.cwd());
  if (!installRoot) process.exit(0);

  // 핵심: 해석 시작점을 설치처 루트로 고정해 설치처 node_modules 에서 모듈을 끌어온다.
  const reqInstall = createRequire(join(installRoot, "noop.js"));
  let ESLint;
  let tsParser;
  try {
    ({ ESLint } = reqInstall("eslint"));
    tsParser = reqInstall("@typescript-eslint/parser");
    tsParser = tsParser?.default ?? tsParser;
  } catch {
    process.exit(0); // 전제조건 미충족 → review-only 폴백
  }

  const eslint = new ESLint({
    cwd: installRoot,
    overrideConfigFile: true, // 설치처 프로젝트 config 무시 → 결정성
    overrideConfig: {
      files: ["**/*.{ts,tsx}"],
      languageOptions: {
        parser: tsParser,
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      plugins: {
        local: { rules: customRules },
      },
      rules: enforcedRules,
    },
  });

  let results;
  try {
    results = await eslint.lintFiles([absFile]);
  } catch {
    process.exit(0); // lint 실행 자체 실패 시 차단하지 않는다
  }

  const violations = results.flatMap((result) =>
    result.messages
      .filter((message) => message.severity === 2)
      .map((message) => `${filePath}:${message.line}:${message.column} ${message.ruleId ?? ""} ${message.message}`),
  );

  if (violations.length > 0) {
    const reason = ["seokit lint 위반 — 수정 후 다시 작성:", ...violations].join("\n");
    process.stdout.write(JSON.stringify({ decision: "block", reason }));
  }
  process.exit(0);
}

main();
