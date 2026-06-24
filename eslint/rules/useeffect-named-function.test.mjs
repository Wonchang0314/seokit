import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const rule = require("./useeffect-named-function.js");

// 룰은 node.callee.{type,name} 과 arguments[0].{type,id} 만 읽으므로, 파서 없이
// 최소 AST 객체를 직접 먹여 검사한다 (개발 repo에 eslint 미설치 가정).
function lintUseEffect(callback) {
  const reports = [];
  const visitor = rule.create({ report: (descriptor) => reports.push(descriptor) });
  visitor.CallExpression({
    callee: { type: "Identifier", name: "useEffect" },
    arguments: callback ? [callback] : [],
  });
  return reports;
}

test("익명 화살표 콜백은 위반으로 잡는다", () => {
  assert.equal(lintUseEffect({ type: "ArrowFunctionExpression" }).length, 1);
});

test("익명 function 콜백은 위반으로 잡는다", () => {
  assert.equal(lintUseEffect({ type: "FunctionExpression", id: null }).length, 1);
});

test("named function 콜백은 통과한다", () => {
  assert.equal(lintUseEffect({ type: "FunctionExpression", id: { name: "fetchUserOnIdChange" } }).length, 0);
});

test("named function 참조 전달(Identifier)은 통과한다", () => {
  assert.equal(lintUseEffect({ type: "Identifier", name: "fetchUser" }).length, 0);
});

test("useEffect 가 아닌 훅 호출은 무시한다", () => {
  const reports = [];
  const visitor = rule.create({ report: (descriptor) => reports.push(descriptor) });
  visitor.CallExpression({
    callee: { type: "Identifier", name: "useMemo" },
    arguments: [{ type: "ArrowFunctionExpression" }],
  });
  assert.equal(reports.length, 0);
});
