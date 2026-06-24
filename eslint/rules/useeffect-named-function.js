"use strict";

// CODE_RULES.md §3.1.2 — useEffect 콜백은 익명이 아닌 이름 있는 function 표현식.
// 표준 ESLint 룰엔 없어 직접 작성한다. 첫 인자만 검사하고 cleanup `return () =>`는 건드리지 않는다.

const HOOK_NAME = "useEffect";

module.exports = {
  meta: {
    type: "suggestion",
    docs: { description: "useEffect 콜백은 named function 으로 작성" },
    schema: [],
    messages: {
      anonymous: "useEffect 콜백은 named function 으로 작성 (예: fetchUserOnIdChange)",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== "Identifier" || node.callee.name !== HOOK_NAME) return;
        const callback = node.arguments[0];
        if (!callback) return;
        const isAnonymousArrow = callback.type === "ArrowFunctionExpression";
        const isAnonymousFunction = callback.type === "FunctionExpression" && callback.id === null;
        if (isAnonymousArrow || isAnonymousFunction) {
          context.report({ node: callback, messageId: "anonymous" });
        }
      },
    };
  },
};
