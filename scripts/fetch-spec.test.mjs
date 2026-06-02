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

test("specCandidatePaths covers known framework JSON spec endpoints", () => {
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
    assert.ok(paths.includes(expected), `missing ${expected}`);
  }
});

test("resolveSpecOrigin picks first candidate key by priority and returns origin", () => {
  const env = {
    REACT_APP_API_URL: "http://wrong.test",
    VITE_API_URL: "https://api.test:8080/v1/users?x=1",
  };
  assert.equal(resolveSpecOrigin(env), "https://api.test:8080");
});

test("resolveSpecOrigin returns null when no candidate present", () => {
  assert.equal(resolveSpecOrigin({ UNRELATED: "x" }), null);
});

test("resolveSpecOrigin returns null on unparseable url", () => {
  assert.equal(resolveSpecOrigin({ VITE_API_URL: "not a url" }), null);
});

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

function startServer(handler) {
  return new Promise((resolve) => {
    const server = createServer(handler);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, origin: `http://127.0.0.1:${port}` });
    });
  });
}

test("probeSpec returns first endpoint that responds with JSON spec", async () => {
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

test("probeSpec returns null when no candidate responds with JSON", async () => {
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

test("findLocalSpec returns path of first existing local spec file", () => {
  const dir = tmpProject({ "openapi.json": "{}" });
  try {
    assert.equal(findLocalSpec(dir), join(dir, "openapi.json"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("findLocalSpec returns null when no local spec file exists", () => {
  const dir = tmpProject({ "readme.md": "x" });
  try {
    assert.equal(findLocalSpec(dir), null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("resolveSpecInput prefers explicit url argument", async () => {
  const r = await resolveSpecInput({
    cwd: "/nope",
    explicit: "http://explicit.test/openapi.json",
    deps: { probeSpec: async () => { throw new Error("should not probe"); } },
  });
  assert.deepEqual(r, { source: "explicit", input: "http://explicit.test/openapi.json" });
});

test("resolveSpecInput falls back to env probing", async () => {
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

test("resolveSpecInput falls back to local file when probing fails", async () => {
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

test("resolveSpecInput returns null source when nothing found", async () => {
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

test("main returns 1 and does not run codegen when no spec found", async () => {
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

test("main runs codegen with explicit input and returns its status", async () => {
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
