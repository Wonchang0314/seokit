# seokit

Wonchang의 **프론트엔드 개발 환경** — Claude Code marketplace 형태로 본인 작업 워크플로우·하네스를 한곳에 모은 toolkit.

이 repo는 marketplace `frontend-development-plugin`의 정의이자, 그 안에 담긴 **단일 plugin `seokit-frontend`의 소스**다. 새 FE 프로젝트를 시작할 때 이 하나만 설치하면 작업 환경을 그대로 가져온다.

## 구성요소

| 구성요소             | 무엇                                                                        | 발동                                              |
| -------------------- | --------------------------------------------------------------------------- | ------------------------------------------------- |
| `seokit-rules` skill | React/TS 코드 규약(CODE_RULES.md §3 MUST) 자동 강제                          | `.ts`/`.tsx` 작성·수정 시 자동 호출               |
| `api-scaffold` agent | openapi-typescript 산출물 변경분을 도메인 파일에 수술적 반영                 | openapi-typescript + TanStack Query 스택에서 호출 |
| lint 강제 hook       | CODE_RULES §3 `[lint:]` 룰을 설치처 ESLint로 결정적 차단                     | `.ts`/`.tsx` Edit/Write 후 PostToolUse 자동 실행  |

> **두 층의 강제**: skill은 모든 룰(`[review-only]` 포함)을 모델 컨텍스트에 주입하지만 준수는 모델 판단에 의존(비결정적). lint hook은 `[lint:]` 룰(현재 `local/useeffect-named-function` 1개)에 한해 ESLint로 결정적 차단(`decision:block`, 모델 판단 안 끼어듦). `[review-only]` 다수는 본질적으로 도구 불가 — seokit-rules skill의 셀프 점검 담당.

## Lint 강제 — 전제조건

PostToolUse lint hook(`hooks/lint-check.mjs`)은 **설치처 프로젝트의 ESLint를 실행**한다. 플러그인은 enforce 룰 선언(`eslint/seokit.config.js`)과 커스텀룰(`eslint/rules/useeffect-named-function.js`)만 동봉하고, ESLint 런타임·플러그인은 설치처 `node_modules`에 있어야 한다.

- 필요: 설치처에 `eslint`(9, flat config) + `@typescript-eslint/parser`.
- 미설치 시: hook은 조용히 통과하고 **review-only 폴백**(skill만 동작). 빌드 깨지지 않음.
- **모듈 해석**: hook은 설치처 루트 기준 `createRequire`로 `eslint`·parser를 끌어와 ESLint Node API의 `overrideConfig`에 객체째 주입한다 — 동봉 config가 설치처 `node_modules`를 못 찾는 문제를 피하기 위함. `overrideConfigFile: true`로 설치처 프로젝트 config는 무시(결정성).

## 트러블슈팅 (lint hook)

- **lint 차단이 안 됨** → 설치처 `node_modules`에 `eslint`·`@typescript-eslint/parser` 존재 확인. 하나라도 없으면 폴백 모드.
- **커스텀룰(`useeffect-named-function`)이 안 잡힘** → `eslint/seokit.config.js`의 `customRules`/`enforcedRules`에 등록됐는지, hook이 `local` 플러그인으로 주입하는지 확인.
- **룰↔코드 매핑이 헷갈림** → CODE_RULES.md 부록 A의 lint 매핑 표가 단일 출처.

## Marketplace 등록 (한 번)

Claude Code 안에서:

```
/plugin marketplace add Wonchang0314/seokit
```

이 명령으로 marketplace `frontend-development-plugin`이 카탈로그로 추가됨.

## Plugin 설치

```
/plugin install seokit-frontend@frontend-development-plugin
```

## 프로젝트별 활성화

전역으로 설치되지만 **각 프로젝트의 `.claude/settings.json`**에서 켤지 결정:

```json
{
  "enabledPlugins": {
    "seokit-frontend@frontend-development-plugin": true
  }
}
```

켜지 않은 프로젝트에서는 동작하지 않는다 (Claude Code 공식 enabledPlugins 메커니즘).

## 구조

```
seokit/                                  ← 이 repo = marketplace + 단일 plugin
├── .claude-plugin/
│   ├── marketplace.json                 ← 카탈로그 정의 (plugin 1개, source ".")
│   └── plugin.json                      ← seokit-frontend 매니페스트 (version 없음 = 커밋 SHA 기반)
├── CODE_RULES.md                        ← React/TS 규칙 (SSOT)
├── skills/seokit-rules/SKILL.md         ← 자동 호출 규칙 스킬
├── agents/api-scaffold.md               ← API 스캐폴딩 에이전트
├── hooks/                              ← PostToolUse lint 강제 hook
│   ├── hooks.json                       ← hook 배선 (자동 발견)
│   └── lint-check.mjs                   ← 설치처 ESLint 실행 + decision:block
└── eslint/                              ← enforce 룰 선언 + 커스텀룰
    ├── seokit.config.js                 ← enforce 룰 목록 (단일 출처)
    └── rules/useeffect-named-function.js ← 커스텀 룰 (표준 룰엔 없음)
```

## 업데이트 반영

`plugin.json`에 `version`이 없어 **커밋 SHA가 곧 버전**이다 — 푸시한 모든 커밋이 새 버전으로 취급된다. 소비 프로젝트에서 최신을 받으려면:

```
/plugin marketplace update frontend-development-plugin
/plugin update seokit-frontend
```

## 로컬 개발

```bash
git clone https://github.com/Wonchang0314/seokit.git
cd seokit
# Claude Code 안에서:
/plugin marketplace add /absolute/path/to/seokit
/plugin install seokit-frontend@frontend-development-plugin
```

파일 수정 후 `/plugin marketplace update frontend-development-plugin`으로 재로드.

## 저자

Wonchang Seok · developerseok@gmail.com
