import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// .env 파일 후보 (뒤에 올수록 우선순위 높음 — 나중 값이 앞 값을 덮어씀)
const ENV_FILE_ORDER = [
  ".env",
  ".env.development",
  ".env.local",
  ".env.development.local",
];

function parseEnvBody(body) {
  const out = {};
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

// 머신리더블 JSON 스펙 엔드포인트 후보 (HTML Swagger UI 아님). 순차 시도.
export function specCandidatePaths() {
  return [
    "/openapi.json", // FastAPI 등 범용
    "/v3/api-docs", // Spring springdoc
    "/api-docs-json", // NestJS swagger
    "/api-json", // NestJS swagger (대체)
    "/swagger.json", // 범용
    "/swagger/v1/swagger.json", // .NET
    "/api/schema/", // DRF spectacular
  ];
}

// 우선순위 순서대로 첫 존재 키 채택
const ENV_KEY_PRIORITY = [
  "VITE_API_URL",
  "NEXT_PUBLIC_API_URL",
  "REACT_APP_API_URL",
  "API_BASE_URL",
];

export function resolveSpecOrigin(env) {
  for (const key of ENV_KEY_PRIORITY) {
    const value = env[key];
    if (!value) continue;
    try {
      const u = new URL(value);
      return `${u.protocol}//${u.host}`;
    } catch {
      return null;
    }
  }
  return null;
}

export function parseEnvFiles(cwd) {
  let merged = {};
  for (const name of ENV_FILE_ORDER) {
    const p = join(cwd, name);
    if (existsSync(p)) {
      merged = { ...merged, ...parseEnvBody(readFileSync(p, "utf8")) };
    }
  }
  return merged;
}
