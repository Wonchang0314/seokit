# seokit-rules (Claude Code plugin)

React/TypeScript 코드 작성 시 `CODE_RULES.md`를 Claude가 자동으로 강제하도록 만드는 plugin.

## 설치

Claude Code 안에서:

```
/plugin marketplace add github:Wonchang0314/seokit
/plugin install seokit-rules@frontend-development-plugin
```

## 활성화 (프로젝트별 opt-in)

전역으로 설치되지만 **각 프로젝트의 `.claude/settings.json`**에서 켤지 결정한다:

```json
{
  "enabledPlugins": {
    "seokit-rules@frontend-development-plugin": true
  }
}
```

켜지 않은 프로젝트에서는 동작하지 않는다.

## 구성 요소

| Surface | 호출 방식 | 용도 |
|---|---|---|
| `seokit-rules` skill | Claude가 React/TS 코드를 쓸 때 자동 호출 | 작성 전·후 §3 MUST + §5 게이트 적용 |
| `/code-review` 슬래시 커맨드 | 사용자가 직접 호출 | 현재 diff/staged를 CODE_RULES.md 대비 감사 |
| `seokit-reviewer` subagent | `/code-review` 또는 skill이 escalate | 5개 파일 초과·타입 재사용 분석 등 깊은 리뷰 |

## 강제되는 항목 (요약)

`CODE_RULES.md` §3 MUST 규칙 전부 + §5 에이전트 행동 규약 (코드 변경 전 사용자 승인):

- 컴포넌트·헬퍼·useEffect 콜백 named function (§3.1)
- 훅 컨벤션, 객체 반환 (§3.2)
- 로컬 상태 우선, props drilling ≤3 (§3.3)
- `any` 금지, 매직 넘버 상수화, 기존 타입 재사용 (§3.4)
- Named export only, 임포트 정렬 (§3.5)
- "왜" 주석만 (§3.6)
- Boolean `is/has/can/should`, 핸들러 `handle*` / prop `on*` (§3.7)
- **§5**: 새 npm 의존성 / 새 전역 상태 / 새 타입 작성 전 사용자에게 묻고 진행

전체 규칙은 [`CODE_RULES.md`](./CODE_RULES.md) 참조.

## 개발

레포 클론 후 로컬 마켓플레이스로 등록해 테스트:

```
/plugin marketplace add /path/to/seokit
/plugin install seokit-rules@frontend-development-plugin
```

`marketplace.json`·plugin 파일 수정 후에는 `/plugin marketplace update frontend-development-plugin`.
