---
status: open
area: docs
severity: medium
related-rule: §3.2.1
---

# `use` 접두사 lint 매핑 부정확

## 문제

CODE_RULES.md §3.2.1 본문과 부록 A 표 모두 `react-hooks/rules-of-hooks` 가 "custom hook 은 `use` 로 시작해야 한다" 를 enforce 한다고 표기돼 있다. 실제로 이 룰은 **`use` 로 시작하는 함수가 훅 호출 규칙(top-level only, no conditional 등)을 따르는지** 만 검사한다. 선언 단계에서 prefix 강제는 표준 룰로 불가능하다.

## 영향

문서가 잘못된 자동화 보장을 한다. 다른 사람이 "ESLint 가 잡아주겠지" 하고 prefix 누락 훅을 머지할 위험.

## 제안 해결

다음 중 택일:

- **(a)** 본문 §3.2.1 과 부록 A 의 마커를 `[review-only]` 로 강등
- **(b)** `@typescript-eslint/naming-convention` 으로 부분 강제. 단 진정한 "custom hook detection" 은 ESLint 룰 단독으로 어려움.
  ```js
  '@typescript-eslint/naming-convention': ['error', {
    selector: 'function',
    custom: { regex: '^use[A-Z]', match: true },
    filter: { regex: '^use[A-Z][a-zA-Z]*$', match: true },
    format: ['camelCase'],
  }]
  ```

권장: (a). hook 여부 판단은 본질적으로 의미론이라 lint 강제가 약하다.
