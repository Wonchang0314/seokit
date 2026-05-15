---
status: open
area: lint-config
severity: low
related-rule: §3.7.3
---

# 이벤트 핸들러 명명 (`handle*` / `on*`) 자동화 검토

## 문제

§3.7.3 "prop 으로 받는 콜백은 `on*`, 컴포넌트 내부 핸들러는 `handle*`" 가 현재 `[review-only]`. `@typescript-eslint/naming-convention` 으로 부분 자동화 가능하지만 한계가 있다.

## 영향

prop 콜백을 `handleXxx` 로 받거나 내부 핸들러를 `onXxx` 로 쓰는 혼란.

## 제안 해결

내부 핸들러 함수 이름 패턴은 잡을 수 있음:

```js
'@typescript-eslint/naming-convention': ['warn',
  {
    selector: 'variable',
    types: ['function'],
    filter: { regex: '^handle[A-Z]', match: true },
    format: ['camelCase'],
  },
]
```

prop 콜백 검사는 props interface 멤버를 정확히 식별하는 게 어려워 ESLint 단독으론 한계. 비용 대비 효과가 낮으면 **review-only 유지**가 합리적.

## 결정 필요

- (a) 부분 자동화 도입 (내부 핸들러만)
- (b) review-only 유지하고 부록 B 셀프 점검 체크리스트에 명시적으로 포함
