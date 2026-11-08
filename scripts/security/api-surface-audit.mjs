#!/usr/bin/env node
// API surface audit (SEC-08-003/005/009/010/011/012/014/018): measures what the route layer actually does instead of
// assuming it. Static, read-only, fast.
//   node scripts/security/api-surface-audit.mjs            summary + ratchet check against docs/security/api-surface-baseline.json
//   node scripts/security/api-surface-audit.mjs --write    update the baseline (counts may only go down unless forced)
//   node scripts/security/api-surface-audit.mjs --list     list the routes behind each counter
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const files = execSync("git ls-files src/app/api", { encoding: "utf8" }).split("\n").filter((f) => f.endsWith("/route.ts"));
const BASELINE = "docs/security/api-surface-baseline.json";
const args = process.argv.slice(2);

const mutating = /export\s+(?:const|async function|function)\s+(?:POST|PUT|PATCH|DELETE)\b|export\s*\{[^}]*\b(?:POST|PUT|PATCH|DELETE)\b/;
const readsBody = /request\.(?:json|formData|text)\(|boundedRequestJson|readBounded(?:Json|Utf8)Body|body:\s*\{|\bbody\b.*schema|req\.json\(/;
const strict = /\.strict\(\)|z\.strictObject|strictObject\(/;
const usesSchema = /\.(?:safeParse|parse)\(|z\.object|z\.strictObject|schema:/;
const returnsRawMessage = /(?:error|e|err)\.message\b[^;\n]*(?:NextResponse\.json|Response\.json)|(?:NextResponse\.json|Response\.json)\([^;\n]*(?:error|e|err)\.message/;
const pagination = /\b(?:pageSize|limit|perPage|take)\b/;
const bounded = /\.max\(\s*\d+|Math\.min\(|clamp|MAX_[A-Z_]*(?:PAGE|LIMIT|ROWS)|maximum/;

const counters = {
  routeFiles: files.length,
  mutatingRoutes: 0,
  mutatingWithoutSchema: [],
  mutatingBodyNotStrict: [],
  rawErrorMessageInResponse: [],
  paginationWithoutVisibleBound: [],
};
for (const f of files) {
  const src = readFileSync(f, "utf8");
  const isMutating = mutating.test(src);
  if (isMutating) {
    counters.mutatingRoutes += 1;
    const body = readsBody.test(src);
    if (body && !usesSchema.test(src)) counters.mutatingWithoutSchema.push(f);
    if (body && usesSchema.test(src) && !strict.test(src)) counters.mutatingBodyNotStrict.push(f);
  }
  if (returnsRawMessage.test(src)) counters.rawErrorMessageInResponse.push(f);
  if (pagination.test(src) && !bounded.test(src)) counters.paginationWithoutVisibleBound.push(f);
}
const summary = Object.fromEntries(Object.entries(counters).map(([k, v]) => [k, Array.isArray(v) ? v.length : v]));
console.log(JSON.stringify(summary, null, 1));
if (args.includes("--list")) for (const [k, v] of Object.entries(counters)) if (Array.isArray(v) && v.length) console.log(`\n${k}:\n  ` + v.join("\n  "));

const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : null;
if (args.includes("--write")) {
  const next = { note: "Ratchet for the route layer: a counter may only go down. Fix the listed routes (node scripts/security/api-surface-audit.mjs --list) or lower the baseline on purpose.", counts: summary, lists: Object.fromEntries(Object.entries(counters).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, v])) };
  if (baseline) for (const k of Object.keys(summary)) if (k !== "routeFiles" && k !== "mutatingRoutes" && summary[k] > baseline.counts[k]) { console.error(`refusing to raise ${k}: ${baseline.counts[k]} -> ${summary[k]}`); process.exit(1); }
  writeFileSync(BASELINE, JSON.stringify(next, null, 1) + "\n");
  console.log("baseline written");
} else if (baseline) {
  const worse = [];
  for (const k of Object.keys(summary)) {
    if (k === "routeFiles" || k === "mutatingRoutes") continue;
    if (summary[k] > baseline.counts[k]) {
      const known = new Set(baseline.lists?.[k] ?? []);
      const added = counters[k].filter((f) => !known.has(f));
      worse.push(`${k}: ${baseline.counts[k]} -> ${summary[k]} (new: ${added.join(", ")})`);
    }
  }
  if (worse.length) { console.error("API surface got worse:\n" + worse.join("\n")); process.exit(1); }
  console.log("api surface ok (no counter above its baseline)");
}
