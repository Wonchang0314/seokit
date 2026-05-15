---
status: open
area: lint-config
severity: low
related-rule: §3.1.3
---

# 모듈 최상위 헬퍼 `function` 선언을 lint 로 자동화

## 문제

§3.1.3 "모듈 최상위 헬퍼는 function 선언" 은 현재 `[review-only]`. `func-style` 룰로 부분 자동화 가능.

## 영향

파일 최상위에 `const foo = () => ...` 로 헬퍼가 들어오는 일이 자주 발생.

## 제안 해결

```js
'func-style': ['error', 'declaration', { allowArrowFunctions: true }]
```

- `allowArrowFunctions: true` 옵션이 §3.1.3 의 예외 목록(useState 초기화, useMemo/useCallback 첫 인자, map/filter 콜백, JSX 인라인 핸들러)과 호환되는지 1~2 파일에서 시험 적용 필요.
- 충돌 시 React hook 호출 콜백 영역만 다른 방식으로 처리하거나 review-only 유지.

본문 §3.1.3 마커: 시험 결과에 따라 `[lint: func-style]` 또는 유지.

## 한계

`func-style` 는 *파일 최상위* 만이 아니라 *모든 변수 선언*을 검사하므로, "컴포넌트 본문 내부 핸들러는 화살표 허용" 같은 §3.1.3 의 예외 조건을 완전히 표현하지는 못한다. 도입 시 룰 옵션과 코드 예외 위치를 함께 점검.
