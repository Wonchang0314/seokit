# 코드 → 문서 대응표

이 레포의 명세는 `README.md` 의 구조 트리(파일별 한 줄 설명)다.

| 바뀐 코드 | 고칠 문서 |
|---|---|
| `hooks/**`, `skills/**`, `agents/**`, `scripts/**`, `workflow.md`, `SessionStart.md` — 파일 추가·삭제·이동, 역할 변경 | `README.md` 구조 트리 |
| 문서 점검 훅 동작(opt-in 조건·차단 규칙) | `README.md` + `skills/update-docs/SKILL.md` |
| 추천 표시 차단 훅 동작(검사 대상·표시 패턴) | `README.md` 흐름 요약 + `SessionStart.md` |
| opt-in 직후 켜지는 훅·주입 시점 | `skills/init/SKILL.md` 안내 단계 |
| `workflow.md` 단계 변경, `SessionStart.md` 규칙 변경 | `README.md` 흐름 요약 |
