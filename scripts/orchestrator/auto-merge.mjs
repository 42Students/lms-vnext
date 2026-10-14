#!/usr/bin/env node
// Merge every ahead chatgpt/chat-N branch into main, one at a time, each behind
// its own gate run (tsc, eslint, unit tests), with a few cheap deterministic
// auto-fixes for failures we have repeatedly seen. See scripts/orchestrator/README.md.
//
//   node scripts/orchestrator/auto-merge.mjs --dry-run              # fetch + ahead counts only
//   node scripts/orchestrator/auto-merge.mjs [--branches 2,3] [--report path]   # verify only
//   node scripts/orchestrator/auto-merge.mjs --push                 # verify, merge, push main
//
// Failures leave main clean (merge --abort + reset). Nothing is ever force-pushed.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Copied from merge-branch.mjs (keep in sync): paths a chatgpt branch may never touch.
const PROTECTED = [
  "src/modules/auth/",
  "src/auth/",
  "src/security/",
  "src/modules/storage/",
  "deploy/",
  "Dockerfile",
  ".github/",
  "scripts/",
  "drizzle/",
  "package.json",
  "package-lock.json",
  "bun.lock",
  "bun.lockb",
  ".env",
];
const isProtected = (file) =>
  PROTECTED.some((prefix) => file === prefix || file.startsWith(prefix));

const CO_AUTHOR = "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>";
const IS_WIN = process.platform === "win32";

// ---------------------------------------------------------------- args
function parseArgs(argv) {
  const opts = {
    branches: null,
    push: false,
    dryRun: false,
    report: path.join(os.tmpdir(), "auto-merge-report.json"),
    waitClean: true,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--push") opts.push = true;
    else if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--no-wait") opts.waitClean = false;
    else if (arg === "--branches") opts.branches = argv[++i];
    else if (arg.startsWith("--branches=")) opts.branches = arg.slice(11);
    else if (arg === "--report") opts.report = argv[++i];
    else if (arg.startsWith("--report=")) opts.report = arg.slice(9);
    else throw new Error(`unknown argument ${arg}`);
  }
  return opts;
}

function branchList(spec) {
  const nums = spec
    ? spec
        .split(",")
        .map((s) => s.trim().replace(/^chatgpt\/chat-/, ""))
        .filter(Boolean)
        .map(Number)
    : Array.from({ length: 10 }, (_, i) => i + 2);
  if (nums.some((n) => !Number.isInteger(n) || n < 0)) {
    throw new Error("--branches expects a comma separated list of numbers");
  }
  return nums.map((n) => `chatgpt/chat-${n}`);
}

// ---------------------------------------------------------------- process helpers
function capture(command, args, { shell = false } = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
    shell,
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    out: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

function git(...args) {
  return capture("git", args);
}

function gitOut(...args) {
  const r = git(...args);
  if (!r.ok) throw new Error(`git ${args.join(" ")} failed: ${firstLines(r.out, 3)}`);
  return r.stdout.trim();
}

const npx = (args) => capture("npx", args, { shell: IS_WIN });
const q = (s) => `"${s}"`;

function firstLines(text, n = 5) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const errorish = lines.filter((l) => /error|fail|✗|×|conflict/i.test(l));
  return (errorish.length ? errorish : lines).slice(0, n).join("\n");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exists = (file) => fs.existsSync(file);
const read = (file) => fs.readFileSync(file, "utf8");
const write = (file, text) => fs.writeFileSync(file, text);

// ---------------------------------------------------------------- tsc auto-fixes
function parseTsc(out) {
  const errs = [];
  let cur = null;
  for (const line of out.split(/\r?\n/)) {
    const m = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/.exec(line);
    if (m) {
      cur = { file: m[1].replace(/\\/g, "/"), line: +m[2], col: +m[3], code: m[4], msg: m[5] };
      errs.push(cur);
    } else if (cur && /^\s+/.test(line)) {
      cur.msg += ` ${line.trim()}`;
    } else {
      cur = null;
    }
  }
  return errs;
}

// (a) new error-code literal missing from a string-literal union type.
function fixErrorCodeUnions(errs, touched) {
  const fixes = [];
  const wanted = new Map(); // typeName -> Set(literal)
  for (const e of errs) {
    if (e.code !== "TS2345" && e.code !== "TS2322") continue;
    const m = /'"([^"']+)"' is not assignable to (?:parameter of )?type '([A-Za-z_]\w*)'/.exec(e.msg);
    if (!m || !/Error/i.test(m[2]) || !/^[a-z0-9_.:-]+$/i.test(m[1])) continue;
    if (!wanted.has(m[2])) wanted.set(m[2], new Set());
    wanted.get(m[2]).add(m[1]);
  }
  for (const [typeName, literals] of wanted) {
    const grep = git("grep", "-lE", `type ${typeName}\\s*=`, "--", "src", "tests");
    const files = grep.stdout.split("\n").filter(Boolean);
    if (files.length !== 1 || isProtected(files[0])) continue;
    const file = files[0];
    let text = read(file);
    const re = new RegExp(`(type\\s+${typeName}\\s*=)([^;]*);`);
    const m = re.exec(text);
    if (!m) continue;
    const body = m[2];
    if (body.replace(/\|?\s*"[^"]*"\s*/g, "").trim() !== "") continue; // not a pure literal union
    let newBody = body;
    for (const lit of literals) {
      if (newBody.includes(`"${lit}"`)) continue;
      if (newBody.includes("\n")) {
        const barLine = newBody.split("\n").filter((l) => l.includes("|")).pop() ?? "  |";
        const indent = /^(\s*)/.exec(barLine)[1];
        newBody = `${newBody.trimEnd()}\n${indent}| "${lit}"`;
      } else {
        newBody = `${newBody.trimEnd()} | "${lit}"`;
      }
      fixes.push(`union ${typeName} += "${lit}" (${file})`);
    }
    if (newBody !== body) {
      text = text.replace(re, `$1${newBody.replace(/\$/g, "$$$$")};`);
      write(file, text);
      touched.add(file);
    }
  }
  return fixes;
}

// (e) platform permission matrix missing keys.
const MATRIX_FILE = "tests/unit/platform-permission-matrix.test.ts";
function superAdminOnly(policy, permission) {
  const esc = permission.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`case "${esc}":\\s*return false;`).test(policy)) return true;
  const guard = new RegExp(`permission === "${esc}"\\s*\\)\\s*\\{\\s*return (isSuperAdmin\\(context\\))\\s*;`);
  return guard.test(policy);
}
function fixPermissionMatrix(errs, touched) {
  const missing = new Set();
  for (const e of errs) {
    if (e.file !== MATRIX_FILE || !e.msg.includes("Record<PlatformPermission")) continue;
    let m = /missing the following properties from type '[^']*': (.*)$/.exec(e.msg);
    if (m) {
      if (/and \d+ more/.test(m[1])) return []; // list truncated by tsc; refuse
      for (const name of m[1].replace(/\.$/, "").split(/,\s*/)) missing.add(name.trim());
      continue;
    }
    m = /Property '([^']+)' is missing in type .* but required in type 'Record<PlatformPermission/.exec(e.msg);
    if (m) missing.add(m[1]);
  }
  if (missing.size === 0) return [];
  const policy = read("src/modules/permissions/policy.ts");
  const entries = [];
  for (const name of missing) {
    if (!superAdminOnly(policy, name)) return []; // not trivially derivable
    entries.push(`  "${name}": [\n    "superadmin",\n  ],\n`);
  }
  const text = read(MATRIX_FILE);
  const marker = "} as const satisfies Record<";
  if (!text.includes(marker)) return [];
  write(MATRIX_FILE, text.replace(marker, `${entries.join("")}${marker}`));
  touched.add(MATRIX_FILE);
  return [...missing].map((n) => `permission matrix += ${n} superadmin-only`);
}

// (f) "SUSPENDED" where the type is "ACTIVE" | "DISABLED" (tests only).
function fixSuspended(errs, touched) {
  const fixes = [];
  const byFile = new Map();
  for (const e of errs) {
    if (!e.file.startsWith("tests/")) continue;
    if (!e.msg.includes('"SUSPENDED"') || !/"ACTIVE" \| "DISABLED"/.test(e.msg)) continue;
    if (!byFile.has(e.file)) byFile.set(e.file, new Set());
    byFile.get(e.file).add(e.line);
  }
  for (const [file, lineNos] of byFile) {
    if (!exists(file) || isProtected(file)) continue;
    const lines = read(file).split("\n");
    let changed = false;
    for (const n of lineNos) {
      if (lines[n - 1]?.includes('"SUSPENDED"')) {
        lines[n - 1] = lines[n - 1].replace('"SUSPENDED"', '"DISABLED"');
        changed = true;
        fixes.push(`SUSPENDED -> DISABLED (${file}:${n})`);
      }
    }
    if (changed) {
      write(file, lines.join("\n"));
      touched.add(file);
    }
  }
  return fixes;
}

function applyTscFixes(errs, touched) {
  return [
    ...fixErrorCodeUnions(errs, touched),
    ...fixPermissionMatrix(errs, touched),
    ...fixSuspended(errs, touched),
  ];
}

// ---------------------------------------------------------------- eslint auto-fixes
function runEslint(files) {
  const results = [];
  for (let i = 0; i < files.length; i += 30) {
    const chunk = files.slice(i, i + 30);
    const r = npx(["eslint", "--format", "json", ...chunk.map(q)]);
    let parsed;
    try {
      parsed = JSON.parse(r.stdout);
    } catch {
      return { ok: false, crashed: true, out: r.out, messages: [] };
    }
    results.push(...parsed);
  }
  const messages = [];
  for (const res of results) {
    for (const m of res.messages) {
      if (m.severity === 2) {
        messages.push({
          file: path.relative(process.cwd(), res.filePath).replace(/\\/g, "/"),
          ...m,
        });
      }
    }
  }
  const out = messages.map((m) => `${m.file}:${m.line}:${m.column} ${m.ruleId ?? ""} ${m.message}`).join("\n");
  return { ok: messages.length === 0, crashed: false, out, messages };
}

function applyEslintFixes(messages, touched) {
  const fixes = [];
  const byFile = new Map();
  for (const m of messages) {
    if (!byFile.has(m.file)) byFile.set(m.file, []);
    byFile.get(m.file).push(m);
  }
  for (const [file, msgs] of byFile) {
    if (!exists(file) || isProtected(file)) continue;
    let text = read(file);
    const original = text;
    const lines = text.split("\n");
    const isClient = /^\s*(["'])use client\1/m.test(text.slice(0, 400));

    // line-oriented fixes, bottom-up so insertions do not shift pending positions
    const sorted = [...msgs].sort((a, b) => b.line - a.line || b.column - a.column);
    for (const m of sorted) {
      const idx = m.line - 1;
      const line = lines[idx];
      if (line === undefined) continue;

      if (m.ruleId === "react-hooks/purity" && m.message.includes("Date.now")) {
        if (isClient && /useRef\(\s*Date\.now\(\)\s*\)/.test(line)) {
          lines[idx] = line.replace(/useRef\(\s*Date\.now\(\)\s*\)/, "useRef(0)");
          fixes.push(`useRef(Date.now()) -> useRef(0) (${file}:${m.line})`);
        } else if (!isClient && !/^\s*[{<]/.test(line)) {
          if (!/eslint-disable-next-line react-hooks\/purity/.test(lines[idx - 1] ?? "")) {
            const indent = /^(\s*)/.exec(line)[1];
            lines.splice(idx, 0, `${indent}// eslint-disable-next-line react-hooks/purity -- request-time clock`);
            fixes.push(`eslint-disable react-hooks/purity (${file}:${m.line})`);
          }
        }
      } else if (m.ruleId === "react/no-unescaped-entities" && m.message.includes("`'`")) {
        if (line[m.column - 1] === "'") {
          lines[idx] = `${line.slice(0, m.column - 1)}&apos;${line.slice(m.column)}`;
          fixes.push(`&apos; (${file}:${m.line})`);
        }
      }
    }
    text = lines.join("\n");

    // (c) plain function named use* flagged by rules-of-hooks -> apply*/with*
    const renamed = new Set();
    for (const m of msgs) {
      if (m.ruleId !== "react-hooks/rules-of-hooks") continue;
      const hook = /React Hook "(use[A-Z]\w*)"/.exec(m.message)?.[1];
      if (!hook || renamed.has(hook)) continue;
      const defined = new RegExp(`(^|\\n)\\s*(async\\s+)?function\\s+${hook}\\b|(^|\\n)\\s*const\\s+${hook}\\s*=`).test(text);
      const exported = new RegExp(`export\\s+(async\\s+)?(function|const)\\s+${hook}\\b|export\\s*\\{[^}]*\\b${hook}\\b`).test(text);
      const imported = new RegExp(`import[^;]*\\b${hook}\\b[^;]*from`).test(text);
      if (!defined || exported || imported) continue;
      const suffix = hook.slice(3);
      const next = [`apply${suffix}`, `with${suffix}`].find((n) => !new RegExp(`\\b${n}\\b`).test(text));
      if (!next) continue;
      text = text.replace(new RegExp(`\\b${hook}\\b`, "g"), next);
      renamed.add(hook);
      fixes.push(`rename ${hook} -> ${next} (${file})`);
    }

    if (text !== original) {
      write(file, text);
      touched.add(file);
    }
  }
  return fixes;
}

// ---------------------------------------------------------------- markdown conflict resolution (g)
const RESOLVABLE_DOC = (file) =>
  /^docs\/parity\/[^/]+\.md$/.test(file) || file === "docs/planning/account-surface-parity.md";
const isRow = (l) => /^\s*\|/.test(l);
const rowKey = (l) => (l.split("|")[1] ?? "").trim().toLowerCase();
const isDone = (l) => /\bDONE\b/.test(l);

function mergeHunk(ours, theirs, mainWins) {
  const out = [];
  const theirsByKey = new Map();
  for (const l of theirs) if (isRow(l)) theirsByKey.set(rowKey(l), l);
  const usedKeys = new Set();
  const oursTrim = new Set(ours.map((l) => l.trim()));
  for (const l of ours) {
    if (isRow(l) && theirsByKey.has(rowKey(l))) {
      const t = theirsByKey.get(rowKey(l));
      usedKeys.add(rowKey(l));
      if (mainWins || isDone(l) || !isDone(t)) {
        // main's row wins for any DONE row, the whole matrix in mainWins mode,
        // and ties where neither is DONE and only main's side matters.
        out.push(mainWins || isDone(l) ? l : t);
      } else {
        out.push(t); // branch upgrades a non-DONE row to DONE
      }
    } else {
      out.push(l);
    }
  }
  for (const l of theirs) {
    if (!l.trim()) continue;
    if (isRow(l)) {
      if (!usedKeys.has(rowKey(l)) && !oursTrim.has(l.trim())) out.push(l);
    } else if (!oursTrim.has(l.trim())) {
      out.push(l);
    }
  }
  return out;
}

function resolveMarkdown(file) {
  const lines = read(file).split("\n");
  const out = [];
  let state = "normal";
  let ours = [];
  let theirs = [];
  const mainWins = file === "docs/planning/account-surface-parity.md";
  for (const line of lines) {
    if (state === "normal" && line.startsWith("<<<<<<< ")) {
      state = "ours";
      ours = [];
      theirs = [];
    } else if (state === "ours" && line.startsWith("||||||| ")) {
      state = "base";
    } else if ((state === "ours" || state === "base") && line.startsWith("=======")) {
      state = "theirs";
    } else if (state === "theirs" && line.startsWith(">>>>>>> ")) {
      out.push(...mergeHunk(ours, theirs, mainWins));
      state = "normal";
    } else if (state === "ours") ours.push(line);
    else if (state === "theirs") theirs.push(line);
    else if (state === "normal") out.push(line);
  }
  if (state !== "normal") throw new Error(`unterminated conflict markers in ${file}`);
  const text = out.join("\n");
  if (/^(<<<<<<<|=======|>>>>>>>)/m.test(text)) throw new Error(`markers remain in ${file}`);

  // Guard: no DONE row on main may become non-DONE.
  const head = git("show", `HEAD:${file}`);
  if (head.ok) {
    const nowDone = new Map();
    for (const l of out) if (isRow(l)) nowDone.set(rowKey(l), (nowDone.get(rowKey(l)) ?? false) || isDone(l));
    for (const l of head.stdout.split("\n")) {
      if (isRow(l) && isDone(l) && nowDone.get(rowKey(l)) !== true) {
        throw new Error(`DONE row would be downgraded in ${file}: ${rowKey(l)}`);
      }
    }
  }
  write(file, text);
}

// ---------------------------------------------------------------- merge flow
function cleanUp() {
  git("merge", "--abort");
  git("reset", "--hard", "HEAD");
}

function pullMain() {
  const r = git("pull", "--no-rebase", "--no-edit", "origin", "main");
  if (!r.ok) throw new Error(`git pull origin main failed: ${firstLines(r.out, 3)}`);
}

async function waitForCleanMain(opts) {
  const deadline = Date.now() + 10 * 60 * 1000;
  for (;;) {
    const branch = gitOut("rev-parse", "--abbrev-ref", "HEAD");
    const dirty = gitOut("status", "--porcelain", "--untracked-files=no");
    const merging = exists(path.join(gitOut("rev-parse", "--git-dir"), "MERGE_HEAD"));
    if (branch === "main" && !dirty && !merging) return null;
    if (!opts.waitClean || Date.now() > deadline) {
      return branch !== "main"
        ? `not on main (on ${branch})`
        : "working tree has staged/uncommitted changes or a merge in progress";
    }
    await sleep(15000);
  }
}

function gate(branch, changed, touched, fixes) {
  const sources = () =>
    [...new Set([...changed, ...touched])].filter((f) => /\.(ts|tsx)$/.test(f) && exists(f));
  for (let round = 0; round < 4; round++) {
    const tsc = npx(["tsc", "--noEmit"]);
    if (!tsc.ok) {
      const applied = applyTscFixes(parseTsc(tsc.out), touched);
      if (applied.length === 0) return { ok: false, reason: `typecheck failed\n${firstLines(tsc.out)}` };
      fixes.push(...applied);
      continue;
    }
    const files = sources();
    if (files.length > 0) {
      const lint = runEslint(files);
      if (!lint.ok) {
        if (lint.crashed) return { ok: false, reason: `eslint crashed\n${firstLines(lint.out)}` };
        const applied = applyEslintFixes(lint.messages, touched);
        if (applied.length === 0) return { ok: false, reason: `eslint failed\n${firstLines(lint.out)}` };
        fixes.push(...applied);
        continue;
      }
    }
    const unit = npx(["vitest", "run", "tests/unit"]);
    if (!unit.ok) return { ok: false, reason: `unit tests failed\n${firstLines(unit.out)}` };
    return { ok: true };
  }
  return { ok: false, reason: "auto-fixes did not converge after 4 rounds" };
}

function pushMain() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const pull = git("pull", "--no-rebase", "--no-edit", "origin", "main");
    if (pull.ok && git("push", "origin", "main").ok) return true;
    if (!pull.ok) {
      git("merge", "--abort");
      return false;
    }
  }
  return false;
}

function mergeOne(branch, opts) {
  const entry = { branch, status: "REFUSED", reason: "", fixes: [], integrationTests: [] };
  const ref = `origin/${branch}`;
  if (!git("rev-parse", "--verify", ref).ok) {
    entry.reason = `${ref} does not exist`;
    return entry;
  }
  const ahead = Number(gitOut("rev-list", "--count", `main..${ref}`));
  if (ahead === 0) {
    entry.status = "SKIPPED";
    entry.reason = "not ahead of main";
    return entry;
  }
  entry.ahead = ahead;

  const base = gitOut("merge-base", "main", ref);
  // Real changes come from the staged merge result below: a branch that merged main through a
  // connector can show main's own protected-path commits in a three-dot diff.
  let changed = [];

  const touched = new Set();
  const merge = git("merge", "--no-commit", "--no-ff", ref);
  if (!merge.ok) {
    const conflicts = gitOut("diff", "--name-only", "--diff-filter=U").split("\n").filter(Boolean);
    // Protected paths are never taken from a chat branch: keep main's version.
    for (const f of conflicts.filter(isProtected)) {
      git("checkout", "--ours", "--", f);
      git("add", "--", f);
      entry.fixes.push(`kept main's version of protected file (${f})`);
    }
    const stillConflicted = gitOut("diff", "--name-only", "--diff-filter=U").split("\n").filter(Boolean);
    const unresolvable = stillConflicted.filter((f) => !RESOLVABLE_DOC(f));
    if (conflicts.length === 0 || unresolvable.length > 0) {
      entry.reason = `merge conflicts: ${(unresolvable.length ? unresolvable : [firstLines(merge.out, 3)]).slice(0, 5).join("\n")}`;
      cleanUp();
      return entry;
    }
    try {
      for (const file of conflicts) {
        resolveMarkdown(file);
        git("add", "--", file);
        entry.fixes.push(`resolved markdown conflict (${file})`);
      }
    } catch (error) {
      entry.reason = `markdown conflict resolution refused: ${error.message}`;
      entry.fixes = [];
      cleanUp();
      return entry;
    }
  }

  changed = gitOut("diff", "--cached", "--name-only").split("\n").filter(Boolean);
  entry.changedFiles = changed.length;
  const blocked = changed.filter(isProtected);
  if (blocked.length > 0) {
    entry.reason = `protected paths touched: ${blocked.slice(0, 5).join(", ")}`;
    cleanUp();
    return entry;
  }

  let result;
  try {
    result = gate(branch, changed, touched, entry.fixes);
  } catch (error) {
    result = { ok: false, reason: `gate crashed: ${error.message}` };
  }
  if (!result.ok) {
    entry.reason = result.reason.split("\n").slice(0, 6).join("\n");
    cleanUp();
    return entry;
  }

  entry.integrationTests = changed.filter((f) => /^tests\/integration\/.+\.test\.ts$/.test(f) && exists(f));

  if (!opts.push) {
    cleanUp();
    entry.status = "VERIFIED";
    entry.reason = "all gates passed (no --push, nothing merged)";
    return entry;
  }

  if (touched.size > 0) git("add", "--", ...touched);
  const fixNote = entry.fixes.length > 0 ? `\n\nAuto-fixes:\n${entry.fixes.map((f) => `- ${f}`).join("\n")}` : "";
  const commit = git(
    "commit",
    "-m",
    `merge ${branch} (verified: tsc, eslint, unit tests)${fixNote}\n\n${CO_AUTHOR}`,
  );
  if (!commit.ok) {
    entry.reason = `commit failed: ${firstLines(commit.out, 3)}`;
    cleanUp();
    return entry;
  }
  entry.mergeCommit = gitOut("rev-parse", "--short", "HEAD");
  if (!pushMain()) {
    entry.status = "MERGED_NOT_PUSHED";
    entry.reason = "merged locally but push failed after 3 attempts";
    return entry;
  }
  entry.status = "MERGED";
  return entry;
}

function line(entry) {
  const fixes = entry.fixes.length ? ` fixes=${entry.fixes.length}` : "";
  const tests = entry.integrationTests.length ? ` integration=${entry.integrationTests.length}` : "";
  if (entry.status === "MERGED" || entry.status === "VERIFIED") {
    return `${entry.status} ${entry.branch}${fixes}${tests}`;
  }
  const reason = entry.reason.replace(/\r?\n/g, " | ");
  return `${entry.status === "SKIPPED" ? "SKIPPED" : entry.status} ${entry.branch}: ${reason}`;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const branches = branchList(opts.branches);

  const fetch = git("fetch", "origin");
  if (!fetch.ok) throw new Error(`git fetch failed: ${firstLines(fetch.out, 3)}`);

  if (opts.dryRun) {
    const rows = branches.map((branch) => {
      const ref = `origin/${branch}`;
      if (!git("rev-parse", "--verify", ref).ok) return { branch, ahead: null };
      return { branch, ahead: Number(gitOut("rev-list", "--count", `main..${ref}`)) };
    });
    for (const r of rows) {
      console.log(`${r.branch}: ${r.ahead === null ? "missing on origin" : `${r.ahead} ahead of main`}`);
    }
    fs.writeFileSync(opts.report, JSON.stringify({ dryRun: true, branches: rows }, null, 2));
    return 0;
  }

  const problem = await waitForCleanMain(opts);
  if (problem) {
    console.error(`REFUSED: ${problem}`);
    return 2;
  }

  const entries = [];
  const save = () =>
    fs.writeFileSync(opts.report, JSON.stringify({ push: opts.push, entries }, null, 2));
  for (const branch of branches) {
    let entry;
    try {
      pullMain();
      entry = mergeOne(branch, opts);
    } catch (error) {
      cleanUp();
      entry = { branch, status: "REFUSED", reason: error.message, fixes: [], integrationTests: [] };
    }
    entries.push(entry);
    console.log(line(entry));
    save();
    if (entry.status === "MERGED_NOT_PUSHED") break;
  }
  console.log(`report: ${opts.report}`);
  return 0;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  },
);
