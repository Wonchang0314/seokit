---
status: open
area: lint-config
severity: low
related-rule: §3.6.2
---

# `eslint-disable` 사유 주석을 lint 로 자동화

## 문제

§3.6.2 "eslint-disable 은 사유 주석 필수" 가 현재 `[review-only]`. `@eslint-community/eslint-plugin-eslint-comments` 의 `require-description` 룰로 자동 enforce 가능.

## 영향

disable 주석에 사유가 빠진 PR 이 리뷰어 눈에 안 띄면 통과. 추후 디버깅 시 "왜 껐는지" 파악 불가.

## 제안 해결

```js
import comments from '@eslint-community/eslint-plugin-eslint-comments'

plugins: { 'eslint-comments': comments },
rules: {
  'eslint-comments/require-description': ['error', { ignore: [] }],
}
```

본문 §3.6.2 마커: `[review-only]` → `[lint: eslint-comments/require-description]`
부록 A 표에도 행 추가.

devDeps 추가: `@eslint-community/eslint-plugin-eslint-comments`
