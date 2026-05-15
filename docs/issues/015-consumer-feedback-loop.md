---
status: roadmap
area: feature
target: v1.0
---

# [Roadmap] 소비자 프로젝트 → seokit 피드백 루프

## 아이디어

seokit 을 설치한 소비자 프로젝트에서 룰/agent/템플릿의 문제점을 발견했을 때, 그 피드백을 seokit repo 의 GitHub Issues 로 자동/반자동 전송하는 채널.

## 동기

- 다양한 코드베이스에서 부딪치는 엣지 케이스는 seokit 단독 dogfooding 으로 다 발견할 수 없다
- 사용자가 직접 issue 폼을 작성하는 마찰을 줄여야 피드백이 누적된다
- 어떤 룰이 자주 false positive 를 내는지, 어떤 agent 가 자주 실패하는지 데이터로 보고 싶다

## 가능한 구현

### CLI 명령
```bash
seokit report "useeffect-named-function 룰이 forwardRef 안의 effect 를 못 잡음"
# → gh issue create -R Wonchang0314/seokit \
#     --label "consumer-feedback" --title "..." --body "..."
```

### 슬래시 커맨드
`/seokit-feedback` 를 Claude Code 안에서 호출하면:
1. 현재 컨텍스트(어떤 룰/agent 작업 중이었는지)를 자동 수집
2. 사용자에게 한 줄 설명 입력 받음
3. seokit repo 에 이슈 생성, URL 반환

### 메타데이터
이슈에 자동 첨부:
- seokit 버전
- 프로젝트 타입(Vite/Next/...)
- Node/pnpm 버전
- 발생 룰 또는 agent 이름
- 익명 옵션(프로젝트 식별자 제외)

## 보류 이유

v1 출시 전에는 dogfooding 으로 어떤 피드백이 실제로 자주 나오는지 관찰이 우선. 피드백 0 인 상태에서 채널만 만들면 유지 비용만 늘어남.

## 검토 시점

- seokit 이 외부 사용자 3명 이상 확보
- 또는 v1.0 릴리스 직전

## 의존성

- `gh` CLI 의존을 강요할지, GitHub API token 을 직접 받을지
- 인증 흐름(익명 vs 사용자 GitHub 계정)
- spam 방지 (rate limit, 자동 라벨링)
