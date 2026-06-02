import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseEnvFiles, resolveSpecOrigin, specCandidatePaths, probeSpec, findLocalSpec, resolveSpecInput, main } from "./fetch-spec.mjs";
import { createServer } from "node:http";

function tmpProject(files) {
  const dir = mkdtempSync(join(tmpdir(), "fetch-spec-"));
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(dir, name), body);
  }
  return dir;
}

test("specCandidatePaths는 알려진 프레임워크의 JSON 스펙 엔드포인트를 포함한다", () => {
  const paths = specCandidatePaths();
  for (const expected of [
    "/openapi.json",
    "/v3/api-docs",
    "/api-docs-json",
    "/api-json",
    "/swagger.json",
    "/swagger/v1/swagger.json",
    "/api/schema/",
  ]) {
    assert.ok(paths.includes(expected), `누락된 경로: ${expected}`);
  }
});

test("resolveSpecOrigin은 우선순위가 가장 높은 후보 키를 골라 origin을 반환한다", () => {
  const env = {
    REACT_APP_API_URL: "http://wrong.test",
    VITE_API_URL: "https://api.test:8080/v1/users?x=1",
  };
  assert.equal(resolveSpecOrigin(env), "https://api.test:8080");
});

test("resolveSpecOrigin은 후보 키가 하나도 없으면 null을 반환한다", () => {
  assert.equal(resolveSpecOrigin({ UNRELATED: "x" }), null);
});

test("resolveSpecOrigin은 파싱 불가능한 URL이면 null을 반환한다", () => {
  assert.equal(resolveSpecOrigin({ VITE_API_URL: "not a url" }), null);
});

test("parseEnvFiles는 .local 값이 base 값을 덮어쓰도록 파일을 병합한다", () => {
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

function startServer(handler) {
  return new Promise((resolve) => {
    const server = createServer(handler);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, origin: `http://127.0.0.1:${port}` });
    });
  });
}

test("probeSpec는 JSON 스펙으로 응답하는 첫 엔드포인트를 반환한다", async () => {
  const { server, origin } = await startServer((req, res) => {
    if (req.url === "/v3/api-docs") {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ openapi: "3.0.0", paths: {} }));
    } else {
      res.statusCode = 404;
      res.end("nope");
    }
  });
  try {
    const result = await probeSpec(origin);
    assert.equal(result.url, `${origin}/v3/api-docs`);
    assert.equal(result.spec.openapi, "3.0.0");
  } finally {
    server.close();
  }
});

test("probeSpec는 어떤 후보도 JSON으로 응답하지 않으면 null을 반환한다", async () => {
  const { server, origin } = await startServer((req, res) => {
    res.statusCode = 404;
    res.end("nope");
  });
  try {
    assert.equal(await probeSpec(origin), null);
  } finally {
    server.close();
  }
});

test("findLocalSpec는 존재하는 첫 로컬 스펙 파일의 경로를 반환한다", () => {
  const dir = tmpProject({ "openapi.json": "{}" });
  try {
    assert.equal(findLocalSpec(dir), join(dir, "openapi.json"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("findLocalSpec는 로컬 스펙 파일이 없으면 null을 반환한다", () => {
  const dir = tmpProject({ "readme.md": "x" });
  try {
    assert.equal(findLocalSpec(dir), null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("resolveSpecInput는 명시적 url 인자를 가장 우선한다", async () => {
  const r = await resolveSpecInput({
    cwd: "/nope",
    explicit: "http://explicit.test/openapi.json",
    deps: { probeSpec: async () => { throw new Error("should not probe"); } },
  });
  assert.deepEqual(r, { source: "explicit", input: "http://explicit.test/openapi.json" });
});

test("resolveSpecInput는 명시 인자가 없으면 env probing으로 fallback한다", async () => {
  const dir = tmpProject({ ".env": "VITE_API_URL=http://api.test\n" });
  try {
    const r = await resolveSpecInput({
      cwd: dir,
      explicit: null,
      deps: { probeSpec: async (origin) => ({ url: `${origin}/openapi.json`, spec: {} }) },
    });
    assert.deepEqual(r, { source: "probe", input: "http://api.test/openapi.json" });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("resolveSpecInput는 probing이 실패하면 로컬 파일로 fallback한다", async () => {
  const dir = tmpProject({
    ".env": "VITE_API_URL=http://api.test\n",
    "openapi.json": "{}",
  });
  try {
    const r = await resolveSpecInput({
      cwd: dir,
      explicit: null,
      deps: { probeSpec: async () => null },
    });
    assert.deepEqual(r, { source: "local", input: join(dir, "openapi.json") });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("resolveSpecInput는 아무것도 못 찾으면 source가 null이다", async () => {
  const dir = tmpProject({});
  try {
    const r = await resolveSpecInput({
      cwd: dir,
      explicit: null,
      deps: { probeSpec: async () => null },
    });
    assert.equal(r.source, null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("main은 스펙을 못 찾으면 codegen을 실행하지 않고 1을 반환한다", async () => {
  const dir = tmpProject({});
  let ran = false;
  try {
    const code = await main([], {
      cwd: dir,
      log: () => {},
      run: () => { ran = true; return { status: 0 }; },
      probeSpec: async () => null,
    });
    assert.equal(code, 1);
    assert.equal(ran, false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("main은 명시 입력으로 codegen을 실행하고 그 상태 코드를 반환한다", async () => {
  let calledWith = null;
  const code = await main(["http://x.test/openapi.json", "generated/api.ts"], {
    cwd: "/tmp",
    log: () => {},
    run: (cmd, args) => { calledWith = { cmd, args }; return { status: 0 }; },
  });
  assert.equal(code, 0);
  assert.equal(calledWith.cmd, "npx");
  assert.ok(calledWith.args.includes("http://x.test/openapi.json"));
  assert.ok(calledWith.args.includes("generated/api.ts"));
});

// Fix 1: 상위 우선순위 키가 유효하지 않은 URL이어도 하위 후보에서 유효한 값을 반환해야 함
test("resolveSpecOrigin은 상위 우선순위 키의 URL이 파싱 불가하면 다음 키로 넘어간다", () => {
  const env = {
    VITE_API_URL: "not-a-url",
    NEXT_PUBLIC_API_URL: "http://api.test",
  };
  assert.equal(resolveSpecOrigin(env), "http://api.test");
});

// Fix 2: openapi/swagger 키가 없는 JSON 응답은 스펙으로 인정하지 않아야 함
test("probeSpec는 모든 엔드포인트가 스펙이 아닌 JSON을 반환하면 null을 반환한다", async () => {
  const { server, origin } = await startServer((req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ status: "ok" }));
  });
  try {
    assert.equal(await probeSpec(origin), null);
  } finally {
    server.close();
  }
});
