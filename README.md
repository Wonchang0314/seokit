# seokit

Wonchang의 **프론트엔드 개발 환경** — Claude Code marketplace 형태로 본인 작업 워크플로우·하네스를 한곳에 모은 toolkit.

이 repo는 marketplace `frontend-development-plugin`의 정의 + 그 안에 포함된 plugin들의 소스다. 새 FE 프로젝트를 시작할 때 필요한 도구만 골라서 설치해 작업 환경을 그대로 가져온다.

## 포함된 plugin

| Plugin | 무엇 | 언제 깔까 |
|---|---|---|
| `seokit-rules` | React/TS 코드 규약(CODE_RULES.md) 자동 강제 — skill·`/code-review`·subagent | 거의 모든 FE 프로젝트 |
| `seokit-api` | openapi-typescript 산출물 변경분을 도메인 파일에 수술적 반영하는 agent | openapi-typescript + TanStack Query 스택 프로젝트 |

## Marketplace 등록 (한 번)

Claude Code 안에서:

```
/plugin marketplace add github:Wonchang0314/seokit
```

이 명령으로 marketplace `frontend-development-plugin`이 본인 시스템에 카탈로그로 추가됨. 이후 plugin들을 개별 설치 가능.

## Plugin 설치 (필요한 것만)

```
/plugin install seokit-rules@frontend-development-plugin
/plugin install seokit-api@frontend-development-plugin
```

## 프로젝트별 활성화

전역으로 설치되지만 **각 프로젝트의 `.claude/settings.json`**에서 켤지 결정:

```json
{
  "enabledPlugins": {
    "seokit-rules@frontend-development-plugin": true,
    "seokit-api@frontend-development-plugin": true
  }
}
```

켜지 않은 프로젝트에서는 동작하지 않는다 (Claude Code 공식 enabledPlugins 메커니즘).

## 구조

```
seokit/                                    ← 이 repo = marketplace
├── .claude-plugin/marketplace.json        ← 카탈로그 정의
└── plugins/
    ├── seokit-rules/                      ← plugin 1
    │   ├── .claude-plugin/plugin.json
    │   ├── CODE_RULES.md                  ← React/TS 규칙 (SSOT)
    │   ├── skills/seokit-rules/SKILL.md
    │   ├── commands/code-review.md
    │   └── agents/seokit-reviewer.md
    └── seokit-api/                        ← plugin 2
        ├── .claude-plugin/plugin.json
        └── agents/api-scaffold.md
```

## 로컬 개발

```bash
git clone https://github.com/Wonchang0314/seokit.git
cd seokit
# Claude Code 안에서:
/plugin marketplace add /absolute/path/to/seokit
/plugin install <plugin-name>@frontend-development-plugin
```

파일 수정 후 `/plugin marketplace update frontend-development-plugin`으로 재로드.

## 저자

Wonchang Seok · developerseok@gmail.com
