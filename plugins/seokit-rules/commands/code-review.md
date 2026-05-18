---
description: Review pending changes against seokit's CODE_RULES.md (§3 MUST rules, §5 agent contract; §4 SHOULD with --strict). Reports findings grouped by rule section with file:line citations. Read-only — does not modify code.
argument-hint: "[diff | staged | last-edits | all] [--strict]"
allowed-tools: Bash(git diff:*), Bash(git status:*), Bash(git log:*), Bash(git ls-files:*), Bash(git rev-parse:*), Glob, Grep, Read, Task
---

# /code-review

`${CLAUDE_PLUGIN_ROOT}/CODE_RULES.md` (없으면 `../../CODE_RULES.md`) 기준으로 변경 사항을 감사한다. 코드를 수정하지 않는다 — 출력은 사람이 결정에 쓰는 입력이다.

## 1. Scope 결정 ($ARGUMENTS 파싱)

첫 번째 인자:
- `diff` (디폴트): `git diff` working tree vs HEAD
- `staged`: `git diff --cached`
- `last-edits`: 이번 세션에서 Claude가 Read/Edit/Write한 파일
- `all`: 추적되는 모든 `.ts`/`.tsx` 파일 (드물게 사용)

두 번째 인자 `--strict`: §4 SHOULD 규칙도 함께 검사.

`$ARGUMENTS`가 비면 `diff`로.

## 2. 변경 파일 목록 수집

scope에 따라 적절한 `git diff --name-only`로 `.ts`·`.tsx` 파일만 추린다. (CODE_RULES는 React/TS 전용)

## 3. Quick-scan (인라인)

`grep`으로 cheap signal을 빠르게 훑는다:

- `export default` → §3.5.2 (단 framework 강제 경로는 제외)
- `: any` (`as any` 포함) → §3.4.1
- `\w+!\.` (non-null assertion) → §3.4.4
- `export const \w+ = (?:async )?\([^)]*\) =>` (arrow component export 의심) → §3.1.1 후보, 다만 hook이나 일반 함수일 수도 있어 §3.1.1 확정은 컨텍스트 확인 후
- `useEffect\(\s*(?:async\s*)?\(` (익명 arrow callback) → §3.1.2

각 hit은 `file:line`로 기록.

## 4. Deep-scan — Task tool로 seokit-reviewer 호출

Task tool로 `subagent_type: "seokit-reviewer"` 호출. 프롬프트에:
- 변경 파일 경로 목록
- diff 범위 (`git diff HEAD --` 등)
- `--strict` 여부

subagent는 §3 전 항목 + (--strict면) §4 + §5 audit을 표 형식으로 반환한다.

## 5. §5 audit

- `git log -p` 범위 내에서 `package.json` 변경 → 새 dep 추가 여부 확인 → "§5.1 pause-question 기록 없음" 같은 verifiable 한도 내 flag
- 새 파일 중 `context/`·`store/` 경로 또는 `createContext(`/`create(`/`atom(` 포함 → §5.2 audit
- 새로 추가된 `interface`/`type` 선언 → §5.3 audit (필드 50% 겹침 휴리스틱은 subagent에 위임)

대화 transcript에 §5 질문이 있었는지는 명령 시점에서 확정 불가. "verifiable / not verifiable"로 표기하고 hard assertion 금지.

## 6. Output

다음 형식으로만 출력 (이모지 금지, preamble 금지):

```
### seokit review — <N> issues (scope=<scope>, strict=<bool>)

#### §3.1 함수·컴포넌트 선언
- `src/foo/Bar.tsx:12` — §3.1.1 component exported as arrow function. Suggest: `export function Bar(...)`.
- ...

#### §3.4 TypeScript
- ...

#### §5 에이전트 행동 규약
- `package.json:18` — new dep `lodash`. §5.1 pause-question: not verifiable from diff alone — flag for human review.

(요약 ≤3 문장)
```

findings 없으면:
```
No issues found. Reviewed against CODE_RULES.md §3 (and §4 with --strict).
```

## 7. 절대 금지

- 코드 자동 수정 (`Edit`/`Write` 호출 금지)
- finding을 회피하기 위한 paraphrase. 규칙 본문이 모호하면 원문 인용.
- §5의 hard assertion (transcript 부재로 검증 불가).
