import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
const base = process.env.SWEEP_BASE;
if (!base || !/^https://[a-z0-9.-]*development.42lms.com$|^http://localhost:[0-9]+$/.test(base)) throw new Error("set SWEEP_BASE to a dev or local origin (never production)");
const files = execSync("git ls-files src/app/api", { encoding: "utf8" }).split("\n").filter((f) => f.endsWith("/route.ts"));
const ZERO = "00000000-0000-4000-8000-000000000000";
const targets = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const m of ["POST", "PUT", "PATCH", "DELETE"]) {
    const direct = new RegExp("export\\s+(const|async function|function)\\s+" + m + "\\b");
    const listed = new RegExp("export\\s*\\{[^}]*\\b" + m + "\\b");
    if (!(direct.test(src) || listed.test(src))) continue;
    const path = "/" + f.replace("src/app/", "").replace(/\/route\.ts$/, "").replace(/\[\.\.\.[A-Za-z]+\]/g, "x").replace(/\[([A-Za-z]+)\]/g, ZERO);
    targets.push({ m, path });
  }
}
const results = [];
let i = 0;
async function worker() {
  while (i < targets.length) {
    const t = targets[i++];
    try {
      const r = await fetch(base + t.path, { method: t.m, redirect: "manual", headers: { origin: base, "content-type": "application/json" }, body: "{}", signal: AbortSignal.timeout(20000) });
      results.push({ k: t.m + " " + t.path, status: r.status, body: (await r.text()).slice(0, 100).replace(/\s+/g, " ") });
    } catch (e) {
      results.push({ k: t.m + " " + t.path, status: "ERR", body: e.name });
    }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
const by = {};
for (const r of results) by[r.status] = (by[r.status] || 0) + 1;
console.log("mutating routes probed:", results.length, JSON.stringify(by));
for (const r of results.filter((r) => ![401, 403, 404, 405].includes(r.status))) console.log(r.status, r.k, "|", r.body);
