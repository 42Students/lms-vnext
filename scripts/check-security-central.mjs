#!/usr/bin/env node
// Ratchet: per route file and rule the count may never exceed the baseline. `--update` can only lower counts.
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { RULES, scanRoute, scanServerAction, scanSqlRaw } from "./security-central-rules.mjs";
import { analyse } from "./rls-tenant-tables.mjs";

import { baselinePath } from "./lib/baselines.mjs";
const BASELINE_PATH = baselinePath("central-security-baseline");
const args = new Set(process.argv.slice(2));
const files = execFileSync("git", ["ls-files", "-z", "--", "src/app/api"], { encoding: "utf8", maxBuffer: 1 << 26 }).split("\0").filter(Boolean);
const counts = {};
for (const p of files) {
  let s; try { s = readFileSync(p, "utf8"); } catch { continue; }
  for (const f of scanRoute(p, s)) ((counts[p] ??= {})[f.rule] = (counts[p][f.rule] ?? 0) + 1);
}
const srcFiles = execFileSync("git", ["ls-files", "-z", "--", "src"], { encoding: "utf8", maxBuffer: 1 << 26 }).split("\0").filter((p) => /[.](?:ts|tsx)$/.test(p));
for (const p of srcFiles) {
  let s; try { s = readFileSync(p, "utf8"); } catch { continue; }
  if (s.includes("sql.raw(")) for (const f of scanSqlRaw(p, s)) ((counts[p] ??= {})[f.rule] = (counts[p][f.rule] ?? 0) + 1);
  if (!s.includes("use server")) continue;
  for (const f of scanServerAction(p, s)) ((counts[p] ??= {})[f.rule] = (counts[p][f.rule] ?? 0) + 1);
}
{
  const { missing, unclassified } = analyse();
  const dbCounts = {};
  if (missing.length) dbCounts["tenant-table-without-rls"] = missing.length;
  if (unclassified.length) dbCounts["table-without-tenant-classification"] = unclassified.length;
  if (Object.keys(dbCounts).length) counts["drizzle (database)"] = dbCounts;
}
const totals = Object.fromEntries(Object.keys(RULES).map((r) => [r, 0]));
for (const r of Object.values(counts)) for (const [k, n] of Object.entries(r)) totals[k] += n;
// Converting an existing off-wrapper route may add interim "service-enforced" debt once; brand-new routes may not.
// Moving an off-wrapper route behind the secured() shim converts that file's debt one-for-one.
const converting = (old, p, k) => (k === "service-enforced" || k === "route-on-shim-only") && (old[p]?.["route-not-on-wrapper"] > 0 || old[p]?.["route-on-shim-only"] > 0);
const read = () => { try { return JSON.parse(readFileSync(BASELINE_PATH, "utf8")); } catch { return { schemaVersion: 1, files: {} }; } };

if (args.has("--report")) { for (const [k, n] of Object.entries(totals)) console.log(String(n).padStart(6), k); process.exit(0); }
if (args.has("--init") || args.has("--update")) {
  const old = read().files;
  if (!args.has("--init")) for (const [p, r] of Object.entries(counts)) for (const [k, n] of Object.entries(r))
    if (n > (old[p]?.[k] ?? -1) && !converting(old, p, k)) { console.error(`refusing to raise the baseline: ${p} ${k} -> ${n}`); process.exit(1); }
  writeFileSync(BASELINE_PATH, JSON.stringify({ schemaVersion: 1, files: counts }, null, 1) + "\n");
  console.log("baseline written", JSON.stringify(totals)); process.exit(0);
}
const base = read().files; let bad = 0;
for (const [p, r] of Object.entries(counts)) for (const [k, n] of Object.entries(r))
  if (n > (base[p]?.[k] ?? 0) && !converting(base, p, k)) { console.error(`${p}: ${k} ${base[p]?.[k] ?? 0} -> ${n} (${RULES[k]})`); bad++; }
if (bad) { console.error(`security:central failed: ${bad} regression(s). New routes must use route() from @/security/route.`); process.exit(1); }
console.log("security:central ok", JSON.stringify(totals));
