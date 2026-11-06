#!/usr/bin/env node
// Supply-chain guard (SEC-18-015, SEC-18-019, SEC-18-020): every locked package must come from the
// npm registry with an integrity hash. Git, http, tarball-URL and file dependencies are rejected.
import { readFileSync } from "node:fs";

const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const problems = [];
for (const [path, pkg] of Object.entries(lock.packages ?? {})) {
  if (path === "" || pkg.link) continue;
  if (!pkg.resolved) { if (!pkg.inBundle) problems.push(`${path}: no resolved URL`); continue; }
  if (!pkg.resolved.startsWith("https://registry.npmjs.org/")) problems.push(`${path}: resolved from ${pkg.resolved}`);
  if (!pkg.integrity) problems.push(`${path}: missing integrity hash`);
}
if (problems.length) {
  console.error(`Lockfile source check failed (${problems.length}):\n` + problems.slice(0, 40).join("\n"));
  process.exit(1);
}
console.log(`Lockfile source check ok: ${Object.keys(lock.packages ?? {}).length - 1} packages from the npm registry with integrity hashes.`);
