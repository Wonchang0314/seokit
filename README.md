# seokit

개인용 React/TypeScript 코드 규칙을 Claude Code가 자동으로 강제하도록 만든 plugin marketplace.

이 repo 하나가 곧 **marketplace + plugin**이다. 다른 프로젝트에서 한 번의 설치 명령으로 `CODE_RULES.md`를 따르는 Claude 환경을 가져다 쓸 수 있다.

## 설치

Claude Code 안에서:

```
/plugin marketplace add github:Wonchang0314/seokit
/plugin install seokit@frontend-development-plugin
```

## 활성화 (프로젝트별)

전역 설치 후, **적용하고 싶은 프로젝트의 `.claude/settings.json`**에서 켠다:

```json
{
  "enabledPlugins": {
    "seokit@frontend-development-plugin": true
  }
}
```

다른 프로젝트에는 영향이 없다. Claude Code 공식 `enabledPlugins` 메커니즘을 그대로 쓰며, 별도 마커 파일은 사용하지 않는다.

## 아키텍처

```
seokit (이 repo)
└─ plugins/seokit/
   ├─ CODE_RULES.md         ← 단일 진실 출처 (Korean React/TS 규칙)
   ├─ skills/seokit-rules/  ← 코드 작성 시 자동 호출
   ├─ commands/code-review/ ← /code-review 슬래시 커맨드
   └─ agents/seokit-reviewer ← 깊은 리뷰 subagent
```

세 surface는 모두 `CODE_RULES.md`를 읽어 같은 규칙을 적용한다.

## 무엇이 강제되는가

- §3 MUST 규칙: 함수·컴포넌트 선언, 훅·상태·TypeScript·임포트·주석·네이밍
- §5 에이전트 행동 규약: 새 npm dependency / 새 전역 상태 / 새 타입 작성 전 **사용자에게 묻고 진행**

자세한 규칙은 [`plugins/seokit/CODE_RULES.md`](./plugins/seokit/CODE_RULES.md).

## 로컬 개발

```bash
git clone https://github.com/Wonchang0314/seokit.git
cd seokit
# Claude Code 안에서:
/plugin marketplace add /absolute/path/to/seokit
/plugin install seokit@frontend-development-plugin
```

`marketplace.json`·`plugin.json`·`SKILL.md` 등을 수정한 후에는 `/plugin marketplace update seokit`으로 재로드.

## 라이선스 / 저자

Wonchang Seok · developerseok@gmail.com
