---
status: open
area: lint-config
severity: medium
related-rule: §3.5.3
---

# `import/order` 가 TypeScript path alias 와 안 맞음

## 문제

`tsconfig.json` 의 `paths` (예: `@/*` → `./src/*`) 를 쓰는 프로젝트에서 `eslint-import-resolver-typescript` 가 없으면 import 그룹 분류가 깨진다. alias import 가 `internal` 이 아닌 `external` 또는 `unknown` 으로 분류돼 정렬 순서가 어긋남.

## 영향

§3.5.3 의 `builtin → external → internal → parent → sibling` 정렬이 alias 사용 프로젝트에서 무력화.

## 제안 해결

```js
settings: {
  react: { version: 'detect' },
  'import/resolver': {
    typescript: { project: './tsconfig.json' },
    node: true,
  },
}
```

devDeps 추가: `eslint-import-resolver-typescript`

## 추가 검토

`eslint-plugin-import` 는 2024~2025 들어 유지보수가 정체 상태이고 `eslint-plugin-import-x` (active fork) 가 권장되는 분위기. seokit v1 에서 마이그레이션 여부 결정 필요.

- 마이그레이션 시 룰 이름 그대로 (`import-x/order`), import 만 교체
- import-x 는 typescript-eslint 와 더 잘 통합됨
