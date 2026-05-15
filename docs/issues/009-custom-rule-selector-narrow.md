---
status: open
area: custom-rule
severity: low
related-rule: §3.1.2
---

# `local/useeffect-named-function` selector 좁음

## 문제

`eslint.config.sample.mjs` 의 커스텀 룰에 세 가지 한계가 있다:

1. **Namespace import 미포착**
   셀렉터 `CallExpression[callee.name="useEffect"]` 는 `React.useEffect(...)` 같은 namespace 호출을 못 잡는다.

2. **다른 effect hook 사각지대**
   `useLayoutEffect`, `useInsertionEffect` 도 동일한 철학(이름 있는 function 으로 stack frame 가독성 확보)이 적용돼야 하는데 제외돼 있다.

3. **Autofix 없음**
   `fixable` 가 없어 자동 수정 불가. 이름을 자동 생성할 수는 없으니 보류는 합리적이지만, `suggest` 로 빈 이름 템플릿 제공은 가능.

## 영향

- `import * as React` 패턴을 쓰는 코드에서 룰 우회
- `useLayoutEffect` 콜백이 익명으로 들어와도 통과

## 제안 해결

룰을 옵션 기반으로 일반화:

```js
'useeffect-named-function': {
  meta: {
    type: 'suggestion',
    docs: { description: '...' },
    schema: [{
      type: 'object',
      properties: {
        hookNames: { type: 'array', items: { type: 'string' } },
      },
    }],
    messages: { /* ... */ },
    hasSuggestions: true,
  },
  create(context) {
    const opts = context.options[0] ?? {}
    const hookNames = opts.hookNames ?? ['useEffect', 'useLayoutEffect', 'useInsertionEffect']

    function check(node) {
      const cb = node.arguments[0]
      if (!cb) return
      if (cb.type === 'ArrowFunctionExpression') {
        context.report({
          node: cb,
          messageId: 'arrow',
          suggest: [{
            messageId: 'suggest',
            fix: fixer => fixer.replaceText(cb, `function effectName() ${context.sourceCode.getText(cb.body)}`),
          }],
        })
      } else if (cb.type === 'FunctionExpression' && !cb.id) {
        context.report({ node: cb, messageId: 'anonFn' })
      }
    }

    return {
      'CallExpression'(node) {
        const callee = node.callee
        const name =
          callee.type === 'Identifier' ? callee.name :
          callee.type === 'MemberExpression' && callee.property.type === 'Identifier' ? callee.property.name :
          null
        if (name && hookNames.includes(name)) check(node)
      },
    }
  },
}
```

룰 사용 시:
```js
'local/useeffect-named-function': ['error', { hookNames: ['useEffect', 'useLayoutEffect'] }]
```
