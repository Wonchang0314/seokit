# Seokit Issues

코드룰북 자체 개선 사항을 트래킹한다. CODE_RULES.md 와 eslint.config.sample.mjs 에 대한 검토 결과를 기반으로 작성됐다.

각 이슈는 `docs/issues/NNN-slug.md` 파일이며, frontmatter 로 `status / area / severity / related-rule` 을 기록한다.

## Open

### Lint config 자체의 결함

- [006](006-react-flat-preset.md) — eslint-plugin-react flat recommended preset 미적용
- [007](007-typescript-magic-numbers.md) — TypeScript 전용 no-magic-numbers 미사용
- [008](008-import-resolver-typescript.md) — import/order 와 TS path alias 분류 깨짐
- [009](009-custom-rule-selector-narrow.md) — `local/useeffect-named-function` selector 좁음
- [010](010-globals-missing.md) — `languageOptions.globals` 누락
- [011](011-ts-files-scope.md) — TypeScript 룰 스코프 (`files` 필터 누락)

### Review-only → Lint 자동화 기회

- [002](002-component-fn-declaration.md) — 컴포넌트 named function 자동화
- [003](003-eslint-disable-description.md) — `eslint-disable` 사유 주석 자동화
- [004](004-helper-fn-declaration.md) — 모듈 최상위 헬퍼 function 선언 자동화
- [005](005-event-handler-naming.md) — 이벤트 핸들러 명명 (`handle*` / `on*`) 자동화

### 문서/Config 불일치

- [001](001-use-prefix-mismatch.md) — `use` 접두사 lint 매핑 부정확
- [012](012-default-export-vite-bound.md) — default export 예외 목록이 Vite 가정
- [013](013-magic-numbers-mismatch.md) — 매직 넘버 예외값 문서/config 불일치
- [014](014-file-path-comment.md) — sample config 주석 내 파일 경로 불일치

## Roadmap

- [015](015-consumer-feedback-loop.md) — 소비자 프로젝트 → seokit 피드백 루프 (v1)

## Closed

(none)
