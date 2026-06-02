import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

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

const LOCAL_SPEC_CANDIDATES = [
  "openapi.json",
  "openapi.yaml",
  "openapi.yml",
  "swagger.json",
];

export function findLocalSpec(cwd) {
  for (const name of LOCAL_SPEC_CANDIDATES) {
    const p = join(cwd, name);
    if (existsSync(p)) return p;
  }
  return null;
}

async function tryJson(url, fetchImpl) {
  try {
    const res = await fetchImpl(url, { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      // 객체에 openapi 또는 swagger 키가 있는 경우에만 스펙으로 인정
      if (json && typeof json === "object" && !Array.isArray(json) &&
          ("openapi" in json || "swagger" in json)) {
        return json;
      }
      return null; // 스펙이 아닌 JSON(예: 헬스체크 응답)이면 스킵
    } catch {
      return null; // HTML(Swagger UI 등)이면 스킵
    }
  } catch {
    return null; // 연결 실패 등
  }
}

export async function probeSpec(origin, { fetchImpl = fetch } = {}) {
  for (const path of specCandidatePaths()) {
    const url = `${origin}${path}`;
    const spec = await tryJson(url, fetchImpl);
    if (spec) return { url, spec };
  }
  return null;
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
      continue; // 유효하지 않은 URL이면 다음 후보로 이동
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

// 입력 소스 결정: 명시 인자 → env probing → 로컬 파일
export async function resolveSpecInput({ cwd, explicit, deps = {} }) {
  const probe = deps.probeSpec ?? probeSpec;

  if (explicit) {
    return { source: "explicit", input: explicit };
  }

  const origin = resolveSpecOrigin(parseEnvFiles(cwd));
  if (origin) {
    const probed = await probe(origin);
    if (probed) return { source: "probe", input: probed.url };
  }

  const local = findLocalSpec(cwd);
  if (local) return { source: "local", input: local };

  return { source: null, input: null };
}

// CLI 엔트리: 입력 결정 후 openapi-typescript 실행
export async function main(argv, deps = {}) {
  const cwd = deps.cwd ?? process.cwd();
  const log = deps.log ?? console.error;
  const run = deps.run ?? ((cmd, args, opts) => spawnSync(cmd, args, opts));

  const explicit = argv[0] ?? null;
  const outFile = argv[1] ?? "generated/api.ts";

  const { source, input } = await resolveSpecInput({ cwd, explicit, deps });
  if (!source) {
    log(
      "[fetch-spec] OpenAPI 스펙을 찾지 못했습니다. " +
        ".env*의 API URL(예: VITE_API_URL)로 probing 실패 + 로컬 스펙 파일 부재.\n" +
        "스펙 URL 또는 파일 경로를 첫 인자로 전달하세요: " +
        "node scripts/fetch-spec.mjs <url|file> [outFile]",
    );
    return 1;
  }

  log(`[fetch-spec] source=${source} input=${input} → ${outFile}`);
  const res = run("npx", ["-y", "openapi-typescript", input, "-o", outFile], {
    cwd,
    stdio: "inherit",
  });
  return res.status ?? 1;
}

// 직접 실행 시에만 main 구동 (import 시 부작용 없음)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
