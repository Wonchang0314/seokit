import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseEnvFiles } from "./fetch-spec.mjs";

function tmpProject(files) {
  const dir = mkdtempSync(join(tmpdir(), "fetch-spec-"));
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(dir, name), body);
  }
  return dir;
}

test("parseEnvFiles merges files with .local overriding base", () => {
  const dir = tmpProject({
    ".env": "VITE_API_URL=http://base.test\n# comment\nFOO=1\n",
    ".env.local": 'VITE_API_URL="http://local.test"\n',
  });
  try {
    const env = parseEnvFiles(dir);
    assert.equal(env.VITE_API_URL, "http://local.test");
    assert.equal(env.FOO, "1");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
