#!/usr/bin/env node
// Role by route matrix (SEC-03/04/08): every seeded role requests every static GET API route that reads data and the
// set of routes each role can read (HTTP 200) is compared with the committed baseline. A role gaining a route fails
// the run; a role losing one is reported (update the baseline on purpose with --write).
//
//   SWEEP_BASE=https://vnext.development.42lms.com SWEEP_OTP=<dev test code> node scripts/verify/role-route-matrix.mjs [--all-roles] [--write]
//
// Dev or localhost only. The test code is the dev AUTH_TEST_OTP; never run this against production.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const base = process.env.SWEEP_BASE;
if (!base || !/^https:\/\/[a-z0-9.-]*development\.42lms\.com$|^http:\/\/(localhost|127\.0\.0\.1):[0-9]+$/.test(base)) throw new Error("set SWEEP_BASE to a dev or local origin (never production)");
const otp = process.env.SWEEP_OTP;
if (!otp) throw new Error("set SWEEP_OTP to the dev test code");
const write = process.argv.includes("--write");
const BASELINE = process.env.MATRIX_BASELINE ?? "docs/security/role-matrix-baseline.json";
const college = process.env.SWEEP_COLLEGE ?? "TESTA";

// Seeded accounts of scripts/seed-test-tenants.ts (college A).
const FIVE_MEMBERSHIP_ROLES = [
  ["LEARNER", "+919100061101"],
  ["FACULTY", "+919100061102"],
  ["MENTOR", "+919100061103"],
  ["COLLEGE_ADMIN", "+919100061104"],
  ["TPO", "+919100061105"],
];
// Legacy baseline covers the five membership roles. --all-roles explicitly
// adds recruiter (grant-backed) and system Super Admin (no membership).
// Do not silently claim those two roles were covered by the old baseline.
const ROLES = process.argv.includes("--all-roles")
  ? [...FIVE_MEMBERSHIP_ROLES, ["RECRUITER", "+919100061301"], ["SUPER_ADMIN", "+919100061000"]]
  : FIVE_MEMBERSHIP_ROLES;

const files = execSync("git ls-files src/app/api", { encoding: "utf8" }).split("\n").filter((f) => f.endsWith("/route.ts"));
const routes = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  if (!(/export\s+(const|async function|function)\s+GET\b/.test(src) || /export\s*\{[^}]*\bGET\b/.test(src))) continue;
  const path = "/" + f.replace("src/app/", "").replace(/\/route\.ts$/, "");
  if (/\[/.test(path)) continue;
  if (/^\/api\/(auth|internal|public|v1\/public|client-errors|hello|dev)/.test(path)) continue;
  if (/(\/stream$|\/sync$|\/connect$|\/callback$)/.test(path)) continue; // SSE, state-changing GETs, OAuth
  routes.push(path);
}

class Jar {
  cookies = new Map();
  absorb(response) {
    for (const line of response.headers.getSetCookie?.() ?? []) {
      const [pair] = line.split(";");
      const i = pair.indexOf("=");
      const name = pair.slice(0, i).trim();
      const value = pair.slice(i + 1).trim();
      if (!value || /max-age=0/i.test(line)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }
  header() {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
  }
}
async function call(jar, method, path, body) {
  const response = await fetch(base + path, {
    method,
    redirect: "manual",
    headers: { cookie: jar.header(), origin: base.replace(/^http:/, "https:"), "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  jar.absorb(response);
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not json */
  }
  return { status: response.status, json };
}

const result = {};
for (const [role, phone] of ROLES) {
  const jar = new Jar();
  const start = await call(jar, "POST", "/api/auth/login/start", { channel: "PHONE", contact: phone });
  if (!start.json?.attemptId) throw new Error(`${role}: login start answered ${start.status}`);
  const verify = await call(jar, "POST", "/api/auth/login/verify", { attemptId: start.json.attemptId, code: otp });
  if (verify.status !== 200) throw new Error(`${role}: login verify answered ${verify.status}`);
  if (role !== "RECRUITER" && role !== "SUPER_ADMIN") {
    const memberships = await call(jar, "GET", "/api/auth/memberships");
    const mine = memberships.json?.memberships?.find((m) => m.collegeCode === college);
    if (!mine) throw new Error(`${role}: no ${college} membership`);
    const select = await call(jar, "POST", "/api/auth/memberships", { membershipId: mine.id, role });
    if (select.status !== 200) throw new Error(`${role}: role selection answered ${select.status}`);
  }
  // Recruiters resolve through verified employer/college grants; Super Admin
  // resolves through the system role and optional admin scope. Neither should
  // mint an arbitrary college-membership role for a GET authorization sweep.
  const allowed = [];
  const odd = [];
  for (const path of routes) {
    try {
      const r = await call(jar, "GET", path);
      if (r.status === 200) allowed.push(path);
      else if (r.status >= 500 && r.status !== 503) odd.push(`${path}:${r.status}`);
    } catch {
      odd.push(`${path}:ERR`);
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  result[role] = { allowed: allowed.sort(), serverErrors: odd };
  console.log(`${role}: ${allowed.length} readable, ${odd.length} server errors`);
  await call(jar, "DELETE", "/api/auth/session");
  await new Promise((resolve) => setTimeout(resolve, 3000)); // stay under the login start budget
}

if (!write && !existsSync(BASELINE)) {
  throw new Error("Role route baseline missing; refusing to auto-create or implicitly permit newly discovered routes.");
}
if (write) {
  // Updating five roles must not erase a previously reviewed seven-role
  // baseline; all-role additions require a separate explicit --all-roles --write.
  const previous = existsSync(BASELINE)
    ? JSON.parse(readFileSync(BASELINE,"utf8")).roles ?? {} : {};
  const merged = { ...previous, ...Object.fromEntries(
    Object.entries(result).map(([k, v]) => [k, v.allowed])) };
  writeFileSync(BASELINE, JSON.stringify({ generatedFor: base, routes: routes.length, roles: merged }, null, 1) + "\n");
  console.log(`baseline written to ${BASELINE} (review required before committing)`);
  process.exit(0);
}
const baseline = JSON.parse(readFileSync(BASELINE, "utf8")).roles;
let failures = 0;
for (const [role, { allowed, serverErrors }] of Object.entries(result)) {
  if(!Object.hasOwn(baseline,role)){
    failures++;
    console.error(`${role} HAS NO REVIEWED BASELINE. Run --all-roles --write only in a disposable dev environment, review each allowed route, then commit.`);
    continue;
  }
  const before = new Set(baseline[role]);
  const gained = allowed.filter((p) => !before.has(p));
  const lost = [...before].filter((p) => !allowed.includes(p));
  if (gained.length) {
    failures++;
    console.error(`${role} GAINED access to: ${gained.join(", ")}`);
  }
  if (lost.length) console.log(`${role} lost access to (update baseline if intended): ${lost.join(", ")}`);
  if (serverErrors.length) console.log(`${role} server errors: ${serverErrors.join(", ")}`);
}
if (failures) process.exit(1);
console.log("role-route-matrix: no role gained access");
