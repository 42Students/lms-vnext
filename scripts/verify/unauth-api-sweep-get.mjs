import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
const base = process.env.SWEEP_BASE;
if (!base || !/^https://[a-z0-9.-]*development.42lms.com$|^http://localhost:[0-9]+$/.test(base)) throw new Error("set SWEEP_BASE to a dev or local origin (never production)");
const files = execSync("git ls-files src/app/api", { encoding: "utf8" }).split("\n").filter((f) => f.endsWith("/route.ts"));
const ZERO = "00000000-0000-4000-8000-000000000000";
const targets = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  const hasGet = /export\s+(const|async function|function)\s+GET\b/.test(src) || /export\s*\{[^}]*\bGET\b/.test(src);
  if (!hasGet) continue;
  const path = "/" + f.replace("src/app/", "").replace(/\/route\.ts$/, "").replace(/\[\.\.\.[A-Za-z]+\]/g, "x").replace(/\[([A-Za-z]+)\]/g, ZERO);
  targets.push({ f, path });
}
const results = [];
let i = 0;
async function worker() {
  while (i < targets.length) {
    const t = targets[i++];
    try {
      const r = await fetch(base + t.path, { redirect: "manual", signal: AbortSignal.timeout(20000) });
      const body = (await r.text()).slice(0, 120).replace(/\s+/g, " ");
      results.push({ path: t.path, status: r.status, body });
    } catch (e) {
      results.push({ path: t.path, status: "ERR", body: e.name });
    }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
const by = {};
for (const r of results) by[r.status] = (by[r.status] || 0) + 1;
console.log("routes probed:", results.length, JSON.stringify(by));
for (const r of results.filter((r) => r.status === 200 || r.status === "ERR" || (r.status >= 500))) console.log(r.status, r.path, "|", r.body);
