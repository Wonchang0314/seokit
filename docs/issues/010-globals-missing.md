---
status: open
area: lint-config
severity: low
---

# `languageOptions.globals` 누락

## 문제

ESLint v9 flat config 에서는 더 이상 `env: { browser: true, node: true }` 가 작동하지 않는다. `languageOptions.globals` 로 명시해야 한다.

현재 sample config 에 globals 설정이 전혀 없어, 브라우저 코드의 `window`, `document`, `fetch` 등이 `no-undef` 룰에 잡힐 수 있다 (`tseslint.configs.recommended` 가 일부 globals 를 깔아주긴 하나 불완전).

## 영향

브라우저 환경 코드에서 거짓 양성 `no-undef` 또는 IDE 의 잘못된 hover 정보.

## 제안 해결

```js
import globals from 'globals'

languageOptions: {
  globals: {
    ...globals.browser,
    ...globals.node,  // 빌드 스크립트, Vite config 등에서 필요
  },
  parserOptions: { /* 기존 ... */ },
}
```

devDeps 추가: `globals`

## 프로젝트 타입별 분기

- Vite/CRA: `globals.browser` 만
- Next.js: `globals.browser` + `globals.node` (SSR/RSC 때문)
- Node-only (build tools): `globals.node` 만

seokit 부트스트래퍼에서 프로젝트 타입 감지하여 자동 선택 검토.
