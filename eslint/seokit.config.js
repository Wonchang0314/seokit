// seokit lint enforcement — enforce 룰 선언의 단일 출처.
//
// 정적 flat config 파일이 설치처 parser(@typescript-eslint/parser) 를 직접 import 하면
// Node 가 이 파일 경로 기준으로 모듈을 해석해 설치처 node_modules 를 못 찾는다. 그래서
// parser 객체 주입은 hook(hooks/lint-check.mjs)이 설치처 루트 기준으로 담당하고,
// 이 파일은 "어떤 룰을 어떤 severity 로 켜는가" 와 커스텀 룰 본체만 export 한다.

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// `local` 플러그인의 룰 묶음. 커스텀 룰은 이 파일 기준 상대경로라 항상 해석된다.
export const customRules = {
  "useeffect-named-function": require("./rules/useeffect-named-function.js"),
};

// hook 이 overrideConfig.rules 로 그대로 주입한다.
export const enforcedRules = {
  "local/useeffect-named-function": "error", // §3.1.2 (커스텀)
};
