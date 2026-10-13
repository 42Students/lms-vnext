import http from "node:http";
import https from "node:https";

const BASE = new URL(process.env.BASE_URL ?? "http://127.0.0.1:3000");
const SECURE = BASE.protocol === "https:";
const CODE = process.env.TEST_CODE ?? "135790";
const PACE_MS = Number(process.env.PACE_MS ?? 0);
const RUN = Date.now().toString(36).toUpperCase();
let ipc = 20;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function call(method, path, { body, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const headers = {
      Origin: `${BASE.protocol}//${BASE.host}`,
      "Content-Type": "application/json",
    };
    if (!SECURE) headers["X-Forwarded-For"] = `10.5.${Math.floor(ipc / 250)}.${(ipc++ % 250) + 1}`;
    if (cookie) headers.Cookie = cookie;
    const lib = SECURE ? https : http;
    const req = lib.request(
      { hostname: BASE.hostname, port: BASE.port || (SECURE ? 443 : 80), path, method, headers },
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

async function login(phone) {
  await sleep(PACE_MS);
  const s = await call("POST", "/api/auth/login/start", { body: { channel: "PHONE", contact: phone } });
  if (s.status !== 200) return { fail: `start ${s.status} ${JSON.stringify(s.json)}` };
  const v = await call("POST", "/api/auth/login/verify", { body: { attemptId: s.json.attemptId, code: CODE, secondCode: CODE } });
  if (v.status !== 200) return { fail: `verify ${v.status} ${JSON.stringify(v.json)}` };
  return { cookie: jar(v.setCookie), verify: v };
}

// ---- 1. super admin creates an organization and college
const su = await login("9100061000");
check("super admin signs in", Boolean(su.cookie), su.fail);

const org = await call("POST", "/api/organizations", { cookie: su.cookie, body: { name: `E2E Org ${RUN}` } });
check("super admin creates an organization (201)", org.status === 201, `${org.status} ${org.text.slice(0, 160)}`);
const orgId = org.json?.organization?.id ?? org.json?.id;

const col = await call("POST", "/api/colleges", {
  cookie: su.cookie,
  body: { organizationId: orgId, name: `E2E College ${RUN}`, code: `E2E${RUN}`, city: "Test City", state: "Test State", country: "India" },
});
check("super admin creates a college (201)", col.status === 201, `${col.status} ${col.text.slice(0, 160)}`);
const collegeId = col.json?.college?.id ?? col.json?.id;

// the seeded college we must never be able to reach
const list = await call("GET", "/api/colleges", { cookie: su.cookie });
const colleges = list.json?.colleges ?? list.json?.items ?? list.json ?? [];
const testA = colleges.find?.((c) => c.code === "TESTA");
check("seeded Test College Alpha is visible to the super admin", Boolean(testA?.id), JSON.stringify(list.json).slice(0, 160));

// ---- 2. super admin onboards the college admin
const onboard = (cookie, body) => call("POST", "/api/people/onboard", { cookie, body });
const person = {
  admin: { phoneE164: "+919100061501", email: "e2e.admin@vnext.test", displayName: "E2E College Admin", roles: ["COLLEGE_ADMIN"] },
  learner: { phoneE164: "+919100061502", email: "e2e.learner@vnext.test", displayName: "E2E Learner", roles: ["LEARNER"] },
  faculty: { phoneE164: "+919100061503", email: "e2e.faculty@vnext.test", displayName: "E2E Faculty Mentor", roles: ["FACULTY", "MENTOR"] },
  tpo: { phoneE164: "+919100061504", email: "e2e.tpo@vnext.test", displayName: "E2E TPO", roles: ["FACULTY", "TPO"] },
};

let r = await onboard(su.cookie, { collegeId, ...person.admin });
const adminMembership = r.json?.person?.membership?.id;
check("super admin onboards a college admin", r.status === 200 || r.status === 201, `${r.status} ${r.text.slice(0, 200)}`);

const admin = await login("9100061501");
check("new college admin signs in with a code", Boolean(admin.cookie), admin.fail);
const adminDash = await call("GET", "/dashboard", { cookie: admin.cookie });
check("new admin lands on their own college (single college auto-selected)", adminDash.status === 200 && adminDash.text.includes(`E2E College ${RUN}`), `${adminDash.status}`);

// ---- 3. the college admin onboards their own people
const ids = {};
for (const key of ["learner", "faculty", "tpo"]) {
  r = await onboard(admin.cookie, { collegeId, ...person[key] });
  ids[key] = r.json?.person?.membership?.id;
  check(`college admin onboards ${key}`, r.status === 200 || r.status === 201, `${r.status} ${r.text.slice(0, 200)}`);
}
r = await onboard(admin.cookie, { collegeId, ...person.learner });
check("onboarding the same person again is idempotent (same membership)", (r.status === 200 || r.status === 201) && r.json?.person?.membership?.id === ids.learner, `${r.status} ${r.text.slice(0, 200)}`);

const people = await call("GET", `/api/people?collegeId=${collegeId}`, { cookie: admin.cookie });
const count = people.json?.items?.length ?? people.json?.people?.items?.length ?? people.json?.page?.items?.length;
check("college admin sees exactly the 4 people of their college", count === 4, `${people.status} count=${count} ${people.text.slice(0, 120)}`);

// ---- 4. isolation: the new admin cannot reach another college
r = await onboard(admin.cookie, { collegeId: testA?.id, phoneE164: "+919100061505", email: "e2e.other@vnext.test", displayName: "Should Not Exist", roles: ["LEARNER"] });
check("college admin cannot onboard into another college (403)", r.status === 403, `${r.status} ${r.text.slice(0, 120)}`);
r = await call("GET", `/api/people?collegeId=${testA?.id}`, { cookie: admin.cookie });
check("college admin cannot list another college's people (403)", r.status === 403, `${r.status}`);
r = await onboard(admin.cookie, { collegeId, ...person.admin, roles: ["COLLEGE_ADMIN", "SUPER_ADMIN"] });
check("a system role cannot be granted through membership roles (400)", r.status === 400, `${r.status} ${r.text.slice(0, 120)}`);

// ---- 5. each new person can sign in and gets the right shell
const learner = await login("9100061502");
check("new learner signs in", Boolean(learner.cookie), learner.fail);
const faculty = await login("9100061503");
check("new faculty+mentor signs in", Boolean(faculty.cookie), faculty.fail);
const tpo = await login("9100061504");
check("new TPO signs in", Boolean(tpo.cookie), tpo.fail);
r = await call("GET", `/api/people?collegeId=${collegeId}`, { cookie: learner.cookie });
check("a learner cannot list people (403)", r.status === 403, `${r.status}`);
r = await onboard(faculty.cookie, { collegeId, phoneE164: "+919100061506", email: "e2e.late@vnext.test", displayName: "Nope", roles: ["LEARNER"] });
check("faculty cannot onboard anyone (403)", r.status === 403, `${r.status}`);

// ---- 6. lifecycle: suspend / reactivate
const works = async (cookie) => { const d = await call("GET", "/dashboard", { cookie }); return d.status === 200 && d.text.includes(`E2E College ${RUN}`); };
check("active learner sees their college on the dashboard", await works(learner.cookie), "college name missing");
r = await call("PATCH", `/api/people/${ids.learner}/lifecycle`, { cookie: admin.cookie, body: { action: "SUSPEND", reason: "e2e check" } });
check("college admin suspends the learner", r.status === 200, `${r.status} ${r.text.slice(0, 160)}`);
check("suspended learner no longer reaches the college (existing session)", !(await works(learner.cookie)), "still shows the college");
const again = await login("9100061502");
check("suspended learner can still authenticate as a person but no college is selected for them", Boolean(again.cookie) && again.verify?.json?.selectedMembership === false, again.fail ?? JSON.stringify(again.verify?.json));
r = await call("PATCH", `/api/people/${ids.learner}/lifecycle`, { cookie: admin.cookie, body: { action: "REACTIVATE" } });
check("college admin reactivates the learner", r.status === 200, `${r.status} ${r.text.slice(0, 160)}`);
check("reactivated learner reaches the college again", await works(learner.cookie), "college name missing");

// ---- 7. role management
r = await call("PATCH", `/api/people/${ids.learner}/lifecycle`, { cookie: faculty.cookie, body: { action: "SUSPEND", reason: "nope" } });
check("faculty cannot suspend people (403)", r.status === 403, `${r.status}`);

console.log(`\n${pass} passed, ${fail} failed   (run ${RUN})`);
process.exitCode = fail ? 1 : 0;
