# CODE_RULES.md — React 코드 규약 & 철학

## 1. 목적 및 핵심 철학

- 본 문서는 본인의 React 프로젝트 전반에 적용되는 실행 규약이자 코드 작성 철학을 담는다.
- **AI 에이전트와 사람이 동일하게** 본 문서를 기준으로 구현·리뷰·승인 판단을 한다.
- 각 룰 옆의 `[lint: ...]` 는 ESLint 로 자동 enforce 되는 항목, `[review-only]` 는 사람·에이전트 판단에 맡기는 항목임을 표기.

### 7대 핵심 개발 철학

1. **명시적 이름**: 익명 함수보다 named function. 스택 트레이스와 DevTools 에서 의도가 즉시 드러나도록 한다.
2. **`function` 키워드 지향**: 컴포넌트·모듈 최상위 헬퍼·`forwardRef`·`useEffect` 콜백 모두 named `function`. 화살표는 인라인 콜백(JSX 이벤트, `map`/`filter`, 함수 본문 내부의 짧은 보조 함수)만.
3. **선언적 조건문**: `if/else if` 체인이 3 분기 이상이 되면 lookup table(객체 맵) 또는 데이터 주도 분기로 전환한다.
4. **Self-Documenting Code**: "어떻게(how)" 를 설명하는 주석은 배제하고 명확한 네이밍으로 표현. "왜(why)" 주석은 환영. 도메인 용어로 영어 표현이 의미를 퇴색시키는 경우 한글 변수·Enum 을 허용한다.
5. **타입 재사용 우선**: 새 `interface`/`type` 을 만들기 전 기존 타입을 `Pick`/`Omit`/extension 으로 재사용 가능한지 점검. 합성이 3겹 이상으로 깊어지면 새 타입으로 분리.
6. **관심사 분리 / 단일 책임**: 함수·모듈·컴포넌트는 하나의 이유로만 변경되어야 한다.
7. **에이전트 협업 규약**: 영향 범위가 큰 결정(의존성 추가, 전역 상태 도입, 타입 재사용 가능성 발견)은 코드 작성 전 반드시 사용자에게 묻는다 (§5).

---

## 2. 규칙 레벨

| 레벨 | 의미 |
|---|---|
| `MUST` | 반드시 준수. lint 가 잡으면 빌드 실패. lint 불가 룰은 리뷰에서 반드시 지적. |
| `SHOULD` | 특별한 이유가 없으면 준수. 위반 시 PR 본문 또는 주석으로 사유 명시. |

---

## 3. MUST 규칙

### 3.1 함수·컴포넌트 선언

#### 3.1.1 컴포넌트는 named `function` 으로 선언 `[review-only]`

화살표 함수 대신 `function` 키워드 + 컴포넌트 이름으로 선언한다. `forwardRef`/`memo` 같은 HOC 래핑이 필요한 경우, 래퍼 호출의 인자로 named `function` 표현식을 넘긴다.

❌
```tsx
export const ProfileCard = ({ user }: ProfileCardProps) => {
  return <article>{user.name}</article>
}
```

✅
```tsx
export function ProfileCard({ user }: ProfileCardProps) {
  return <article>{user.name}</article>
}

// HOC 래핑 시
export const Modal = forwardRef<HTMLDivElement, ModalProps>(function Modal(props, ref) {
  return <div ref={ref}>{props.children}</div>
})
```

**왜**: hoist 가능, 스택 트레이스에 컴포넌트명 노출, React DevTools 트리에서 익명 식별자 방지.

#### 3.1.2 `useEffect` 콜백은 named function `[lint: local/useeffect-named-function]`

`useEffect` 의 콜백은 익명 화살표·익명 `function` 이 아닌 **이름 있는 `function` 표현식**으로 작성한다. cleanup `return () => {}` 은 그대로 익명 화살표로 둔다.

❌
```tsx
useEffect(() => {
  fetchUser(id)
  return () => abortFetch()
}, [id])
```

✅
```tsx
useEffect(function fetchUserOnIdChange() {
  fetchUser(id)
  return () => abortFetch()
}, [id])
```

**왜**: stack frame 에 effect 이름이 그대로 노출. 다중 effect 가 있는 컴포넌트에서 어떤 effect 가 동작 중인지 즉시 식별. 콜백 본문이 길어지지 않도록 자연스럽게 강제됨.

**이름 규칙**: 동사 + 대상 + 조건(선택). 예: `createMapInstance`, `swapTileLayers`, `syncPolygonFeatures`, `bindPointerHandlers`, `fetchUserOnIdChange`.

#### 3.1.3 모듈 최상위 헬퍼는 `function` 선언 `[review-only]`

컴포넌트 바깥, 파일 최상위에 정의되는 보조 함수는 `function` 선언으로 작성한다. 컴포넌트 함수 본문 내부의 핸들러도 `function` 선언을 우선한다.

❌
```tsx
const levelToZoom = (level: number): number => Math.max(0, Math.min(20, 18 - (level - 1)))
```

✅
```tsx
function levelToZoom(level: number): number {
  return Math.max(0, Math.min(20, 18 - (level - 1)))
}
```

**예외**: `useState` 초기화 함수, `useMemo`/`useCallback` 의 첫 인자, `Array.prototype.map`/`filter`/`reduce` 등의 콜백, JSX 이벤트 prop 의 인라인 핸들러는 화살표 함수 허용.

#### 3.1.4 Props 타입은 `interface` `[lint: @typescript-eslint/consistent-type-definitions]`

컴포넌트 Props 타입은 `interface ComponentNameProps` 형식으로 정의한다.

```tsx
interface ProfileCardProps {
  user: User
  variant?: 'compact' | 'full'
  onSelect?: (id: string) => void
}
```

**왜**: 선언 병합 가능, 더 명확한 IDE hover 표시, 라이브러리 타입 확장 패턴과 일관.

---

### 3.2 훅 사용

#### 3.2.1 `use` 접두사 `[lint: react-hooks/rules-of-hooks]`

커스텀 훅은 반드시 `use` 로 시작한다 (예: `useAuth`, `useUserList`).

#### 3.2.2 하나의 훅은 하나의 관심사 `[review-only]`

훅 안에서 여러 도메인의 상태·부수 효과를 동시에 관리하면 두 개로 분리한다.

#### 3.2.3 객체 반환 `[review-only]`

훅의 반환값은 구조 분해 가능하도록 **객체** 로 반환한다. 단일 값만 반환할 때만 예외적으로 raw value 허용.

❌
```ts
function useAuth() {
  return [user, setUser, isAuthenticated] as const
}
```

✅
```ts
function useAuth() {
  return { user, setUser, isAuthenticated }
}
```

#### 3.2.4 셸 훅 / 도메인 훅 분리 `[review-only]`

- **UI/플랫폼 훅** (`useTheme`, `useIsMobile`, `useMediaQuery`): 도메인 무관. shared/hooks 위치.
- **도메인 흐름 훅** (`useUserProfileFlow`, `useCheckoutForm`): API 호출 + toast/라우팅/캐시 정리 등 부수 효과 결합. 도메인 폴더 위치.

이 둘은 같은 파일에 섞지 않는다.

---

### 3.3 상태 관리

#### 3.3.1 로컬 상태 우선 `[review-only]`

가능한 한 `useState` 로컬 상태를 우선 사용한다. 전역 store/Context 도입은 다음 조건에서만 고려:
- 3 단계 이상 props drilling 발생 (§3.3.2)
- 라우트 간 공유 필요
- 진정 전역 (테마, 세션, locale)

#### 3.3.2 Props drilling 임계 = 3 단계 `[review-only]`

같은 prop 이 **3 hop 이상** 단순 forwarding 만으로 통과되면 Context 또는 상태 store 도입을 검토한다.

```
Page → Layout → Sidebar → UserBadge   ← 4 hop, Context 로 분리
              └─ user 전달 목적만
```

#### 3.3.3 서버 상태와 UI 상태 분리 `[review-only]`

API 응답 데이터(서버 상태)는 React Query/SWR 등 캐시 라이브러리에 위임하고, `useState` 로 복사·동기화하지 않는다. UI 상태(폼 입력값, 모달 open 여부 등)와 명확히 구분.

❌
```tsx
const { data: user } = useUserQuery(id)
const [localUser, setLocalUser] = useState(user)  // 서버→로컬 복사
useEffect(() => setLocalUser(user), [user])
```

✅
```tsx
const { data: user } = useUserQuery(id)
// 필요 시 mutate / setQueryData 로 캐시 직접 수정
```

---

### 3.4 TypeScript

#### 3.4.1 `any` 금지 `[lint: @typescript-eslint/no-explicit-any]`

`any` 대신 `unknown` + 타입 가드. 외부 라이브러리 타입이 부족할 때만 명시적 캐스팅과 사유 주석으로 예외.

#### 3.4.2 매직 넘버·문자열 상수화 `[lint: no-magic-numbers]`

의미 있는 숫자·문자열은 상수 또는 `as const` 객체로 추출한다. `0`, `1`, `-1` 같은 자명한 값은 예외.

#### 3.4.3 기존 타입 재사용 우선 — **에이전트는 묻는다** `[review-only]`

새로운 `interface`/`type` 을 작성하려는 시점에 **기존 타입을 `Pick`/`Omit`/`extends`/intersection 으로 표현 가능한지** 검토한다. 가능성이 있으면 **에이전트는 새 타입을 작성하기 전 사용자에게 그 방식을 채택할지 반드시 묻는다** (§5).

```ts
// 기존
interface User { id: string; name: string; email: string; passwordHash: string }

// ✅ 재사용
type PublicUser = Omit<User, 'passwordHash'>
interface AdminUser extends User { role: 'admin' }
```

단, `Pick`/`Omit`/`&` 합성이 3 겹 이상으로 깊어지면 가독성을 위해 새 타입으로 분리한다.

#### 3.4.4 Null 안전성 `[lint: @typescript-eslint/no-non-null-assertion]`

`!` non-null assertion 금지. Optional chaining(`?.`) + nullish coalescing(`??`) 사용.

---

### 3.5 파일 구조·임포트

#### 3.5.1 디자인 시스템 / 라이브러리 컴포넌트는 Compound Components `[review-only]`

재사용 가능한 라이브러리 레벨 컴포넌트(Card, Dialog, Tabs 등)는 Compound Components 패턴으로 작성한다.

```tsx
// 라이브러리 레벨
<Card>
  <Card.Header title="..." />
  <Card.Body>...</Card.Body>
  <Card.Footer actions={...} />
</Card>
```

slot 별 책임 분리, prop 인터페이스 평탄화 효과.

#### 3.5.2 애플리케이션 코드는 파일 분리 + Named Export `[lint: import/no-default-export]`

애플리케이션 레벨 컴포넌트는 한 파일당 하나의 책임으로 분리하고, default export 대신 **named export** 만 사용한다.

❌
```tsx
// UserPage.tsx
export default function UserPage() { ... }
function UserSidebar() { ... }
function UserMain() { ... }
```

✅
```tsx
// UserPage.tsx
export function UserPage() { ... }

// UserSidebar.tsx
export function UserSidebar() { ... }

// UserMain.tsx
export function UserMain() { ... }
```

**왜**: rename refactor 안전, import 자동완성 일관, lazy/dynamic import 시에도 명시적.

#### 3.5.3 임포트 정렬 `[lint: import/order]`

`builtin → external → internal → parent → sibling` 순서, 그룹 사이 빈 줄.

---

### 3.6 주석 정책

#### 3.6.1 "어떻게" 주석 배제, "왜" 주석 허용 `[review-only]`

코드가 무엇을 하는지(how) 설명하는 주석은 네이밍으로 대체한다. **그 결정을 내린 이유(why)**, 비자명한 제약(외부 API 동작, 브라우저 quirk), 도메인 배경은 주석으로 남긴다.

❌
```ts
// stores 를 id 로 매핑한다
const storeById = new Map(stores.map((s) => [s.id, s]))
```

✅
```ts
// 룩업이 빈번해 매 렌더 O(N) 탐색을 O(1) 로 줄임 (목록 ~5000개 기준 측정)
const storeById = new Map(stores.map((s) => [s.id, s]))
```

#### 3.6.2 `eslint-disable` 은 사유 주석 필수 `[review-only]`

`// eslint-disable-next-line` 또는 `// eslint-disable-line` 사용 시 바로 위 또는 같은 줄에 사유를 명시한다.

✅
```tsx
// el.style 직접 변경 — el 은 OL Overlay 가 imperative 로 관리하는 DOM. React 상태 아님.
// eslint-disable-next-line react-hooks/immutability
el.style.zIndex = '10'
```

---

### 3.7 네이밍

#### 3.7.1 풀네임, 축약어 지양 `[review-only]`

의미를 알 수 없는 축약어 금지. 단, 일반적으로 통용되는 축약(`id`, `url`, `db`, `props`, `ref`, `e` for event in handler, `i` for index)은 예외.

❌ `m`, `app`, `req`, `usr`, `desc`
✅ `member`, `application`, `request`, `user`, `description`

#### 3.7.2 Boolean 은 `is/has/can/should` 접두사 `[review-only]`

```ts
const isLoading = false
const hasPermission = true
const canEdit = userRole === 'admin'
const shouldRedirect = !isAuthenticated
```

#### 3.7.3 이벤트 핸들러 명명 `[review-only]`

- **prop 으로 받는 콜백**: `on*` (예: `onClick`, `onUserSelect`)
- **컴포넌트 내부 핸들러**: `handle*` (예: `handleSubmit`, `handleUserSelect`)

```tsx
function UserList({ onUserSelect }: UserListProps) {
  function handleUserSelect(id: string) {
    onUserSelect?.(id)
  }
  return <ul onClick={...} />
}
```

#### 3.7.4 도메인 용어는 그대로 / 한글 변수 허용 조건 `[review-only]`

- 백엔드·기획 도메인 용어는 **그대로 사용** (예: `Cohort`, `Application` — 한국화하지 않음).
- **한글 변수·Enum 값** 은 도메인 용어로 영어 표현이 의미를 퇴색시키거나 부자연스러운 경우에만 허용.
  - ✅ `예측세탁수요_백만원`, `시군구코드`, `행정동`
  - ❌ `사용자이름` (User name 으로 충분), `버튼클릭` (`handleButtonClick` 으로 충분)
- UI 텍스트·일반 로직 변수는 영어를 기본으로 한다.

---

## 4. SHOULD 규칙

### 4.1 접근성

- **시맨틱 HTML 우선** `[lint: jsx-a11y/no-static-element-interactions]`: `<button>`, `<nav>`, `<main>`, `<header>` 등 의미 있는 요소를 사용한다. `<div onClick>` 으로 버튼 흉내 금지.
- **키보드 접근성** `[lint: jsx-a11y/click-events-have-key-events]`: 인터랙티브 요소는 키보드로 도달·조작 가능.
- **이미지 대체 텍스트** `[lint: jsx-a11y/alt-text]`: `<img alt="...">` 필수, 장식 이미지는 `alt=""`.

### 4.2 성능

- **메모이제이션은 필요할 때만** `[review-only]`: `useMemo`/`useCallback` 을 반사적으로 감싸지 않는다. 프로파일링 또는 명확한 참조 동일성 요구가 있을 때만 사용.
- **불필요한 의존성 추가 지양** `[review-only]`: 새 npm 패키지 도입은 §5 의 묻기 규약 대상.

### 4.3 테스트

- **사용자 상호작용 중심**: 구현 디테일이 아니라 사용자가 보는/하는 것을 검증한다 (Testing Library 철학).
- **버그 수정 시 회귀 테스트** `[review-only]`: 재현 케이스를 테스트로 먼저 작성한 뒤 수정한다.
- **훅 단위 테스트**: `@testing-library/react` 의 `renderHook` 사용.

---

## 5. 에이전트 행동 규약

AI 에이전트는 다음 상황에서 **코드 작성·변경 전 반드시 사용자에게 묻는다**. 각 상황은 영향 범위가 크고, 묻지 않고 진행하면 되돌리는 비용이 크다.

### 5.1 새 npm 의존성 추가
새 패키지 설치 전 사용자에게 묻고 승인을 받는다. 후보 패키지가 여럿이면 옵션과 trade-off 를 함께 제시.

질문 템플릿:
> "이 작업에 `<패키지명>` 도입이 필요합니다. 이유: …. 대안: …. 진행할까요?"

### 5.2 새 전역 상태(Context / store) 도입
새 React Context 또는 상태 관리 store (Zustand/Jotai/Redux 등) 도입 전 사용자에게 묻는다. 로컬 상태나 prop 으로 해결 가능한지 먼저 검토한 결과를 함께 보고.

질문 템플릿:
> "이 상태는 N 곳에서 공유되어 Context/store 도입을 검토했습니다. 대안: …. 진행할까요?"

### 5.3 기존 타입 재사용 가능성
새 `interface`/`type` 을 작성하려는 시점에 기존 타입을 `Pick`/`Omit`/`extends` 로 재사용 가능하면, 그 방식을 채택할지 사용자에게 묻는다 (§3.4.3).

질문 템플릿:
> "`<기존 타입>` 에서 `<필드 목록>` 을 빼면 이 타입이 됩니다. `Omit<기존, '…'>` 으로 정의할까요, 새 타입으로 분리할까요?"

---

## 부록 A. lint 룰 매핑 요약

| 카테고리 | 표준/커스텀 룰 | 위치 |
|---|---|---|
| useEffect named function | `local/useeffect-named-function` (커스텀) | §3.1.2 |
| Props 는 `interface` | `@typescript-eslint/consistent-type-definitions` | §3.1.4 |
| `use` 접두사 | `react-hooks/rules-of-hooks` | §3.2.1 |
| `any` 금지 | `@typescript-eslint/no-explicit-any` | §3.4.1 |
| 매직 넘버 | `no-magic-numbers` | §3.4.2 |
| Non-null assertion 금지 | `@typescript-eslint/no-non-null-assertion` | §3.4.4 |
| Named export only | `import/no-default-export` | §3.5.2 |
| 임포트 정렬 | `import/order` | §3.5.3 |
| a11y 시맨틱/키보드/alt | `jsx-a11y/*` | §4.1 |

v0.1부터 lint 자동화는 seokit Claude plugin이 대신한다 — §3 `[lint:]` 표기는 의도 기록 용도로 유지하며 별도 ESLint 샘플은 제공하지 않는다.

## 부록 B. `[review-only]` 룰 체크리스트 (에이전트 셀프 점검)

코드 작성 후 PR/커밋 전 에이전트가 셀프 점검:

- [ ] 컴포넌트·모듈 최상위 헬퍼·useEffect 콜백이 모두 named `function` 인가
- [ ] 같은 prop 이 3 hop 이상 forwarding 되지 않는가
- [ ] 서버 응답을 `useState` 로 복사하지 않았는가
- [ ] 새 타입 작성 전 §3.4.3 검토를 사용자에게 물었는가
- [ ] 새 의존성·전역 상태가 §5 절차를 거쳤는가
- [ ] 주석이 "어떻게" 가 아니라 "왜" 를 설명하는가
- [ ] 한글 변수가 §3.7.4 의 도메인 용어 조건을 만족하는가
- [ ] Boolean 이름이 `is/has/can/should` 접두사를 가지는가
