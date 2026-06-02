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
