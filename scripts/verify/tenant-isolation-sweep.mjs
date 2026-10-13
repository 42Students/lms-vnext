/**
 * Black-box tenant isolation sweep (exploratory, read-only).
 *
 * 1. Sign in as every seeded role of college B and list every parameterless GET
 *    API, harvesting every UUID that appears (college B's ids).
 * 2. Sign in as college A users and replay every GET API that takes an id,
 *    substituting each of B's ids that A cannot see itself.
 * 3. Any 200 that carries data is reported as a possible cross-tenant read.
 *
 * Usage (local server with the seeded test tenants):
 *   BASE_URL=http://127.0.0.1:3000 node scripts/verify/tenant-isolation-sweep.mjs
 * Exits non-zero when something is reported. Review each finding: ids that are
 * genuinely shared by design (for example the common organization) are expected.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const CODE = process.env.TEST_CODE ?? "135790";
const MAX_IDS = Number(process.env.MAX_IDS ?? 25);
const u = new URL(BASE);
const HOST_A = "testa.development.42lms.com";
const HOST_B = "testb.development.42lms.com";
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;

let ip = 20;
function call(method, route, { host, body, cookie } = {}) {
  return new Promise((resolve) => {
    const headers = {
      Host: host ?? u.host,
      Origin: `${u.protocol}//${host ?? u.host}`,
      "Content-Type": "application/json",
      "X-Forwarded-For": `10.9.${Math.floor(ip / 250)}.${(ip++ % 250) + 1}`,
    };
    if (cookie) headers.Cookie = cookie;
    const req = http.request(
      { hostname: u.hostname, port: u.port, path: route, method, headers },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          let json = null;
          try { json = JSON.parse(data); } catch {}
          resolve({ status: res.statusCode, json, text: data, setCookie: res.headers["set-cookie"] ?? [] });
        });
      },
    );
    req.on("error", () => resolve({ status: 0, json: null, text: "", setCookie: [] }));
    req.setTimeout(60000, () => req.destroy());
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}
const jar = (sc) => sc.map((c) => c.split(";")[0]).filter((c) => !c.endsWith("=")).join("; ");

async function login(phone, host) {
  const s = await call("POST", "/api/auth/login/start", { host, body: { channel: "PHONE", contact: phone } });
  if (s.status !== 200) return null;
  const v = await call("POST", "/api/auth/login/verify", {
    host,
    body: { attemptId: s.json.attemptId, code: CODE, secondCode: CODE },
  });
  return v.status === 200 ? jar(v.setCookie) : null;
}

// Seeded test accounts (scripts/seed-test-tenants.ts): learner, faculty, mentor, admin, tpo.
const A_PHONES = { learner: "9100061101", faculty: "9100061102", admin: "9100061104", tpo: "9100061105" };
const B_PHONES = { learner: "9100061201", faculty: "9100061202", admin: "9100061204", tpo: "9100061205" };

function routes() {
  const root = path.join(process.cwd(), "src/app/api");
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === "route.ts" && /export\s+async\s+function\s+GET\b/.test(fs.readFileSync(full, "utf8"))) {
        out.push("/api/" + path.relative(root, path.dirname(full)).replace(/\\/g, "/"));
      }
    }
  };
  walk(root);
  return out.filter((r) => !r.startsWith("/api/auth") && !r.startsWith("/api/public"));
}

const all = routes();
const listRoutes = all.filter((r) => !r.includes("["));
const idRoutes = all.filter((r) => r.includes("["));
console.log(`${listRoutes.length} list routes, ${idRoutes.length} id routes`);

const sessionsA = {};
const sessionsB = {};
for (const [role, phone] of Object.entries(A_PHONES)) sessionsA[role] = await login(phone, HOST_A);
for (const [role, phone] of Object.entries(B_PHONES)) sessionsB[role] = await login(phone, HOST_B);
for (const [name, set] of [["A", sessionsA], ["B", sessionsB]]) {
  for (const [role, cookie] of Object.entries(set)) if (!cookie) console.log(`WARN  could not sign in ${name} ${role}`);
}

async function harvest(sessions, host) {
  const ids = new Set();
  for (const cookie of Object.values(sessions)) {
    if (!cookie) continue;
    for (const route of listRoutes) {
      const r = await call("GET", route, { host, cookie });
      if (r.status === 200) for (const m of r.text.matchAll(UUID)) ids.add(m[0].toLowerCase());
    }
  }
  return ids;
}

console.log("harvesting college B ids...");
const bIds = await harvest(sessionsB, HOST_B);
console.log("harvesting college A ids (to exclude shared ones)...");
const aIds = await harvest(sessionsA, HOST_A);
const foreign = [...bIds].filter((id) => !aIds.has(id)).slice(0, MAX_IDS);
console.log(`B ids: ${bIds.size}, A ids: ${aIds.size}, probing with ${foreign.length} B-only ids`);

const findings = [];
let probes = 0;
for (const [role, cookie] of Object.entries(sessionsA)) {
  if (!cookie) continue;
  for (const route of idRoutes) {
    for (const id of foreign) {
      const target = route.replace(/\[[^\]]+\]/g, id);
      const r = await call("GET", target, { host: HOST_A, cookie });
      probes++;
      const hasData = r.status === 200 && r.text.length > 2 && !/^\s*\{\s*\}\s*$/.test(r.text);
      // A reflected id alone is not a leak; look for the id inside a returned payload.
      if (hasData && r.text.toLowerCase().includes(id)) {
        findings.push(`${role} ${target} -> 200 (id echoed in body)`);
      } else if (r.status >= 500) {
        findings.push(`${role} ${target} -> ${r.status} (server error)`);
      }
    }
  }
}

console.log(`\n${probes} probes`);
for (const f of findings) console.log("FINDING  " + f);
console.log(findings.length ? `\n${findings.length} finding(s) to review` : "\nPASS  no cross-tenant read observed");
process.exitCode = findings.length ? 1 : 0;
