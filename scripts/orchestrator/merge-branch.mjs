#!/usr/bin/env node
// Verify and merge a ChatGPT-authored branch into main.
//
//   node scripts/orchestrator/merge-branch.mjs chatgpt/chat-2          # verify only (dry run)
//   node scripts/orchestrator/merge-branch.mjs chatgpt/chat-2 --push   # verify, merge, push main
//
// Requires a clean working tree on main. Refuses branches that touch protected
// paths, branches not under chatgpt/, and merges that conflict or fail checks.
// On any failure the merge is aborted and main is left untouched.
import { execFileSync, spawnSync } from "node:child_process";

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

const [, , branch, ...flags] = process.argv;
const push = flags.includes("--push");

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function run(label, command, args) {
  console.log(`\n== ${label}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  return result.status === 0;
}

function fail(message) {
  console.error(`\nREFUSED: ${message}`);
  process.exit(1);
}

if (!branch || !branch.startsWith("chatgpt/")) {
  fail("pass a branch named chatgpt/<name>");
}

if (git("rev-parse", "--abbrev-ref", "HEAD") !== "main") {
  fail("switch to main first");
}

if (git("status", "--porcelain", "--untracked-files=no")) {
  fail("working tree has uncommitted changes");
}

git("fetch", "origin");
git("pull", "--rebase", "origin", "main");

const ref = `origin/${branch}`;
try {
  git("rev-parse", "--verify", ref);
} catch {
  fail(`${ref} does not exist (has the chat pushed it?)`);
}

const base = git("merge-base", "main", ref);
const changed = git("diff", "--name-only", `${base}..${ref}`)
  .split("\n")
  .filter(Boolean);

if (changed.length === 0) {
  console.log("Nothing to merge.");
  process.exit(0);
}

console.log(`Changed files (${changed.length}):`);
for (const file of changed) console.log(`  ${file}`);

const blocked = changed.filter((file) =>
  PROTECTED.some((prefix) => file === prefix || file.startsWith(prefix)),
);
if (blocked.length > 0) {
  fail(`protected paths touched:\n  ${blocked.join("\n  ")}`);
}

try {
  git("merge", "--no-commit", "--no-ff", ref);
} catch {
  const conflicts = git("diff", "--name-only", "--diff-filter=U");
  spawnSync("git", ["merge", "--abort"], { stdio: "inherit" });
  fail(`merge conflicts, resolve by hand:\n  ${conflicts.split("\n").join("\n  ")}`);
}

function abort(message) {
  spawnSync("git", ["merge", "--abort"], { stdio: "inherit" });
  fail(message);
}

const sources = changed.filter((file) => /\.(ts|tsx)$/.test(file));

if (!run("typecheck", "npx", ["tsc", "--noEmit"])) abort("typecheck failed");
if (sources.length > 0 && !run("eslint", "npx", ["eslint", ...sources.map((f) => `"${f}"`)])) {
  abort("eslint failed");
}
if (!run("unit tests", "npx", ["vitest", "run", "tests/unit"])) abort("unit tests failed");

if (!push) {
  spawnSync("git", ["merge", "--abort"], { stdio: "inherit" });
  console.log("\nAll checks passed (dry run, nothing merged). Re-run with --push to merge.");
  process.exit(0);
}

git("commit", "-m", `merge ${branch} (verified: tsc, eslint, unit tests)\n\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`);
git("push", "origin", "main");
console.log(`\nMerged ${branch} into main and pushed.`);
