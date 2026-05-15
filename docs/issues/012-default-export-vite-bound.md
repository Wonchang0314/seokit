---
status: open
area: docs
severity: low
related-rule: §3.5.2
---

# default export 예외 목록이 Vite 가정에 묶임

## 문제

`eslint.config.sample.mjs` 의 default export 예외 파일 목록:

```js
files: [
  '**/*.config.{js,ts,mjs,cjs}',
  'vite.config.*',
  'tailwind.config.*',
  'eslint.config.*',
  'src/main.tsx',
  'src/router.tsx',
]
```

`src/main.tsx`, `src/router.tsx` 는 Vite 프로젝트 기준. Next.js (App Router) / Remix / TanStack Start 등에서 그대로 가져다 쓰면 framework convention 으로 default export 가 강제되는 파일들이 깨진다.

- Next.js Pages Router: `pages/**/*.{ts,tsx}`
- Next.js App Router: `app/**/{page,layout,loading,error,not-found,template,default}.{ts,tsx}`
- Remix: `app/routes/**/*.{ts,tsx}`

## 영향

다른 메타프레임워크 사용자에게 즉시 발생하는 lint 에러 (룰 스타일 깨짐).

## 제안 해결

세 가지 접근:

- **(a)** sample config 주석에 "Vite 가정" 명시. 사용자가 본인 프레임워크에 맞게 손으로 수정.
- **(b)** seokit 부트스트래퍼에서 프로젝트 타입(Vite/Next/Remix/...) 감지 후 예외 목록 자동 분기. `vite.config.*` 존재 / `next.config.*` 존재 / `package.json` 의 dependencies 로 감지.
- **(c)** 템플릿 변수 (`{{framework_default_exports}}`) 로 두고 부트스트래퍼 입력 시 치환.

권장: **(b)** + **(a)** 폴백.

## 연결

seokit 부트스트래퍼의 "프로젝트 타입 감지" 기능 일반 설계와 연결됨. 비슷한 분기가 필요한 다른 항목:

- [010](010-globals-missing.md) — globals.browser vs node 선택
- [007](007-typescript-magic-numbers.md) — 매직 넘버 예외값
