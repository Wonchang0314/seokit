# seokit

Claude Code에서 쓰는 내 작업 흐름을 플러그인 하나로 묶었다.

[superpowers](https://github.com/obra/superpowers)의 TDD 기반 워크플로우와 좋은 테스트 쓰는 법에서 가져왔다. 목표는 하나다. 코드가 바뀌면 문서도 같이 바뀌게 하는 것.

## 흐름

- 신규 기능: plan 모드로 설계 합의 → 명세 작성 → `tdd`로 개발 → 검증 → `update-docs`
- 수정: 원인 확인 → 실패 테스트 → 수정 → 검증 → `update-docs`
- Edit·Write로 코드 파일을 고치면 훅이 기록해 두고, 끝내기 전에 문서 점검을 한 번 요구한다. 문서·테스트 파일은 세지 않는다.

훅은 레포에 `.claude/docs-map.md`(어떤 코드가 어떤 문서와 짝인지 적은 표)가 있을 때만 켜진다. 예전 방식인 `.claude/skills/update-docs/SKILL.md`도 인정한다. 이 파일은 `/seokit-frontend:init` 으로 만든다.

## 설치

```
/plugin marketplace add Wonchang0314/seokit
/plugin install seokit-frontend@frontend-development-plugin
```

그다음 쓰려는 프로젝트에서 `/seokit-frontend:init` 을 실행한다. 레포를 조사해 `.claude/docs-map.md` 초안을 보여 주고, 확인받으면 git 최상위 폴더에 쓴다. 쓴 파일은 커밋한다(커밋하지 않으면 워크트리에서는 훅이 꺼진다).

업데이트는 `/plugin marketplace update frontend-development-plugin` 뒤 `/plugin update seokit-frontend`.

## 구조

```
seokit/
├── .claude-plugin/
│   ├── marketplace.json        마켓플레이스 정의
│   └── plugin.json             플러그인 매니페스트 (version 없음, 커밋이 곧 버전)
├── .claude/docs-map.md         이 레포의 코드↔문서 대응표
├── workflow.md                 작업 흐름. opt-in 레포에선 세션 시작 때 주입된다
├── skills/
│   ├── init/SKILL.md           레포를 조사해 docs-map.md 를 만든다 (사용자가 직접 호출)
│   ├── tdd/
│   │   ├── SKILL.md            RED-GREEN-REFACTOR 절차
│   │   └── writing-good-tests.md  좋은 테스트의 두 원칙과 돌연변이 점검
│   ├── update-docs/SKILL.md    코드 수정 뒤 문서 맞추는 절차
│   └── explain-diff-notion/SKILL.md  커밋된 diff 설명을 Notion 페이지로
├── agents/api-scaffold.md      OpenAPI 스펙으로 도메인 API 모듈 생성·증분 반영
├── hooks/
│   ├── hooks.json              훅 배선
│   ├── lib.mjs                 opt-in 판정, 코드 파일 판정, 상태 파일 위치
│   ├── session-start.mjs       SessionStart: workflow.md 주입
│   ├── update-docs-track.mjs   PostToolUse: 고친 코드 파일 기록
│   ├── update-docs-gate.mjs    Stop: 기록이 있으면 한 번 막고 update-docs 요구
│   └── update-docs.test.mjs    훅 테스트
└── scripts/
    ├── fetch-spec.mjs          api-scaffold가 쓰는 OpenAPI 스펙 탐색·생성
    └── fetch-spec.test.mjs     스펙 스크립트 테스트
```

테스트: `node --test 'hooks/*.test.mjs' 'scripts/*.test.mjs'`
