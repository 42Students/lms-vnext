#!/usr/bin/env node
// Fails when package-lock.json contains a denied package or a version below a denied threshold (SEC-18-020).
//   node scripts/security/dependency-deny.mjs
import { readFileSync } from "node:fs";

const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const deny = JSON.parse(readFileSync("docs/security/dependency-denylist.json", "utf8")).deny;

const parts = (v) => String(v).split(/[.+-]/).slice(0, 3).map((n) => Number.parseInt(n, 10) || 0);
const less = (a, b) => {
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i];
  return false;
};

const found = [];
for (const [path, pkg] of Object.entries(lock.packages ?? {})) {
  if (!path) continue;
  const name = path.split("node_modules/").pop();
  for (const rule of deny) {
    if (rule.name !== name) continue;
    if (!rule.below || (pkg.version && less(pkg.version, rule.below))) found.push(`${name}@${pkg.version ?? "?"} (${rule.reason})`);
  }
}
if (found.length) {
  console.error("denied packages in package-lock.json:\n  " + found.join("\n  "));
  process.exit(1);
}
console.log(`dependency deny list ok (${deny.length} rules, ${Object.keys(lock.packages ?? {}).length} packages checked)`);
