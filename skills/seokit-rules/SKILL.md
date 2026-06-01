---
name: seokit-rules
description: Enforce seokit's React/TypeScript code conventions when writing or editing .tsx/.ts files. Use this skill whenever the user asks Claude to write, edit, refactor, or scaffold React components, hooks, TypeScript types, or any .tsx/.ts code. Loads CODE_RULES.md as the single source of truth and enforces §3 MUST rules and the §5 agent contract — pause and ask the user before adding a new npm dependency, introducing new global state (Context/store), or declaring a new type when an existing type can be Pick/Omit/extended for reuse.
---

# seokit-rules

이 skill의 단일 진실 출처는 `${CLAUDE_PLUGIN_ROOT}/CODE_RULES.md` (없으면 이 파일 기준 `../../CODE_RULES.md`). 모든 규칙·예외·질문 템플릿은 그 파일에 있다 — 인용·요약·해석을 만들지 말고 원문을 읽고 적용한다.

## 1. 로드

코드 작성·수정 요청을 받으면 가장 먼저 `CODE_RULES.md`를 읽는다. 같은 세션에서 이미 읽었다면 캐시된 내용 사용.

## 2. 적용

- **작성 전**: §3 MUST 규칙 (3.1~3.7) 전부 만족하도록 작성.
- **§5 STOP-AND-ASK**: 다음 세 가지는 **코드 변경 전 반드시 사용자에게 묻고 승인받은 뒤 진행**한다 — 새 npm 의존성 (§5.1), 새 전역 상태/Context/store (§5.2), 기존 타입 재사용 가능 시 새 타입 작성 (§5.3). 질문 템플릿은 CODE_RULES.md §5의 한국어 원문 그대로 사용.
- **작성 후**: CODE_RULES.md 부록 B (review-only 셀프 체크리스트) 9개 항목 walk. 실패 항목은 같은 응답에서 바로 수정 (§5 케이스는 묻고 진행).

## 3. 리뷰·심층 점검 요청

다음 중 하나라도 해당하면 변경 범위를 직접 읽고 CODE_RULES.md 대비 점검해 **구조화된 findings**(파일:라인 + 위반 규칙 섹션)로 보고한다:
- 사용자가 "review" / "check" / "audit" / "리뷰" / "점검" 요청
- §3.4.3 타입 재사용 분석을 위해 feature 디렉터리 전체 훑기 필요
- 큰 리팩터링 완료 후 "done" 선언 직전

findings는 §5 케이스(묻고 진행) 외에는 같은 응답에서 바로 수정한다.

## 4. 적용 범위

- `.ts` / `.tsx` 파일 전용. `.js` / `.jsx` / 그 외 언어는 이 skill 관할 아님.
- 테스트 파일(`*.test.*`, `*.spec.*`)은 §3.5.2 (named export) 외에는 느슨하게.
- 자동 생성 코드(`*.gen.ts`, `*.d.ts`)는 검사 안 함.

## 5. 모호하면

규칙 해석이 애매하면 paraphrase 하지 말고 CODE_RULES.md 해당 섹션을 인용한 뒤 사용자 판단을 구한다.
