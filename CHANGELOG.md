# Changelog

## 0.2.0 — Split into multi-plugin marketplace (breaking)

### Breaking
- Plugin renamed: `seokit` → `seokit-rules`. 설치 명령 변경:
  - 이전: `/plugin install seokit@frontend-development-plugin`
  - 이후: `/plugin install seokit-rules@frontend-development-plugin`
- `enabledPlugins` 키도 `seokit-rules@frontend-development-plugin`로 갱신 필요

### Added
- `seokit-api` plugin (`plugins/seokit-api/`): openapi-typescript + TanStack Query 프로젝트용
  API 스캐폴딩 agent (`api-scaffold`). 시작 시 자동 정찰로 PM·경로·명령·응답 컨벤션을 학습하고
  `.api-scaffold.json`에 캐시. 변경분만 도메인 파일에 수술적 반영.
- Marketplace 설명 갱신: 모듈식 plugin 카탈로그 형태로 표현

### Changed
- `plugins/seokit/` → `plugins/seokit-rules/` (git mv로 history 보존)
- 루트 README를 marketplace 카탈로그 안내 중심으로 재작성

## 0.1.0 — Initial plugin release

### Added
- Claude Code marketplace manifest at `.claude-plugin/marketplace.json`
- `seokit` plugin under `plugins/seokit/` containing:
  - `seokit-rules` skill — auto-invoked on React/TS code work; enforces §3 MUST + §5 agent contract
  - `/code-review` slash command — explicit diff/staged/last-edits audit against CODE_RULES.md
  - `seokit-reviewer` subagent — deep review for >5 file changes, type-reuse analysis
- Plugin-scoped README and root README with marketplace install instructions

### Changed
- Moved `CODE_RULES.md` from repo root into `plugins/seokit/CODE_RULES.md` (history preserved via `git mv`)
- Patched CODE_RULES.md Appendix A to reflect ESLint sample removal

### Removed
- `eslint.config.sample.mjs` — superseded by Claude plugin enforcement; lint annotations in §3 retained for intent
- `docs/issues/` (15 issue notes + README) — lint-layer issues mooted by the pivot

### Deferred
- Consumer feedback loop (originally `docs/issues/015-consumer-feedback-loop.md`): collect rule-violation reports from consuming projects → roll into rule refinements for v0.2
- §5 trigger sensitivity tuning: v0.1 leans toward over-ask (high recall). Adjust thresholds after real-world usage
- Automated tests for plugin behavior (fixture projects + scripted prompts + output assertions)
