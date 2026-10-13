// Checks the College Admin surfaces added for Student Groups, Lecture Halls
// and My Profile, including who must NOT be able to see or change them.
//
//   LIVE=1 PACE_MS=7000 BASE_URL=https://vnext.development.42lms.com node scripts/verify/college-admin-pages.mjs
//   BASE_URL=http://127.0.0.1:3000 node scripts/verify/college-admin-pages.mjs      (local)
import http from "node:http";
import https from "node:https";

const BASE = new URL(process.env.BASE_URL ?? "http://127.0.0.1:3000");
const LIVE = process.env.LIVE === "1";
const PACE = Number(process.env.PACE_MS ?? 0);
const A = "testa.development.42lms.com";
const B = "testb.development.42lms.com";
const CODE = process.env.TEST_CODE ?? "135790";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ipc = 140;

function call(method, path, { host, body, cookie, origin } = {}) {
  return new Promise((resolve, reject) => {
    const hostHeader = host ?? BASE.host;
    const headers = {
      Origin: origin ?? `${BASE.protocol}//${hostHeader}`,
      "Content-Type": "application/json",
    };
    if (!LIVE) {
      headers.Host = hostHeader;
      headers["X-Forwarded-For"] = `10.3.3.${(ipc++ % 250) + 1}`;
    }
    if (cookie) headers.Cookie = cookie;
    const lib = LIVE ? https : http;
    const req = lib.request(
      {
        hostname: LIVE ? (host ?? BASE.hostname) : BASE.hostname,
        port: LIVE ? 443 : BASE.port,
        path,
        method,
        headers,
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          let json = null;
          try { json = JSON.parse(d); } catch {}
          resolve({ status: res.statusCode, json, setCookie: res.headers["set-cookie"] ?? [], text: d });
        });
      },
    );
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const jar = (sc) => sc.map((c) => c.split(";")[0]).filter((c) => !c.endsWith("=")).join("; ");
let pass = 0, fail = 0;
const check = (n, ok, d = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${n}${ok ? "" : "  -> " + d}`); ok ? pass++ : fail++; };

async function login(phone, host) {
  await sleep(PACE);
  const s = await call("POST", "/api/auth/login/start", { host, body: { channel: "PHONE", contact: phone } });
  const v = await call("POST", "/api/auth/login/verify", { host, body: { attemptId: s.json?.attemptId, code: CODE, secondCode: CODE } });
  return jar(v.setCookie);
}

const hostA = LIVE ? A : undefined;
const hostB = LIVE ? B : undefined;
const admin = await login("9100061104", hostA);
const adminB = await login("9100061204", hostB);
const learner = await login("9100061101", hostA);

const cols = (await call("GET", "/api/colleges", { host: hostA, cookie: admin })).json;
const idA = (cols.colleges ?? cols.items ?? cols).find((c) => c.code === "TESTA")?.id;
check("resolved college A", Boolean(idA));

// ---- Student Groups (read only)
let r = await call("GET", "/college/groups", { host: hostA, cookie: admin });
check("admin sees the Student groups page", r.status === 200 && /Student groups/.test(r.text), String(r.status));
r = await call("GET", "/college/groups", { host: hostA, cookie: learner });
check("a learner does not receive the groups page", !/Student groups/.test(r.text), "leaked");
r = await call("GET", "/college/groups/00000000-0000-4000-8000-000000000000", { host: hostA, cookie: admin });
check("an unknown group id is not found (404 or not-found page)", r.status === 404 || /not found|could not be found/i.test(r.text), String(r.status));

// ---- Lecture Halls
const name = "Verify Hall " + Date.now().toString(36);
r = await call("POST", "/api/lecture-halls", { host: hostA, cookie: admin, body: { collegeId: idA, name, capacity: 90, roomType: "LAB" } });
check("admin creates a hall (201)", r.status === 201, `${r.status} ${r.text.slice(0, 120)}`);
const hallId = r.json?.hall?.id;
r = await call("POST", "/api/lecture-halls", { host: hostA, cookie: admin, body: { collegeId: idA, name: name.toUpperCase(), capacity: 5, roomType: "LAB" } });
check("duplicate name -> 409 HALL_NAME_TAKEN", r.status === 409 && r.json?.error === "HALL_NAME_TAKEN", `${r.status}`);
r = await call("PATCH", `/api/lecture-halls/${hallId}`, { host: hostB, cookie: adminB, body: { capacity: 1 } });
check("another college's admin cannot edit it (403)", r.status === 403, String(r.status));
r = await call("PATCH", `/api/lecture-halls/${hallId}`, { host: hostA, cookie: learner, body: { capacity: 1 } });
check("a learner cannot edit it (403)", r.status === 403, String(r.status));
r = await call("GET", "/college/lecture-halls", { host: hostA, cookie: admin });
check("the halls page lists it", r.status === 200 && r.text.includes(name), String(r.status));
r = await call("PATCH", `/api/lecture-halls/${hallId}`, { host: hostA, cookie: admin, body: { status: "ARCHIVED" } });
check("admin archives it", r.status === 200 && r.json?.hall?.status === "ARCHIVED", String(r.status));

// ---- My Profile
r = await call("GET", "/college/profile", { host: hostA, cookie: admin });
check("admin sees My profile with name, college and role", r.status === 200 && /Test College Admin A/.test(r.text) && /Test College Alpha/.test(r.text) && /College Admin/.test(r.text), String(r.status));
r = await call("GET", "/college/profile", { host: hostA, cookie: learner });
check("a learner does not receive the college admin profile", !/Roles in this college/.test(r.text), "leaked");

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
