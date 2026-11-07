// Same-college horizontal probe (SEC-08, SEC-14): signs in as the NSRIT QA learner and requests every GET route that takes a
// membership, user or college id for OTHER learners. Needs scratch/nsrit-members.json (ids read by a system-scope job). Dev only.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
const base = process.env.SWEEP_BASE;
if (!base || !/^https:\/\/[a-z0-9.-]*development\.42lms\.com$|^http:\/\/localhost:[0-9]+$/.test(base)) throw new Error("set SWEEP_BASE to a dev or local origin (never production)");
const otp = process.env.SWEEP_OTP;
const data = JSON.parse(readFileSync("scratch/nsrit-members.json", "utf8"));
const jar = new Map();
const absorb = (r) => {
  for (const line of r.headers.getSetCookie?.() ?? []) {
    const [pair] = line.split(";");
    const i = pair.indexOf("=");
    const k = pair.slice(0, i).trim();
    const v = pair.slice(i + 1).trim();
    if (!v || /max-age=0/i.test(line)) jar.delete(k);
    else jar.set(k, v);
  }
};
const call = async (method, path, body) => {
  const r = await fetch(base + path, {
    method,
    redirect: "manual",
    headers: { cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "), origin: base, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  absorb(r);
  const t = await r.text();
  let j = null;
  try {
    j = JSON.parse(t);
  } catch {
    /* text */
  }
  return { s: r.status, j, t };
};
const st = await call("POST", "/api/auth/login/start", { channel: "PHONE", contact: "+919100062006" });
const vf = await call("POST", "/api/auth/login/verify", { attemptId: st.j.attemptId, code: otp });
const mem = await call("GET", "/api/auth/memberships");
const mine = mem.j.memberships.find((m) => m.collegeCode === "nsrit42");
await call("POST", "/api/auth/memberships", { membershipId: mine.id, role: "LEARNER" });
console.log("signed in as NSRIT learner, verify", vf.s, "own membership", mine.id.slice(0, 8));

const files = execSync("git ls-files src/app/api", { encoding: "utf8" }).split("\n").filter((f) => f.endsWith("/route.ts"));
const routes = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  if (!(/export\s+(const|async function|function)\s+GET\b/.test(src) || /export\s*\{[^}]*\bGET\b/.test(src))) continue;
  const path = "/" + f.replace("src/app/", "").replace(/\/route\.ts$/, "");
  const params = [...path.matchAll(/\[([A-Za-z]+)\]/g)].map((m) => m[1]);
  if (!params.length || !params.every((p) => ["membershipId", "userId", "collegeId"].includes(p))) continue;
  routes.push({ path, params });
}
const results = { total: 0, byStatus: {}, ok200: [] };
for (const other of data.others.slice(0, 4)) {
  for (const r of routes) {
    const url = r.path.replace(/\[membershipId\]/g, other.mid).replace(/\[userId\]/g, other.uid).replace(/\[collegeId\]/g, data.college);
    const res = await call("GET", url);
    results.total++;
    results.byStatus[res.s] = (results.byStatus[res.s] || 0) + 1;
    if (res.s === 200) results.ok200.push(`${r.path} -> ${res.t.slice(0, 90).replace(/\s+/g, " ")}`);
  }
}
const own = [];
for (const r of routes.filter((x) => x.params.length === 1 && x.params[0] === "membershipId")) {
  const res = await call("GET", r.path.replace("[membershipId]", mine.id));
  if (res.s === 200) own.push(r.path);
}
console.log("routes with only membership/user/college ids:", routes.length, "requests:", results.total);
console.log("status counts:", JSON.stringify(results.byStatus));
console.log("200 answers for OTHER people:", results.ok200.length);
for (const x of [...new Set(results.ok200)].slice(0, 30)) console.log("  ", x);
console.log("routes readable for the learner's OWN membership id:", own.length, own.slice(0, 8).join(" "));
await call("DELETE", "/api/auth/session");
