---
status: open
area: lint-config
severity: low
related-rule: §3.4.2
---

# `no-magic-numbers` 의 TypeScript 전용 버전 사용

## 문제

표준 `no-magic-numbers` 룰은 TypeScript 의 다음 패턴에 false positive 를 낸다:

- `enum` 멤버 값
- `as const` 객체 리터럴 값
- 타입 리터럴 (`type Status = 0 | 1`)
- readonly tuple 인덱스

§3.4.2 "매직 넘버·문자열 상수화" 의 권장 패턴(`as const` 객체로 추출)이 룰에 의해 오히려 잡히는 모순.

## 영향

권장 패턴을 적용한 코드에 false positive 가 쌓여, 결국 disable 주석 남발 또는 룰 무력화로 이어짐.

## 제안 해결

`@typescript-eslint/no-magic-numbers` 로 교체. TS 파일에만 적용되도록 `files` 스코프 함께 지정:

```js
{
  files: ['**/*.{ts,tsx}'],
  rules: {
    '@typescript-eslint/no-magic-numbers': ['warn', {
      ignore: [-1, 0, 1],
      ignoreArrayIndexes: true,
      ignoreDefaultValues: true,
      ignoreNumericLiteralTypes: true,
      ignoreEnums: true,
      ignoreReadonlyClassProperties: true,
      enforceConst: true,
    }],
    'no-magic-numbers': 'off',
  }
}
```

[013](013-magic-numbers-mismatch.md) 의 예외값 결정과 함께 진행.
