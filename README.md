# seokit

Wonchang의 **프론트엔드 개발 환경** — Claude Code marketplace 형태로 본인 작업 워크플로우·하네스를 한곳에 모은 toolkit.

이 repo는 marketplace `frontend-development-plugin`의 정의이자, 그 안에 담긴 **단일 plugin `seokit-frontend`의 소스**다. 새 FE 프로젝트를 시작할 때 이 하나만 설치하면 작업 환경을 그대로 가져온다.

## 구성요소

| 구성요소             | 무엇                                                                        | 발동                                              |
| -------------------- | --------------------------------------------------------------------------- | ------------------------------------------------- |
| `seokit-rules` skill | React/TS 코드 규약(CODE_RULES.md §3 MUST + §5 agent contract) 자동 강제      | `.ts`/`.tsx` 작성·수정 시 자동 호출               |
| `api-scaffold` agent | openapi-typescript 산출물 변경분을 도메인 파일에 수술적 반영                 | openapi-typescript + TanStack Query 스택에서 호출 |

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
└── agents/api-scaffold.md               ← API 스캐폴딩 에이전트
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
