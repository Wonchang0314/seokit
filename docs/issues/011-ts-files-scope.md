---
status: open
area: lint-config
severity: medium
---

# TypeScript 룰 스코프 (`files` 필터 누락)

## 문제

`eslint.config.sample.mjs` 의 메인 rules 블록(line 59~130) 에 `files` 필터가 없어 .js / .mjs / .cjs / .ts / .tsx 전부에 적용된다. 결과:

- TypeScript 전용 룰(`@typescript-eslint/*`) 이 .mjs config 파일 등 JS 파일에 적용되어 거짓 경고 또는 파서 오류
- `tseslint.configs.recommended` 가 TS 파서를 깔아주긴 하지만, 이걸 같은 블록에서 모든 파일에 강제하는 건 비추천 패턴

## 영향

- `vite.config.mjs`, `tailwind.config.cjs` 같은 빌드 config 에 TS 룰이 적용
- 향후 vanilla JS 유틸을 추가하면 파서 충돌

## 제안 해결

TS 전용 룰을 별도 블록으로 격리:

```js
export default [
  ...tseslint.configs.recommended,

  // 공통 (모든 파일)
  {
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y, import: importPlugin, local: localPlugin },
    languageOptions: { /* parserOptions, globals */ },
    settings: { /* ... */ },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'import/no-default-export': 'error',
      'import/order': [/* ... */],
      'jsx-a11y/*': /* ... */,
      'local/useeffect-named-function': 'error',
      'no-magic-numbers': /* JS 전용 */,
    },
  },

  // TS 전용
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-magic-numbers': /* ... */,
      'no-magic-numbers': 'off',  // TS 버전이 대신
    },
  },

  // 기존 default export 예외 블록 ...
]
```
