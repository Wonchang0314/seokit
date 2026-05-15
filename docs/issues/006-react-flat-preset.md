---
status: open
area: lint-config
severity: medium
---

# `eslint-plugin-react` 의 flat recommended preset 미적용

## 문제

`eslint.config.sample.mjs` 는 `react` 플러그인을 `plugins` 에 등록만 하고 `react.configs.flat.recommended` 를 extend 하지 않는다. 결과:

- `react/jsx-no-undef`, `react/jsx-uses-vars`, `react/no-unknown-property` 등 **JSX 기본 안전성 룰이 모두 누락**
- React 17+ 의 새 JSX transform 사용 시 `react/react-in-jsx-scope`, `react/jsx-uses-react` 가 거짓 경고를 낼 수 있음 (명시적 off 필요)

현재 활성화된 React 룰은 `react/jsx-key`, `react/no-array-index-key` 두 개뿐.

## 영향

JSX 기본 안전성 검사 누락. 정의 안 된 컴포넌트 사용, 알 수 없는 prop 등이 lint 단계에서 안 잡힘.

## 제안 해결

```js
import react from 'eslint-plugin-react'

export default [
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],  // 새 JSX transform: React in scope 룰 off

  {
    // ... 기존 plugins / rules ...
  },
]
```

## 검증

도입 후 기존 코드에 거짓 양성 발생하는지 확인. 특히 `react/prop-types` (TS 환경에서 불필요) 는 명시적 off 필요할 수 있음.
