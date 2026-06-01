# 선언형 비동기 UI 경계 규칙 추가 — 설계

날짜: 2026-05-22
대상 파일: `plugins/seokit-rules/CODE_RULES.md`, `plugins/seokit-rules/skills/seokit-rules/SKILL.md`

> **후속 변경 (2026-06-01)**: 이후 리포가 단일 플러그인 `seokit-frontend` 로 통합되며 위 대상 파일 경로는 루트의 `CODE_RULES.md`·`skills/seokit-rules/SKILL.md` 로 이동했다. 또한 `seokit-reviewer` 에이전트와 `/code-review` 커맨드는 제거되어, 본 문서의 에이전트 순회 관련 서술(§2 배치 근거의 `§3.1→§3.7` 순회, §4 의 "수정 불필요")은 더 이상 적용되지 않는다 — 리뷰는 스킬 인라인으로 수행된다. 아래 본문은 2026-05-22 결정 시점의 기록으로 보존한다.

## 1. 배경 / 문제

현재 `CODE_RULES.md` 에는 비동기 UI 의 로딩·에러 처리 방식을 규정하는 룰이 없다.
"선언적 조건문"(7대 철학 #3)과 "서버 상태와 UI 상태 분리"(§3.3.3)가 인접하지만,
로딩·에러 UI 를 명령형 분기(`if (isLoading) return ...`)로 그리는 것을 막거나
선언형 경계(`<Suspense>` / `ErrorBoundary`)를 우선하라는 규칙은 부재하다.

라우팅 라이브러리(TanStack Router, React Router 등)마다 라우트 레벨 로딩·에러
처리 방식이 다르므로, 규칙은 **라우터 무관한 컴포넌트 레벨 일반 해법**을 기준으로
삼아야 한다.

## 2. 결정 사항

- **강제 수준**: MUST §3, `[review-only]` (lint 불가). 신규 코드는 선언형 경계 필수.
  기존 명령형 코드의 리팩토링은 "권유" 수준으로 본문에 별도 명시.
- **선언형 기준**: 경계 필수. 비동기 UI 의 로딩·에러는 반드시 `<Suspense>` /
  `ErrorBoundary` 경계로 처리하고, 컴포넌트 본문의 `if (isLoading)` / `if (isError)`
  조기 return 분기를 금지한다. 둘을 묶은 공통 `<AsyncBoundary>` 컴포넌트를 표준으로
  제시한다.
- **배치**: `§3.3.3` 바로 뒤에 `§3.3.4` 신설. (§3.8 독립 섹션 안을 검토했으나,
  `seokit-reviewer` 가 `§3.1→§3.7` 순으로만 순회하므로 §3.8 은 리뷰 누락 +
  에이전트 파일 추가 수정 필요 → §3.3.4 채택.)
- **7대 핵심 철학 / 부록 A**: 변경 없음. 철학 #3 "선언적 조건문" 과는 별개 축이며,
  lint 룰이 없으므로 부록 A 매핑에도 추가하지 않는다.

## 3. 변경 내역

### 3.1 `CODE_RULES.md` — `§3.3.4` 신설

`§3.3.3` 과 `§3.4` 사이(현재 188~190행 부근)에 다음을 삽입한다.

```markdown
#### 3.3.4 비동기 UI 의 로딩·에러는 선언형 경계로 처리 `[review-only]`

서버 데이터를 쓰는 컴포넌트에서 로딩·에러 상태를 **명령형으로 다루지 않는다**. 다음을 금지한다:

- `useEffect` 안에서 직접 `fetch`/`axios` 를 호출하고 `setState` 로 data/loading/error 를 수동 관리
- 컴포넌트 본문에서 `if (isLoading) return <Spinner/>` / `if (isError) return <Error/>` 같은 조기 return 분기로 로딩·에러 UI 를 그리기

대신 로딩·에러 UI 를 **선언형 경계**로 끌어올린다. 로딩은 `<Suspense>`, 에러는 `ErrorBoundary` 가 담당하고, 데이터를 소비하는 컴포넌트는 "성공한 데이터" 만 가정하고 렌더한다. 이 둘은 항상 쌍으로 쓰이므로, 프로젝트는 둘을 묶은 공통 `<AsyncBoundary>` 컴포넌트를 하나 두고 그것을 표준으로 사용한다.

❌ 명령형
\`\`\`tsx
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
\`\`\`

✅ 선언형 경계
\`\`\`tsx
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
\`\`\`

**라우터 무관 원칙**: 컴포넌트 레벨 `<AsyncBoundary>` 가 라우팅 라이브러리와 무관한 일반 해법이다. 라우트 단위로는 라우터가 제공하는 동등 수단을 쓴다 — TanStack Router 의 `pendingComponent`/`errorComponent`, React Router 의 `HydrateFallback`/`errorElement` 등. 이들은 "라우트 레벨의 선언형 경계" 이며 같은 원칙의 다른 적용일 뿐이다. 어떤 라우터를 쓰든 핵심은 동일하다 — **로딩·에러는 분기가 아니라 경계로 선언한다.**

**왜**: 소비 컴포넌트가 "성공" 한 가지 경우만 다뤄 본문이 단순해진다. 로딩·에러 UI 가 트리의 한 곳에 모여 일관된다. `ErrorBoundary` 는 렌더링 중 throw 까지 잡으므로 처리 누락이 없다. §3.3.3 (서버 상태를 `useState` 로 복사 금지) 의 자연스러운 연장이다.

**기존 명령형 코드**: 작업 중 명령형 로딩·에러 처리를 발견하면 선언형 경계로의 리팩토링을 **권유**한다. 단 현재 작업 범위를 벗어난 강제 변경은 하지 않고, 사용자에게 리팩토링 제안만 남긴다.

**예외**:
- 뮤테이션(폼 제출, 삭제 등)의 pending/error 는 인라인 처리(버튼 비활성화, 인라인 메시지)를 허용한다. 경계 대상은 읽기(쿼리) 로딩·에러다.
- `ErrorBoundary` 는 React 기본 제공이 아니다. class 컴포넌트로 자체 구현하거나 `react-error-boundary` 도입(§5.1 묻기 대상)을 사용자와 합의한다. 도입 전까지는 라우터 레벨 에러 경계로 대체할 수 있다.
```

### 3.2 `CODE_RULES.md` — 부록 B 체크리스트 항목 추가

부록 B 의 8개 체크리스트 끝에 9번째 항목 추가:

```markdown
- [ ] 비동기 UI 의 로딩·에러를 명령형 분기가 아닌 선언형 경계(`<AsyncBoundary>` 등)로 처리했는가
```

### 3.3 `SKILL.md` — 부록 B 항목 수 동기화

`§2 적용` 의 "부록 B (review-only 셀프 체크리스트) **8개 항목** walk" →
"**9개 항목** walk" 로 수정.

## 4. 영향 범위 / 비영향

- `seokit-reviewer` 에이전트: `§3.3` 을 이미 순회하므로 `§3.3.4` 가 자동 포함. 수정 불필요.
- 부록 A (lint 룰 매핑): 변경 없음 (lint 룰 없는 `[review-only]` 규칙).
- 7대 핵심 철학: 변경 없음.

## 5. 검증

- `CODE_RULES.md` 의 `§3.3` → `§3.4` 사이에 `§3.3.4` 가 번호 순서대로 삽입되었는지 확인.
- 부록 B 체크리스트 항목이 8개 → 9개 인지 확인.
- `SKILL.md` 본문에 "8개" 표기가 남아 있지 않은지 확인.
