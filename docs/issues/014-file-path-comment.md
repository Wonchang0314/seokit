---
status: open
area: docs
severity: low
---

# `eslint.config.sample.mjs` 주석 내 파일 경로 불일치

## 문제

`eslint.config.sample.mjs` 줄 6:

```js
 * - 본 파일은 `docs/CODE_RULES.md` 의 `[lint: ...]` 마커에 대응한다.
```

실제 위치는 루트 `./CODE_RULES.md`. `docs/` 경로 아님.

## 영향

다른 사람이 따라갈 때 혼란.

## 제안 해결

두 가지 중 택일:

- **(a)** 주석을 `./CODE_RULES.md` 로 수정 (즉시)
- **(b)** CODE_RULES.md 를 `docs/` 로 이동 + 주석 그대로 (구조적으로 깔끔하지만 모든 참조 갱신 필요)

권장: **(a)** 우선. 추후 seokit 부트스트래퍼 설계에서 `docs/` 이동을 검토.

## 추가

비슷하게 CODE_RULES.md 부록 A 마지막 줄도 점검:

> 샘플 ESLint flat config 는 [eslint.config.sample.mjs](./eslint.config.sample.mjs) 참조.

이쪽은 현재 위치 기준으로 정확. 향후 이동 시 함께 갱신.
