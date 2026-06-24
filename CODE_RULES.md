# CODE_RULES.md — React 코드 규약 & 철학

## 1. 목적 및 핵심 철학

- 본 문서는 본인의 React 프로젝트 전반에 적용되는 **코드 작성 규약**이자 컨벤션 철학을 담는다.
- 사람과 AI 에이전트가 **동일한 기준**으로 본 문서를 따라 구현·리뷰한다.
- 각 룰 옆의 `[lint: ...]` 는 ESLint 로 자동 enforce 되는 항목, `[review-only]` 는 사람·에이전트 판단에 맡기는 항목임을 표기.

### 5대 핵심 철학

1. **명시적 이름**: 익명 함수보다 named function. 스택 트레이스와 DevTools 에서 의도가 즉시 드러나도록 한다.
2. **`function` 키워드 지향**: 컴포넌트·모듈 최상위 헬퍼·`forwardRef`·`useEffect` 콜백 모두 named `function`. 화살표는 인라인 콜백(JSX 이벤트, `map`/`filter`, 함수 본문 내부의 짧은 보조 함수)만.
3. **선언적 조건문**: `if/else if` 체인이 3 분기 이상이 되면 lookup table(객체 맵) 또는 데이터 주도 분기로 전환한다.
4. **Self-Documenting Code**: "어떻게(how)" 를 설명하는 주석은 배제하고 명확한 네이밍으로 표현. "왜(why)" 주석은 환영. 도메인 용어로 영어 표현이 의미를 퇴색시키는 경우 한글 변수·Enum 을 허용한다.
5. **관심사 분리 / 단일 책임**: 함수·모듈·컴포넌트는 하나의 이유로만 변경되어야 한다.

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

---

### 3.2 상태 관리

#### 3.2.1 Props drilling 임계 = 3 단계 `[review-only]`

같은 prop 이 **3 hop 이상** 단순 forwarding 만으로 통과되면 Context 또는 상태 store 도입을 검토한다. 그 전까지는 `useState` 로컬 상태를 우선한다.

```
Page → Layout → Sidebar → UserBadge   ← 4 hop, Context 로 분리
              └─ user 전달 목적만
```

#### 3.2.2 비동기 UI 의 로딩·에러는 선언형 경계로 처리 `[review-only]`

서버 데이터를 쓰는 컴포넌트에서 로딩·에러 상태를 **명령형으로 다루지 않는다**. 다음을 금지한다:

- `useEffect` 안에서 직접 `fetch`/`axios` 를 호출하고 `setState` 로 data/loading/error 를 수동 관리
- 컴포넌트 본문에서 `if (isLoading) return <Spinner/>` / `if (isError) return <Error/>` 같은 조기 return 분기로 로딩·에러 UI 를 그리기

대신 로딩·에러 UI 를 **선언형 경계**로 끌어올린다. 로딩은 `<Suspense>`, 에러는 `ErrorBoundary` 가 담당하고, 데이터를 소비하는 컴포넌트는 "성공한 데이터" 만 가정하고 렌더한다. 이 둘은 항상 쌍으로 쓰이므로, 프로젝트는 둘을 묶은 공통 `<AsyncBoundary>` 컴포넌트를 하나 두고 그것을 표준으로 사용한다.

서버 응답 데이터(서버 상태)는 React Query/SWR 등 캐시 라이브러리에 위임하고 `useState` 로 복사·동기화하지 않는다 — 그래야 소비 컴포넌트가 성공 데이터만 가정할 수 있다.

❌ 명령형
```tsx
function UserProfile({ id }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(function fetchUserOnIdChange() {
    fetchUserById(id)
      .then(setUser)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  return <article>{user!.name}</article>
}
```

✅ 선언형 경계
```tsx
// AsyncBoundary.tsx — 프로젝트 공통, 한 번만 작성
interface AsyncBoundaryProps {
  pending: ReactNode
  errorFallback: (props: { error: Error; reset: () => void }) => ReactNode
  children: ReactNode
}

export function AsyncBoundary({ pending, errorFallback, children }: AsyncBoundaryProps) {
  return (
    <ErrorBoundary fallbackRender={errorFallback}>
      <Suspense fallback={pending}>{children}</Suspense>
    </ErrorBoundary>
  )
}

// 소비 컴포넌트 — 성공 데이터만 가정
function UserProfile({ id }: UserProfileProps) {
  const { data: user } = useSuspenseQuery(userQuery(id))
  return <article>{user.name}</article>
}

// 조립부
<AsyncBoundary pending={<UserSkeleton />} errorFallback={UserErrorFallback}>
  <UserProfile id={id} />
</AsyncBoundary>
```

**라우터 무관 원칙**: 컴포넌트 레벨 `<AsyncBoundary>` 가 라우팅 라이브러리와 무관한 일반 해법이다. 라우트 단위로는 라우터가 제공하는 동등 수단을 쓴다 — TanStack Router 의 `pendingComponent`/`errorComponent`, React Router 의 `HydrateFallback`/`errorElement` 등. 이들은 "라우트 레벨의 선언형 경계" 이며 같은 원칙의 다른 적용일 뿐이다. 어떤 라우터를 쓰든 핵심은 동일하다 — **로딩·에러는 분기가 아니라 경계로 선언한다.**

**왜**: 소비 컴포넌트가 "성공" 한 가지 경우만 다뤄 본문이 단순해진다. 로딩·에러 UI 가 트리의 한 곳에 모여 일관된다. `ErrorBoundary` 는 렌더링 중 throw 까지 잡으므로 처리 누락이 없다.

**기존 명령형 코드**: 작업 중 명령형 로딩·에러 처리를 발견하면 선언형 경계로의 리팩토링을 **권유**한다. 단 현재 작업 범위를 벗어난 강제 변경은 하지 않고, 사용자에게 리팩토링 제안만 남긴다.

**예외**:
- 뮤테이션(폼 제출, 삭제 등)의 pending/error 는 인라인 처리(버튼 비활성화, 인라인 메시지)를 허용한다. 경계 대상은 읽기(쿼리) 로딩·에러다.
- `ErrorBoundary` 는 React 기본 제공이 아니다. class 컴포넌트로 자체 구현하거나 `react-error-boundary` 도입을 사용자와 합의한다. 도입 전까지는 라우터 레벨 에러 경계로 대체할 수 있다.

#### 3.2.3 쿼리 호출 형태 — 순수 조회는 query options 직접 호출 `[review-only]`

서버 조회·뮤테이션의 호출 형태를 **데이터 가공·부수효과 결합 여부**로 가른다.

- **순수 조회/뮤테이션** — `queryFn` 응답을 그대로 반환하고, `select` 전처리도 없고, toast/라우팅/캐시 무효화 같은 부수효과도 결합돼 있지 않은 경우: `queryOptions`/`mutationOptions` 팩토리를 정의·export 하고, 소비 컴포넌트에서 `useSuspenseQuery`/`useQuery`/`useMutation` 을 **직접 호출**한다. 단순 위임만 하는 커스텀 훅(`useUserQuery` 등)으로 감싸지 않는다.
- **가공·결합 조회** — `select` 로 필터·정렬·파생, 여러 쿼리 조합, 뮤테이션의 `onSuccess` toast/라우팅/캐시 무효화 등 부수효과가 결합되는 경우에만 커스텀 훅으로 분리한다. 이때 훅은 API 호출과 부수효과를 묶는 **도메인 흐름 훅**(`useUserProfileFlow`, `useDeleteUser` 등)이며 도메인 폴더에 둔다.

❌ 위임만 하는 래핑
```ts
// useUserQuery.ts — query options 결과를 그대로 넘기기만 함
function useUserQuery(id: string) {
  return useSuspenseQuery(userQuery(id))
}
```

✅ query options 직접 호출
```ts
// queries/user.ts — query options 팩토리 (단일 출처)
export function userQuery(id: string) {
  return queryOptions({
    queryKey: ['user', id],
    queryFn: () => fetchUserById(id),
  })
}

// 소비 컴포넌트 — import 해서 직접 호출
function UserProfile({ id }: UserProfileProps) {
  const { data: user } = useSuspenseQuery(userQuery(id))
  return <article>{user.name}</article>
}
```

✅ 가공·부수효과가 있으면 도메인 훅으로 (예외)
```ts
// select 전처리 → 훅으로 분리
function useActiveUsers() {
  return useQuery({
    ...usersQuery(),
    select: (users) => users.filter((user) => user.isActive),
  })
}

// 뮤테이션 + 부수효과 → 도메인 훅으로 분리
function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    ...deleteUserMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      toast.success('삭제되었습니다')
    },
  })
}
```

**왜**: 위임만 하는 훅은 호출 한 겹을 늘리고 query options 의 재사용성(prefetch, `setQueryData`, 다른 쿼리와의 조합)을 가린다. query options 를 직접 import 하면 컴포넌트·prefetch·테스트가 같은 단일 출처를 공유한다. 가공·부수효과가 있을 때만 훅이라는 경계가 실제 값을 한다 — §3.2.2(선언형 경계)의 자연스러운 연장이다.

---

### 3.3 파일 구조·임포트

#### 3.3.1 디자인 시스템 / 라이브러리 컴포넌트는 Compound Components `[review-only]`

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

#### 3.3.2 임포트 정렬 `[review-only]`

`builtin → external → internal → parent → sibling` 순서, 그룹 사이 빈 줄.

---

### 3.4 주석 정책

#### 3.4.1 "어떻게" 주석 배제, "왜" 주석 허용 `[review-only]`

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

#### 3.4.2 `eslint-disable` 은 사유 주석 필수 `[review-only]`

`// eslint-disable-next-line` 또는 `// eslint-disable-line` 사용 시 바로 위 또는 같은 줄에 사유를 명시한다.

✅
```tsx
// el.style 직접 변경 — el 은 OL Overlay 가 imperative 로 관리하는 DOM. React 상태 아님.
// eslint-disable-next-line react-hooks/immutability
el.style.zIndex = '10'
```

---

### 3.5 네이밍

#### 3.5.1 풀네임, 축약어 지양 `[review-only]`

의미를 알 수 없는 축약어 금지. 단, 일반적으로 통용되는 축약(`id`, `url`, `db`, `props`, `ref`, `e` for event in handler, `i` for index)은 예외.

❌ `m`, `app`, `req`, `usr`, `desc`
✅ `member`, `application`, `request`, `user`, `description`

#### 3.5.2 Boolean 은 `is/has/can/should` 접두사 `[review-only]`

```ts
const isLoading = false
const hasPermission = true
const canEdit = userRole === 'admin'
const shouldRedirect = !isAuthenticated
```

#### 3.5.3 이벤트 핸들러 명명 `[review-only]`

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

#### 3.5.4 도메인 용어는 그대로 / 한글 변수 허용 조건 `[review-only]`

- 백엔드·기획 도메인 용어는 **그대로 사용** (예: `Cohort`, `Application` — 한국화하지 않음).
- **한글 변수·Enum 값** 은 도메인 용어로 영어 표현이 의미를 퇴색시키거나 부자연스러운 경우에만 허용.
  - ✅ `예측세탁수요_백만원`, `시군구코드`, `행정동`
  - ❌ `사용자이름` (User name 으로 충분), `버튼클릭` (`handleButtonClick` 으로 충분)
- UI 텍스트·일반 로직 변수는 영어를 기본으로 한다.

---

## 부록 A. lint 룰 매핑 요약

| 카테고리 | 표준/커스텀 룰 | 위치 |
|---|---|---|
| useEffect named function | `local/useeffect-named-function` (커스텀) | §3.1.2 |

v0.1부터 lint 자동화는 seokit Claude plugin의 **PostToolUse hook**이 담당한다 — `.ts`/`.tsx` Edit/Write 직후 hook(`hooks/lint-check.mjs`)이 **설치처 ESLint**를 실행해 위 표의 `[lint:]` 룰(현재 `local/useeffect-named-function` 1개)을 결정적으로 차단한다(`decision:block`, 모델 판단 안 끼어듦).

- **동봉 위치**: 플러그인의 `eslint/seokit.config.js`(enforce 룰 선언) + `eslint/rules/useeffect-named-function.js`(커스텀 룰 — 표준 룰엔 없어 직접 작성).
- **전제조건**: 설치처 `node_modules`에 `eslint`(9, flat config) + `@typescript-eslint/parser`. 미설치 시 hook은 통과하고 **review-only 폴백**(skill만 동작).
- **`[review-only]` 룰**: ESLint로 검증 불가. seokit-rules skill의 셀프 점검이 담당하며 결정적 차단 대상이 아니다.

운영·디버깅(전제조건, 트러블슈팅)은 README의 "Lint 강제 / 트러블슈팅" 절 참조.
