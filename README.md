# seokit

Claude Code에서 쓰는 내 작업 흐름을 플러그인 하나로 묶었다.

[superpowers](https://github.com/obra/superpowers)의 TDD 기반 워크플로우와 좋은 테스트 쓰는 법에서 가져왔다. 목표는 하나다. 코드가 바뀌면 문서도 같이 바뀌게 하는 것.

## 흐름

- 신규 기능: plan 모드로 설계 합의 → 명세 작성(로직 게이트 포함) → `tdd`로 개발 → `review-loop` → `update-docs`
- 수정: 원인 확인 → 실패 테스트 → 수정 → `review-loop` → `update-docs`
- `review-loop`: 기계 검증(프로젝트의 typecheck·lint·test 를 자동 탐지해 실행) → `code-reviewer` 서브에이전트 리뷰 → 수정 → 재검증을 차단 지적이 없을 때까지(최대 3라운드) 반복한다. 구현은 메인 에이전트, 판정은 코드를 쓰지 않은 리뷰어가 한다. 리뷰어는 기계가 못 잡는 것만 본다 — 명세 로직 게이트(G1…)와 코드 분기·테스트의 대응, 코드 룰북(`code-rules`), TypeScript 모범사례(`typescript-best-practice`). 매 수정마다 검증을 돌리는 훅은 두지 않는다(TDD 의 RED 단계와 여러 파일 수정 중간 상태에서 노이즈만 나기 때문).
- 의도 검증(게이트 ↔ 코드)은 `review-loop` 한 곳에서만 한다. `update-docs` 는 코드에 맞춰 문서를 고치는 역할만 하고, 로직 게이트는 코드에 맞춰 고치지 않는다(합의한 의도가 조용히 지워지는 걸 막기 위해서).
- Edit·Write로 코드 파일을 고치면 훅이 기록해 두고, 끝내기 전에 문서 점검을 한 번 요구한다. 문서·테스트 파일은 세지 않는다. 같은 작업 안에서 대응표가 가리키는 문서도 Edit·Write로 고쳤다면 그 레포는 막지 않는다(ex.프로젝트 CLAUDE.md 가 코드와 함께 문서를 고치게 하는 경우 점검이 중복되기 때문).
- 선택지 질문(AskUserQuestion)의 라벨이나 설명에 `(추천)`·`(Recommended)`·`[권장]` 같은 괄호 표시가 붙으면 훅이 호출을 막는다. 표시가 없으면 같은 훅이 선택지 순서를 매번 섞는다. 모델이 선호하는 안을 첫 번째에 두는 버릇을 지우기 위해서다. 섞은 질문은 `allow` 가 아니라 `ask` 로 넘긴다(`allow` 면 질문 화면 없이 빈 답이 돌아온 사례가 있다, anthropics/claude-code#12672). 본문에 쓰는 추천은 훅이 못 막고 규칙(`SessionStart.md`)으로만 유도한다.

훅은 레포에 `.claude/docs-map.md`(어떤 코드가 어떤 문서와 짝인지 적은 표)가 있을 때만 켜진다. 예전 방식인 `.claude/skills/update-docs/SKILL.md`도 인정한다. 이 파일은 `/seokit-frontend:init` 으로 만든다.

## 설치

```
/plugin marketplace add Wonchang0314/seokit
/plugin install seokit-frontend@frontend-development-plugin
```

그다음 쓰려는 프로젝트에서 `/seokit-frontend:init` 을 실행한다. 레포를 조사해 `.claude/docs-map.md` 초안을 보여 주고, 확인받으면 git 최상위 폴더에 쓴다. 쓴 파일은 커밋한다(커밋하지 않으면 워크트리에서는 훅이 꺼진다).

업데이트는 `/plugin marketplace update frontend-development-plugin` 뒤 `/plugin update seokit-frontend`.

### 프로젝트별 룰 보강

공통 룰북(`skills/code-rules/SKILL.md`, 규칙 ID `R1`…)에 프로젝트 규칙을 더하려면 프로젝트 git 최상위에 `.claude/code-rules.md` 를 둔다. 없어도 된다.

```markdown
# 프로젝트 룰
- **P1.** 서버 상태는 TanStack Query 로만 다룬다. 전역 store 에 복사하지 않는다.
- **R7 해제:** 생성 파일(`generated/**`)은 줄 수 제한을 받지 않는다.

## 검증 명령
- typecheck: `pnpm -w typecheck`
- lint: `pnpm -w lint`
- test: `pnpm -w test -- --run`
```

`검증 명령`을 적으면 `review-loop` 가 자동 탐지 대신 이 명령을 쓴다.

## 구조

```
seokit/
├── .claude-plugin/
│   ├── marketplace.json        마켓플레이스 정의
│   └── plugin.json             플러그인 매니페스트 (version 없음, 커밋이 곧 버전)
├── .claude/docs-map.md         이 레포의 코드↔문서 대응표
├── workflow.md                 작업 흐름. opt-in 레포에선 세션 시작 때 주입된다
├── SessionStart.md             질문 방식 규칙. workflow.md 와 함께 주입된다
├── skills/
│   ├── init/SKILL.md           레포를 조사해 docs-map.md 를 만든다 (사용자가 직접 호출)
│   ├── tdd/
│   │   ├── SKILL.md            RED-GREEN-REFACTOR 절차
│   │   └── writing-good-tests.md  좋은 테스트의 두 원칙과 돌연변이 점검
│   ├── review-loop/SKILL.md    기계 검증 → code-reviewer 리뷰 → 수정 반복 절차
│   ├── code-rules/SKILL.md     공통 코드 룰북 (R-ID, 기계가 못 잡는 규칙만. / 메뉴엔 숨김)
│   ├── typescript-best-practice/
│   │   ├── SKILL.md            TS 규칙 표 (.ts·.tsx 작업 시 자동 적용)
│   │   └── references/patterns.md  규칙별 코드 예시
│   ├── update-docs/SKILL.md    코드 수정 뒤 문서 맞추는 절차
│   └── explain-diff-notion/SKILL.md  커밋된 diff 설명을 Notion 페이지로
├── agents/
│   ├── api-scaffold.md         OpenAPI 스펙으로 도메인 API 모듈 생성·증분 반영
│   └── code-reviewer.md        review-loop 의 읽기 전용 리뷰어 (code-rules·typescript-best-practice preload)
├── hooks/
│   ├── hooks.json              훅 배선
│   ├── lib.mjs                 opt-in 판정, 코드 파일 판정, 대응 문서 경로 해석, 상태 파일 위치
│   ├── session-start.mjs       SessionStart: workflow.md + SessionStart.md 주입
│   ├── ask-user-question.mjs   PreToolUse(AskUserQuestion): 추천 표시가 붙은 질문 차단, 없으면 선택지 순서 섞기
│   ├── update-docs-track.mjs   PostToolUse: 고친 코드 파일과 대응 문서 기록
│   ├── update-docs-gate.mjs    Stop: 코드 기록이 있고 대응 문서를 안 고쳤으면 한 번 막고 update-docs 요구
│   └── update-docs.test.mjs    훅 테스트
└── scripts/
    ├── fetch-spec.mjs          api-scaffold가 쓰는 OpenAPI 스펙 탐색·생성
    └── fetch-spec.test.mjs     스펙 스크립트 테스트
```

테스트: `node --test 'hooks/*.test.mjs' 'scripts/*.test.mjs'`
