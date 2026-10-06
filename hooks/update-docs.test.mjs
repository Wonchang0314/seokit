import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HOOKS = fileURLToPath(new URL(".", import.meta.url));

function tmpRepo({ optIn = "docs-map" } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "seokit-repo-")));
  spawnSync("git", ["init", "-q", root]);
  if (optIn === "docs-map") {
    mkdirSync(join(root, ".claude"), { recursive: true });
    writeFileSync(join(root, ".claude/docs-map.md"), "# map\n");
  } else if (optIn === "legacy") {
    mkdirSync(join(root, ".claude/skills/update-docs"), { recursive: true });
    writeFileSync(join(root, ".claude/skills/update-docs/SKILL.md"), "# legacy\n");
  }
  return root;
}

function run(script, input, stateDir) {
  const res = spawnSync("node", [join(HOOKS, script)], {
    input: typeof input === "string" ? input : JSON.stringify(input),
    env: { ...process.env, SEOKIT_STATE_DIR: stateDir },
    encoding: "utf8",
  });
  return { code: res.status, stdout: res.stdout, stderr: res.stderr };
}

function edit(root, rel, stateDir, sid = "s1") {
  return run("update-docs-track.mjs", { session_id: sid, tool_input: { file_path: join(root, rel) } }, stateDir);
}

function state(stateDir, sid = "s1") {
  const f = join(stateDir, `${sid}.json`);
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null;
}

const newStateDir = () => mkdtempSync(join(tmpdir(), "seokit-state-"));

// ── track ──

test("track: opt-in 레포의 코드 파일 수정을 레포별로 기록한다", () => {
  const root = tmpRepo();
  const sd = newStateDir();
  edit(root, "src/app.ts", sd);
  assert.deepEqual(state(sd), { [root]: ["src/app.ts"] });
});

test("track: 옛 .claude/skills/update-docs/SKILL.md 만 있어도 opt-in 으로 본다", () => {
  const root = tmpRepo({ optIn: "legacy" });
  const sd = newStateDir();
  edit(root, "src/app.ts", sd);
  assert.deepEqual(state(sd), { [root]: ["src/app.ts"] });
});

test("track: opt-in 표시가 없는 레포는 기록하지 않는다", () => {
  const root = tmpRepo({ optIn: null });
  const sd = newStateDir();
  edit(root, "src/app.ts", sd);
  assert.equal(state(sd), null);
});

test("track: 문서·테스트·.claude·docs 파일은 기록하지 않는다", () => {
  const root = tmpRepo();
  const sd = newStateDir();
  for (const rel of [
    "README.md",
    "notes.txt",
    "src/app.test.ts",
    "src/app.spec.tsx",
    "src/__tests__/a.ts",
    "tests/a.py",
    "src/test/java/A.java",
    ".claude/settings.json",
    "docs/guide.ts",
    "node_modules/x/index.js",
  ]) {
    edit(root, rel, sd);
  }
  assert.equal(state(sd), null);
});

test("track: 같은 파일을 여러 번 고쳐도 한 번만 기록한다", () => {
  const root = tmpRepo();
  const sd = newStateDir();
  edit(root, "a.ts", sd);
  edit(root, "b.ts", sd);
  edit(root, "a.ts", sd);
  assert.deepEqual(state(sd), { [root]: ["a.ts", "b.ts"] });
});

test("track: NotebookEdit 의 notebook_path 도 기록한다", () => {
  const root = tmpRepo();
  const sd = newStateDir();
  run("update-docs-track.mjs", { session_id: "s1", tool_input: { notebook_path: join(root, "nb.ipynb") } }, sd);
  assert.deepEqual(state(sd), { [root]: ["nb.ipynb"] });
});

test("track: 깨진 입력에도 0 으로 끝나고 아무것도 쓰지 않는다", () => {
  const sd = newStateDir();
  const res = run("update-docs-track.mjs", "not json", sd);
  assert.equal(res.code, 0);
  assert.equal(state(sd), null);
});

// ── gate ──

test("gate: 기록이 있으면 한 번 막고 목록을 알려 준 뒤 기록을 지운다", () => {
  const root = tmpRepo();
  const sd = newStateDir();
  edit(root, "src/app.ts", sd);
  const first = run("update-docs-gate.mjs", { session_id: "s1" }, sd);
  const out = JSON.parse(first.stdout);
  assert.equal(out.decision, "block");
  assert.ok(out.reason.includes("update-docs"));
  assert.ok(out.reason.includes(`[${root}]\n- src/app.ts`));
  assert.equal(state(sd), null);

  const second = run("update-docs-gate.mjs", { session_id: "s1" }, sd);
  assert.equal(second.stdout, "");
});

test("gate: 기록이 없으면 막지 않는다", () => {
  const sd = newStateDir();
  const res = run("update-docs-gate.mjs", { session_id: "s1" }, sd);
  assert.equal(res.code, 0);
  assert.equal(res.stdout, "");
});

test("gate: stop_hook_active 이면 막지 않고 기록만 지운다", () => {
  const root = tmpRepo();
  const sd = newStateDir();
  edit(root, "src/app.ts", sd);
  const res = run("update-docs-gate.mjs", { session_id: "s1", stop_hook_active: true }, sd);
  assert.equal(res.stdout, "");
  assert.equal(state(sd), null);
});

test("gate: 다른 세션의 기록으로는 막지 않는다", () => {
  const root = tmpRepo();
  const sd = newStateDir();
  edit(root, "src/app.ts", sd, "other");
  const res = run("update-docs-gate.mjs", { session_id: "s1" }, sd);
  assert.equal(res.stdout, "");
  assert.deepEqual(state(sd, "other"), { [root]: ["src/app.ts"] });
});

test("gate: 30개가 넘으면 30개만 보여 주고 나머지 개수를 적는다", () => {
  const sd = newStateDir();
  const files = Array.from({ length: 32 }, (_, i) => `f${i}.ts`);
  writeFileSync(join(sd, "s1.json"), JSON.stringify({ "/r": files }));
  const out = JSON.parse(run("update-docs-gate.mjs", { session_id: "s1" }, sd).stdout);
  assert.ok(out.reason.includes("- f29.ts\n- … 외 2개"));
  assert.ok(!out.reason.includes("- f30.ts"));
});

test("gate: 깨진 입력에도 0 으로 끝나고 막지 않는다", () => {
  const res = run("update-docs-gate.mjs", "{", newStateDir());
  assert.equal(res.code, 0);
  assert.equal(res.stdout, "");
});

// ── session-start ──

test("session-start: opt-in 레포면 작업 흐름을 additionalContext 로 넣는다", () => {
  const root = tmpRepo();
  const out = JSON.parse(run("session-start.mjs", { cwd: join(root) }, newStateDir()).stdout);
  assert.equal(out.hookSpecificOutput.hookEventName, "SessionStart");
  assert.ok(out.hookSpecificOutput.additionalContext.includes("## 신규 기능"));
  assert.ok(out.hookSpecificOutput.additionalContext.includes("# 질문 방식"));
});

test("session-start: opt-in 이 아니면 아무것도 출력하지 않는다", () => {
  const root = tmpRepo({ optIn: null });
  const res = run("session-start.mjs", { cwd: root }, newStateDir());
  assert.equal(res.code, 0);
  assert.equal(res.stdout, "");
});

test("session-start: 질문 방식 규칙(SessionStart.md)도 함께 넣는다", () => {
  const root = tmpRepo();
  const out = JSON.parse(run("session-start.mjs", { cwd: root }, newStateDir()).stdout);
  assert.ok(out.hookSpecificOutput.additionalContext.includes("# 질문 방식"));
  assert.ok(out.hookSpecificOutput.additionalContext.includes("## 신규 기능"));
});

test("session-start: 주입 내용이 additionalContext 상한(10,000자) 안에 든다", () => {
  const root = tmpRepo();
  const out = JSON.parse(run("session-start.mjs", { cwd: root }, newStateDir()).stdout);
  assert.ok(out.hookSpecificOutput.additionalContext.length < 10000);
});

// ── ask-user-question ──

function ask(root, options) {
  const input = { cwd: root, tool_name: "AskUserQuestion", tool_input: { questions: [{ question: "q?", header: "h", options }] } };
  return run("ask-user-question.mjs", input, newStateDir());
}

test("ask-user-question: 라벨에 (Recommended) 가 있으면 호출을 막고 이유를 돌려준다", () => {
  const res = ask(tmpRepo(), [{ label: "Zustand (Recommended)", description: "a" }, { label: "Context", description: "b" }]);
  const out = JSON.parse(res.stdout).hookSpecificOutput;
  assert.equal(out.hookEventName, "PreToolUse");
  assert.equal(out.permissionDecision, "deny");
  assert.ok(out.permissionDecisionReason.includes("추천"));
});

test("ask-user-question: (추천)·[권장]·대소문자·설명 안의 표시도 막는다", () => {
  for (const option of [
    { label: "A안 (추천)", description: "" },
    { label: "A안 [권장]", description: "" },
    { label: "A (recommended)", description: "" },
    { label: "A안（추천）", description: "" },
    { label: "A안", description: "(추천) 가장 단순하다" },
  ]) {
    const res = ask(tmpRepo(), [option, { label: "B안", description: "" }]);
    assert.equal(JSON.parse(res.stdout).hookSpecificOutput.permissionDecision, "deny", JSON.stringify(option));
  }
});

const FOUR = ["A", "B", "C", "D"].map((label) => ({ label, description: `${label} 설명` }));

test("ask-user-question: 추천 표시가 없으면 막지 않고 선택지만 섞은 입력을 'ask' 로 돌려준다", () => {
  const root = tmpRepo();
  const input = {
    cwd: root,
    tool_name: "AskUserQuestion",
    tool_input: {
      questions: [
        { question: "q1?", header: "h1", multiSelect: false, options: FOUR },
        { question: "q2?", header: "h2", multiSelect: true, options: FOUR.slice(0, 2) },
      ],
    },
  };
  const res = run("ask-user-question.mjs", input, newStateDir());
  assert.equal(res.code, 0);
  const out = JSON.parse(res.stdout).hookSpecificOutput;
  assert.equal(out.hookEventName, "PreToolUse");
  // allow 는 질문 UI 를 건너뛰고 빈 답을 돌려주는 사례가 있어(anthropics/claude-code#12672) ask 만 쓴다
  assert.equal(out.permissionDecision, "ask");
  const qs = out.updatedInput.questions;
  assert.equal(qs.length, 2);
  qs.forEach((q, i) => {
    const orig = input.tool_input.questions[i];
    assert.deepEqual({ ...q, options: undefined }, { ...orig, options: undefined });
    const byLabel = (a, b) => a.label.localeCompare(b.label);
    assert.deepEqual([...q.options].sort(byLabel), [...orig.options].sort(byLabel));
  });
});

test("ask-user-question: 실행할 때마다 첫 선택지가 바뀐다", () => {
  const root = tmpRepo();
  const firsts = new Set();
  for (let i = 0; i < 20; i++) {
    firsts.add(JSON.parse(ask(root, FOUR).stdout).hookSpecificOutput.updatedInput.questions[0].options[0].label);
  }
  assert.ok(firsts.size > 1, `첫 선택지가 항상 ${[...firsts]}`);
});

test("ask-user-question: 괄호 표시가 아닌 일반 단어 '추천'은 막지 않는다", () => {
  const res = ask(tmpRepo(), [
    { label: "추천 피드부터", description: "recommended items API 를 먼저 붙인다" },
    { label: "검색부터", description: "" },
  ]);
  assert.equal(JSON.parse(res.stdout).hookSpecificOutput.permissionDecision, "ask");
});

test("ask-user-question: opt-in 이 아닌 레포에서는 막지도 섞지도 않는다", () => {
  for (const options of [[{ label: "A (Recommended)", description: "" }, { label: "B", description: "" }], FOUR]) {
    const res = ask(tmpRepo({ optIn: null }), options);
    assert.equal(res.code, 0);
    assert.equal(res.stdout, "");
  }
});

test("ask-user-question: 깨진 입력·빠진 필드에도 0 으로 끝나고 아무것도 출력하지 않는다", () => {
  const root = tmpRepo();
  for (const input of ["not json", { cwd: root }, { cwd: root, tool_input: { questions: [{ question: "q?" }, null] } }]) {
    const res = run("ask-user-question.mjs", input, newStateDir());
    assert.equal(res.code, 0);
    assert.equal(res.stdout, "");
  }
});
