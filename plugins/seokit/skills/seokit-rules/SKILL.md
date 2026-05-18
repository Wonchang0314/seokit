---
name: seokit-rules
description: Enforce seokit's React/TypeScript code conventions when writing or editing .tsx/.ts files. Use this skill whenever the user asks Claude to write, edit, refactor, or scaffold React components, hooks, TypeScript types, or any .tsx/.ts code. Enforces named function declarations, useEffect callback naming, hook conventions, interface-for-props, no-any, named exports, and the §5 agent contract — pause and ask the user before adding a new npm dependency, introducing new global state (Context/store), or declaring a new type when an existing type can be Pick/Omit/extended for reuse.
---

# seokit-rules

이 skill은 React/TypeScript 코드를 작성·수정·리팩터링할 때 항상 적용된다. 모든 판단의 근거는 `${CLAUDE_PLUGIN_ROOT}/CODE_RULES.md` (없으면 이 파일의 상위 디렉터리에서 `../../CODE_RULES.md`)다. 단순화·요약하지 말고, 모호하면 원문을 직접 인용한다.

## 1. 작성 전 — §3 MUST 체크리스트

코드 작성·수정 전 다음 항목을 항상 확인. (가장 자주 위반되는 항목 순)

- **§3.1.1** 컴포넌트는 `function ComponentName(...)` 으로 선언. arrow function export 금지.
- **§3.1.2** `useEffect` 콜백은 **named function expression**. `useEffect(() => { ... })` 대신 `useEffect(function loadUserOnIdChange() { ... })`.
- **§3.1.3** 모듈 최상위 헬퍼도 `function` 선언. (단 inline JSX 콜백, `useMemo`/`useCallback` 인자는 예외)
- **§3.1.4** Props 타입은 `interface ComponentNameProps` (type alias 금지).
- **§3.2.3** 훅 반환은 객체. 단일 값을 반환할 때만 그대로 반환.
- **§3.4.1** `any` 금지. 모르는 값은 `unknown` + 타입 가드.
- **§3.4.4** Non-null `!` 금지. `if (!x) return;` 같은 가드 사용.
- **§3.5.2** Application 코드는 **named export만**. `export default` 금지 (단 framework가 요구하는 page/route 파일은 예외 — CODE_RULES.md §3.5.2 단서 확인).
- **§3.5.3** 임포트 순서: 외부 → 내부 alias → 상대경로. 그룹 사이 빈 줄.
- **§3.6.1** 주석은 "왜"만. "어떻게"는 코드가 말하게.
- **§3.7.2** Boolean 은 `is`/`has`/`can`/`should` 접두사.
- **§3.7.3** 내부 핸들러 `handle*`, prop 콜백 `on*`.

## 2. §5 STOP-AND-ASK 게이트 (가장 중요)

다음 3가지 상황은 **코드를 쓰기 전 반드시 사용자에게 묻고, 명시적 승인 없이는 진행 금지**. v0.1은 의심되면 묻는 방향 (over-ask).

### 2.1 새 npm 의존성

**트리거** (하나라도 해당):
- `package.json`의 `dependencies`/`devDependencies`에 새 항목 추가
- `pnpm add` / `npm install` / `yarn add` / `bun add` bash 호출 (패키지명 포함)
- 현재 `package.json`에 없는 패키지를 import

**질문 (한국어 그대로 사용)**:
> "이 작업에 `<패키지명>` 도입이 필요합니다. 이유: <왜>. 대안: <옵션 + trade-off>. 진행할까요?"

대안 후보를 1~2개 먼저 검토한 결과를 함께 제시한다.

### 2.2 새 전역 상태 (Context / store)

**트리거**:
- `**/context/**`, `**/store/**` 경로에 새 파일
- 새 `React.createContext(` / `createStore(` / `create(` (zustand) / `atom(` (jotai) 호출
- `zustand` / `jotai` / `redux` / `@reduxjs/toolkit` / `mobx` 새 import

**선행 분석 (질문 전에 본인 답을 가질 것)**:
- 로컬 상태로 가능한가 (§3.3.1)?
- Props drilling 단계가 3 미만인가 (§3.3.2)?

**질문**:
> "이 상태는 <N> 곳에서 공유되어 Context/store 도입을 검토했습니다. 대안: <local state / props drilling 단계 수>. 진행할까요?"

### 2.3 기존 타입 재사용 가능성

**트리거**:
- 새 `interface X` 또는 `type X = { ... }` 작성 직전
- AND 같은 모듈/feature 디렉터리에 필드 50% 이상 겹치는 기존 타입 존재 (작성 전 `grep -r "interface " <feature dir>` 등으로 확인)

**질문**:
> "`<기존 타입>` 에서 `<필드 목록>` 을 빼면 이 타입이 됩니다. `Omit<기존, '…'>` 으로 정의할까요, 새 타입으로 분리할까요?"

**예외**: `Pick`/`Omit`/`&` 합성이 3겹 이상으로 깊어지면 새 타입을 선호 (§3.4.3 후단). 이 경우 묻지 않고 진행하되 commit/PR 메시지에 예외 사유 기록.

## 3. subagent로 escalate

다음 상황에서는 Task tool로 `seokit-reviewer` subagent를 호출. (인라인 점검으로 부족한 경우)

- 한 응답에서 변경 파일이 5개를 초과
- 사용자가 "review" / "check" / "audit" / "리뷰" / "점검" 등의 단어로 CODE_RULES.md 대비 검토를 요청
- §3.4.3 타입 재사용 분석을 위해 feature 디렉터리 전체를 훑어야 함
- 큰 리팩터링 완료 후 "done"이라고 말하기 전

단일 파일 인라인 수정에서는 호출하지 않는다 (이 skill 본문 체크리스트로 충분).

## 4. 작성 후 self-check — Appendix B

코드 작성·수정 후 PR/commit 직전 다음 체크리스트를 walk한다. 한 항목이라도 실패하면 같은 응답에서 추가 질문 없이 바로 고친다 (단 §5 케이스는 제외 — 묻고 진행).

- [ ] 컴포넌트·모듈 최상위 헬퍼·useEffect 콜백이 모두 named `function` 인가 (§3.1)
- [ ] 같은 prop이 3 hop 이상 forwarding 되지 않는가 (§3.3.2)
- [ ] 서버 응답을 `useState`로 복사하지 않았는가 (§3.3.3)
- [ ] 새 타입 작성 전 §3.4.3 검토를 사용자에게 물었는가
- [ ] 새 의존성·전역 상태가 §5 절차를 거쳤는가
- [ ] 주석이 "어떻게"가 아니라 "왜"를 설명하는가 (§3.6.1)
- [ ] 한글 변수가 §3.7.4의 도메인 용어 조건을 만족하는가
- [ ] Boolean 이름이 `is/has/can/should` 접두사를 가지는가 (§3.7.2)

## 5. 적용 범위 제한

- `.ts` / `.tsx` 파일에만 적용. `.js` / `.jsx` / `.py` / `.go` 등은 이 skill의 관할이 아님.
- 테스트 파일(`*.test.tsx`, `*.spec.ts`)은 §3.5.2 (named export) 외에는 느슨하게.
- 자동 생성 코드(`*.gen.ts`, `*.d.ts`)는 검사하지 않음.

## 6. 모르겠으면

규칙 해석이 모호하면 **paraphrase 하지 말고 CODE_RULES.md 원문을 인용**한 뒤 사용자 판단을 구한다. 잘못된 규칙 적용보다 한 줄 인용이 낫다.
