# Changelog

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
