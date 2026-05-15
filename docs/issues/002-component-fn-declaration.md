---
status: open
area: lint-config
severity: medium
related-rule: §3.1.1
---

# 컴포넌트 named function 을 lint 로 자동화

## 문제

§3.1.1 "컴포넌트는 named `function` 으로 선언" 은 현재 `[review-only]` 인데, `react/function-component-definition` 으로 자동 enforce 가능하다. 7대 핵심 철학 1·2번에 직결되는 룰이라 review-only 로 두면 가장 자주 새어나가는 항목이 된다.

## 영향

핵심 철학에 해당하는 룰이 코드리뷰 사람 손에 맡겨져 일관성 누수 발생.

## 제안 해결

`eslint-plugin-react` 의 룰 추가:

```js
rules: {
  'react/function-component-definition': ['error', {
    namedComponents: 'function-declaration',
    unnamedComponents: 'function-expression',
  }],
}
```

본문 §3.1.1 마커: `[review-only]` → `[lint: react/function-component-definition]`
부록 A 표에도 행 추가.

## 주의

`forwardRef(function Foo() {})` 처럼 HOC 래핑한 named function expression 도 룰이 허용하는지 시험 필요. 안 잡으면 추가 옵션 또는 review 보강.
