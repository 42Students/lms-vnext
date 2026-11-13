#!/usr/bin/env node
// Unauthenticated API gate (SEC-03-006, SEC-08-004, SEC-23-022): every route handler is called with no cookie.
// A route may answer 401/403/404/405/307 (denied) freely. Any other answer must be listed in the committed
// baseline (routes that are public by design); a new open route, or any 5xx, fails the run.
//
//   SWEEP_BASE=http://127.0.0.1:3000 node scripts/verify/unauth-gate.mjs [--write]
//
// Local, CI or dev only (never production).
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

import { baselinePath } from "../lib/baselines.mjs";
const base = process.env.SWEEP_BASE;
if (!base || !/^https:\/\/[a-z0-9.-]*development\.42lms\.com$|^http:\/\/(localhost|127\.0\.0\.1):[0-9]+$/.test(base)) {
  throw new Error("set SWEEP_BASE to a dev, CI or local origin (never production)");
}
const write = process.argv.includes("--write");
const BASELINE = baselinePath("unauth-baseline");
const DENIED = new Set([401, 403, 404, 405, 307, 308]);
const ZERO = "00000000-0000-4000-8000-000000000000";
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const files = execSync("git ls-files src/app/api", { encoding: "utf8" }).split("\n").filter((f) => f.endsWith("/route.ts"));
const targets = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  const path = "/" + f.replace("src/app/", "").replace(/\/route\.ts$/, "").replace(/\[\.\.\.[A-Za-z]+\]/g, "x").replace(/\[([A-Za-z]+)\]/g, ZERO);
  for (const method of METHODS) {
    const direct = new RegExp("export\\s+(const|async function|function)\\s+" + method + "\\b");
    const listed = new RegExp("export\\s*\\{[^}]*\\b" + method + "\\b");
    if (direct.test(src) || listed.test(src)) targets.push({ method, path });
  }
}

const results = [];
let next = 0;
async function worker() {
  while (next < targets.length) {
    const t = targets[next++];
    const key = t.method + " " + t.path;
    try {
      const init = { method: t.method, redirect: "manual", signal: AbortSignal.timeout(30000) };
      if (t.method !== "GET") Object.assign(init, { headers: { origin: base.replace(/^http:/, "https:"), "content-type": "application/json" }, body: "{}" });
      const response = await fetch(base + t.path, init);
      await response.arrayBuffer();
      results.push({ key, status: response.status });
    } catch (error) {
      results.push({ key, status: "ERR:" + (error?.name ?? "error") });
    }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));

const by = {};
for (const r of results) by[r.status] = (by[r.status] || 0) + 1;
console.log(`unauthenticated gate: ${results.length} method and route pairs`, JSON.stringify(by));

const open = Object.fromEntries(results.filter((r) => !DENIED.has(r.status)).map((r) => [r.key, String(r.status)]));
const serverErrors = results.filter((r) => typeof r.status !== "number" || (r.status >= 500 && r.status !== 503));

if (write) {
  writeFileSync(BASELINE, JSON.stringify({ note: "Routes that answer an unauthenticated caller with something other than 401/403/404/405/3xx. Public by design only; review every change.", open }, null, 1) + "\n");
  console.log("baseline written:", Object.keys(open).length, "open routes");
  process.exit(0);
}
const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")).open : {};
const added = Object.keys(open).filter((k) => !(k in baseline));
const failures = [];
for (const k of added) failures.push(`new open route: ${k} answered ${open[k]}`);
for (const r of serverErrors) failures.push(`server error: ${r.key} answered ${r.status}`);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
const gone = Object.keys(baseline).filter((k) => !(k in open));
console.log(`ok: ${Object.keys(open).length} open routes, all in the baseline` + (gone.length ? `; ${gone.length} baseline routes are now denied (run --write to tighten)` : ""));
