---
name: typescript-best-practice
description: TypeScript 모범사례. .ts·.tsx 파일을 읽거나 고칠 때, 그리고 code-reviewer 가 TypeScript diff 를 리뷰할 때 쓴다. 불가능한 상태를 타입으로 막고, 외부 데이터는 경계에서 한 번 파싱하고, 컴파일러를 속이지 않는다.
paths: ["**/*.ts", "**/*.tsx"]
---

# TypeScript 모범사례

바탕은 두 가지다.

- **타입 규율** — 불가능한 상태는 표현할 수 없게 만든다. 의미 있는 원시값엔 브랜드를 붙인다. 컴파일러를 속이지 않는다(`as`·`!`·`any`). 변형은 빠짐없이 처리한다. 권위 있는 스키마에서 타입을 끌어온다.
- **경계 규율** — 검증은 시스템 경계(네트워크·파일·환경 변수·외부 API)에서 한 번만 한다. 안쪽은 타입을 믿고, 비즈니스 로직은 순수 함수로 둔다.

규칙 이름은 리뷰에서 그대로 인용한다(예: `TS: No as casts`).

| 규칙 | 요약 |
|------|------|
| Discriminated unions | 변형은 `kind` 같은 리터럴 판별자로 모델링해 불가능한 조합을 표현할 수 없게 한다. boolean + 옵셔널 필드 묶음 금지. |
| Branded types | 섞이면 안 되는 원시값은 `& { readonly __brand: "X" }` 로 브랜드를 붙인다. 검증은 경계에서 한 번. |
| Constructive modeling | 잘못된 값을 만들 수 없는 모양으로 짓는다. 비어 있지 않음은 `[T, ...T[]]`, 짝수 길이는 `[T, T][]`, 구간은 `start` + `duration`. 런타임 가드나 주석으로 불변식을 지키지 않는다. |
| Simplest total type | 모든 연산이 total 이면 `T[]` 그대로 둔다. 느슨한 타입 때문에 `!`·캐스트·"절대 안 일어남" throw 가 생기는 곳만 `NonEmpty<T>` 로 강화한다. |
| `unknown` over `any` | 외부 데이터는 `unknown`. 좁힌 뒤 쓴다. |
| Schemas before guards | 외부 데이터용 타입 가드를 손으로 쓰기 전에 레포의 런타임 스키마 라이브러리를 찾고, 타입은 스키마에서 추론한다(`z.infer` 등). 스키마 하나만 둔다. |
| No `as` casts | `as` 는 런타임 크래시 후보다. 검증으로 증명된 뒤에만 쓴다. |
| Narrowing hierarchy | 판별자 switch > `in` > `typeof`/`instanceof` > 사용자 정의 타입 가드 > `as`. |
| Type guards | 주장한 것을 실제로 검사해야 한다. 거짓 가드는 `as` 보다 나쁘다(안전하다는 이름 뒤에 버그가 숨는다). 이름은 `isX`·`hasX`. |
| Exhaustiveness | default 분기에 `const _exhaustive: never = x;` 를 둬 새 변형이 생기면 컴파일 에러가 나게 한다. |
| `satisfies` over `as` | 리터럴 타입을 넓히지 않고 검증한다. |
| Boundary validation | 데이터가 들어오는 곳에서 이름 있는 도메인 타입으로 파싱한다. `Record<string, unknown>` 류는 그 파싱에서 끝난다. 안쪽에서 다시 검증하지 않는다. |
| Schema-derived types | 새 interface 를 선언하기 전에 생성된 타입에서 `Pick`/`Omit`/`Parameters`/`ReturnType`/`Awaited`/`typeof` 로 끌어온다. |
| Object args | 위치 인자 대신 객체로 넘겨 순서 실수를 막는다. 핫 패스(매 프레임 렌더, 토크나이저, 파서)는 예외. |
| Real tests | 돌릴 수 있는 건 mock 하지 않는다. 로컬에서 돌릴 수 없는 것만 mock. 자세한 기준은 `tdd` 스킬의 `writing-good-tests.md`. |
| Structured telemetry | 구조화된 로거로, id 하나로 디버깅할 수 있을 만큼 맥락을 남긴다. 배포 코드에 `console.log` 금지. |

예시: [`references/patterns.md`](references/patterns.md).
