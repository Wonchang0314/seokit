# seokit-api (Claude Code plugin)

openapi-typescript 산출물의 변경분만 도메인별 API 파일(api.ts·types.ts·queryKeys.ts·queries.ts)에 수술적으로 반영하는 agent 모음.

## 전제 스택

다음 조합 프로젝트만 지원:

- **API 타입 생성**: `openapi-typescript` (단일 산출 파일, `paths`/`operations`/`components` 구조)
- **데이터 페칭**: `@tanstack/react-query` (`queryOptions` / `mutationOptions` 팩토리)
- **도메인 구조**: `{domain}/{api.ts, types.ts, queryKeys.ts, queries.ts}` 4-file

monorepo·single repo 둘 다 동작. 패키지 매니저(pnpm·yarn·npm·bun)·경로·생성 명령·응답 wrapper 컨벤션은 시작 시 자동 정찰 후 `.api-scaffold.json`에 캐시.

## 설치

```
/plugin marketplace add github:Wonchang0314/seokit
/plugin install seokit-api@frontend-development-plugin
```

## 활성화 (프로젝트별)

적용할 프로젝트의 `.claude/settings.json`:

```json
{
  "enabledPlugins": {
    "seokit-api@frontend-development-plugin": true
  }
}
```

## 사용

agent는 자동 트리거되거나 Task tool로 명시 호출. 트리거 키워드: "API 스캐폴드", "타입 동기화", "openapi 갱신", "도메인 파일 업데이트" 등.

기본 흐름:
1. 첫 실행 시 정찰 → `.api-scaffold.json` 생성 (사용자 확인 후 저장)
2. 이후 실행은 마커 캐시 사용
3. `pnpm gen:api` (또는 감지된 명령) 실행 → diff 추출 → 변경분만 도메인 파일에 반영
4. typecheck로 검증

## 환경변수

- `OPENAPI_SPEC_URL` (선택): 생성 명령 실패 시 진단 메시지에서 참조하는 OpenAPI spec URL. 기본 `http://localhost:3000/api-docs-json`.

## 제약

- 위 스택 가정에 맞지 않는 프로젝트(orval·hey-api·SWR·RTK Query 등)에서는 동작하지 않음
- 도메인 0개인 신규 프로젝트는 첫 도메인의 응답 컨벤션을 사용자에게 직접 묻음
