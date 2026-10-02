---
name: init
description: 프로젝트에 seokit 워크플로우를 켠다. 레포를 조사해 코드↔문서 대응표(.claude/docs-map.md) 초안을 만들고, 사용자 확인을 받은 뒤 git 최상위 폴더에 쓴다. 이미 있으면 갱신 모드로 경로를 점검한다.
disable-model-invocation: true
---

# init — 레포에 docs-map.md 만들기

seokit 훅은 git 최상위 폴더에 `.claude/docs-map.md` 가 있을 때만 켜진다. 이 스킬은 레포를 한 번 조사해 그 대응표를 만든다. 조사 결과에는 추측이 섞이므로 **사람이 확인한 뒤에만 파일을 쓴다.**

범위는 `docs-map.md` 한 파일이다. 문서가 없거나 낡은 곳을 찾아도 고치거나 만들지 않고 보고만 한다.

## 절차

### 1. 위치 확정

- `git rev-parse --show-toplevel` 로 최상위 폴더를 구한다. 모노레포여도 파일은 반드시 여기(`<root>/.claude/docs-map.md`) 하나다. 훅이 최상위에서만 마커를 찾고, 수정 파일도 최상위 기준 경로(`frontend/src/...`)로 기록하기 때문이다.
- 지금 위치가 워크트리면(`git rev-parse --git-dir` 과 `--git-common-dir` 이 다름) 알린다. 여기서 쓴 파일은 커밋해야 다른 워크트리와 본 작업 폴더에도 생긴다.

### 2. 기존 마커 확인 → 갱신 모드

- `.claude/docs-map.md` 가 있으면 새로 만들지 않고 갱신 모드로 간다. 표의 코드·문서 경로가 아직 있는지 하나씩 검사하고, 없어진 줄과 표에 없는 새 모듈만 초안으로 제시한다.
- 옛 방식인 `.claude/skills/update-docs/SKILL.md` 만 있으면, 그 안의 대응표를 `docs-map.md` 로 옮길지 묻는다. 옮긴 뒤 옛 파일을 지울지는 따로 묻는다(둘 다 있어도 훅은 동작한다).

### 3. 레포 구조 파악

- **모노레포 판정** — 최상위 바로 아래에 각자 `CLAUDE.md` 나 `.claude/` 를 가진 폴더(예: `frontend/`, `backend/`)가 있으면 모노레포로 보고, 표를 앱별 구역(`## frontend`, `## backend`)으로 나눈다. 앱마다 문서를 두는 방식이 다를 수 있으니 구역별로 따로 조사한다.
- **조사 제외** — `node_modules/`, `bin/`, `build/`, `dist/`, `out/`, `target/`, `.next/`, `coverage/`, `.claude/worktrees/`, 그 밖에 `.gitignore` 에 걸리는 폴더. 빌드 결과물을 코드 영역으로 잡지 않는다.

### 4. 문서 위치 조사

앱(구역)마다 아래를 찾는다.

- `CLAUDE.md` — 루트, 앱 폴더, 그리고 더 깊은 곳(예: 백엔드 도메인 폴더 안 `CLAUDE.md`)까지
- `.claude/skills/*/SKILL.md` 와 같은 폴더의 `features/`(명세), `references/`
- `docs/`, `README.md`

**문서 쪽 경로는 실제로 있는 것만 표에 넣는다.** `CLAUDE.md` 에 "`.claude/<module>.md` 를 보라"고 적혀 있어도 그 파일이 없으면 넣지 않는다. 이런 낡은 참조는 모아 두었다가 6단계 보고에 "CLAUDE.md 가 가리키는 경로가 없음"으로 알린다.

### 5. 코드 영역 조사와 짝짓기

- 코드 모듈 단위를 찾는다: `src/features/*`, `src/domains/*`, 백엔드 도메인 패키지(`src/main/java/.../domain/*`), 워크스페이스 패키지 등.
- 모듈마다 짝 문서를 **근거 순서대로** 찾는다.
  1. 이름 일치 — `features/crm` ↔ `skills/crm/`
  2. 문서 안에 적힌 코드 경로 — 문서 본문·파일 지도 표에서 그 모듈 경로를 grep 한다. 이름이 달라도(`features/crm` ↔ `skills/crm-dashboard/`) 여기서 잡힌다.
  3. 코드 폴더 안의 문서 — 모듈 폴더에 `CLAUDE.md`·`README.md` 가 있으면 그것.
- 근거가 하나도 없는데 이름이 비슷해 보이는 짝은 **"미확인"** 으로 표시한다. 추측으로 표에 넣지 않는다.
- 문서 형태가 모듈마다 다르면 그대로 적는다(파일 지도만 있는 모듈, 명세 `features/*.md` 가 있는 모듈, `references/` 를 쓰는 모듈). 한 형태로 통일하려 하지 않는다.
- 짝 문서가 없는 모듈은 **"대상 없음" 후보**로 모은다.

### 6. 초안 제시와 확인

초안 전체를 보여 주고, 아래를 **한 번에 모아** `AskUserQuestion` 으로 묻는다. 항목마다 따로 묻지 않는다.

- **미확인 짝** — 맞는지, 아니면 어느 문서인지
- **"대상 없음" 후보** — 대상 없음으로 적을지, 문서를 만들 계획이 있는지(만드는 건 이 스킬 범위 밖이다. 계획이 있어도 지금은 대상 없음으로 적고 보고에 남긴다)
- **다른 팀·외부가 관리하는 영역** — CLAUDE.md·CODEOWNERS·문서 머리말에 담당이 따로 적힌 모듈이 있으면: 표에서 뺄지(대상 없음), 그쪽 문서만 가리킬지
- **낡은 참조** — 4단계에서 찾은 없는 경로 목록(알림만, 고치지 않음)

"대상 없음" 줄은 반드시 적는다. 적지 않으면 그 영역을 고칠 때마다 update-docs 가 대응표에서 답을 못 찾아 헛되이 문서를 뒤진다.

### 7. 쓰기

확인받은 내용으로 `<root>/.claude/docs-map.md` 를 쓴다. 경로는 모두 **최상위 기준**으로 적는다(`frontend/src/features/...`). 앱 폴더 기준으로 적으면 훅이 넘기는 수정 파일 목록과 맞지 않는다.

### 8. 안내

- 수정 기록 훅, 종료 전 점검 훅, 추천 표시 차단 훅은 호출될 때마다 마커를 보므로 **지금 바로 켜진다.** 작업 흐름·질문 방식 안내(workflow.md·SessionStart.md 주입)는 **다음 세션부터** 들어간다.
- **커밋하라고 안내한다.** 워크트리는 저마다 git 최상위 폴더가 따로 있어서, `docs-map.md` 를 커밋하지 않으면 워크트리 작업에서는 훅이 꺼진다.
- 5·6단계에서 나온 문서 공백(대상 없음으로 둔 모듈, 낡은 참조)을 목록으로 남긴다.

## docs-map.md 형식

단일 앱이면 표 하나, 모노레포면 앱별 구역으로 나눈다.

```markdown
# 코드 → 문서 대응표

## frontend

| 바뀐 코드 | 고칠 문서 |
|---|---|
| `frontend/src/features/whitespace/**` | `frontend/.claude/skills/whitespace/SKILL.md`(파일 지도) + 같은 폴더 `features/*.md`(명세) |
| `frontend/src/features/crm/**` | `frontend/.claude/skills/crm-dashboard/SKILL.md` |
| `frontend/src/features/{approvals,auth}/**` | 대상 없음 |
| features 모듈 신설·이동·삭제 | `frontend/CLAUDE.md` 구조 트리 |

## backend

| 바뀐 코드 | 고칠 문서 |
|---|---|
| `backend/src/main/java/**/domain/voc/**` | 같은 폴더 `CLAUDE.md` |
| 그 외 | 대상 없음 |
```

문서·테스트 파일과 `.claude/`·`docs/` 아래는 훅이 세지 않으므로 표에 코드로 넣지 않는다.
