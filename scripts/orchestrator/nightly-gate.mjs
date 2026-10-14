#!/usr/bin/env node
// Local replacement for the down CI: typecheck (incl. tests), eslint (errors only), unit tests, optional build.
// Usage: node scripts/orchestrator/nightly-gate.mjs [--build] [--report <path>]
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const reportPath = args.includes("--report") ? args[args.indexOf("--report") + 1] : join(tmpdir(), "nightly-gate.json");
const steps = [
  ["tsc", "npx", ["tsc", "--noEmit"]],
  ["eslint", "npx", ["eslint", "src", "tests", "--quiet"]],
  ["unit", "npx", ["vitest", "run", "tests/unit"]],
];
if (args.includes("--build")) steps.push(["build", "npm", ["run", "build"]]);

const results = [];
for (const [name, cmd, cmdArgs] of steps) {
  const started = Date.now();
  const run = spawnSync(cmd, cmdArgs, { encoding: "utf8", shell: true, maxBuffer: 64 * 1024 * 1024 });
  const out = `${run.stdout ?? ""}${run.stderr ?? ""}`;
  results.push({ name, ok: run.status === 0, seconds: Math.round((Date.now() - started) / 1000), tail: out.split("\n").slice(-15).join("\n") });
  console.log(`${run.status === 0 ? "PASS" : "FAIL"} ${name} (${results.at(-1).seconds}s)`);
}
writeFileSync(reportPath, JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
process.exit(results.every((r) => r.ok) ? 0 : 1);
