import http from "node:http";
import https from "node:https";
const BASE = new URL(process.env.BASE_URL ?? "http://127.0.0.1:3000");
const SECURE = BASE.protocol === "https:";
const LIVE = process.env.LIVE === "1";
const A = "testa.development.42lms.com", B = "testb.development.42lms.com";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ipc = 80;
function call(method, path, { host, body, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const target = LIVE ? (host ?? BASE.hostname) : BASE.hostname;
    const hostHeader = host ?? BASE.host;
    const headers = { Origin: `${BASE.protocol}//${hostHeader}`, "Content-Type": "application/json" };
    if (!LIVE) { headers.Host = hostHeader; headers["X-Forwarded-For"] = `10.4.4.${ipc++ % 250 + 1}`; }
    if (cookie) headers.Cookie = cookie;
    const lib = SECURE ? https : http;
    const req = lib.request({ hostname: target, port: LIVE ? 443 : BASE.port, path, method, headers }, (res) => { let d = ""; res.on("data", c => d += c); res.on("end", () => { let j = null; try { j = JSON.parse(d); } catch {} resolve({ status: res.statusCode, json: j, setCookie: res.headers["set-cookie"] ?? [], text: d }); }); });
    req.on("error", reject); if (body) req.write(JSON.stringify(body)); req.end();
  });
}
const jar = (sc) => sc.map(c => c.split(";")[0]).filter(c => !c.endsWith("=")).join("; ");
let pass = 0, fail = 0; const check = (n, ok, d = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${n}${ok ? "" : "  -> " + d}`); ok ? pass++ : fail++; };
async function login(phone, host) {
  await sleep(LIVE ? 7000 : 0);
  const s = await call("POST", "/api/auth/login/start", { host, body: { channel: "PHONE", contact: phone } });
  const v = await call("POST", "/api/auth/login/verify", { host, body: { attemptId: s.json?.attemptId, code: "135790" } });
  return jar(v.setCookie);
}
const adminA = await login("9100061104", A);
const adminB = await login("9100061204", B);
const learnerA = await login("9100061101", A);
const colleges = (await call("GET", "/api/colleges", { host: A, cookie: adminA })).json;
const idA = (colleges.colleges ?? colleges.items ?? colleges).find?.((c) => c.code === "TESTA")?.id;
const colB = (await call("GET", "/api/colleges", { host: B, cookie: adminB })).json;
const idB = (colB.colleges ?? colB.items ?? colB).find?.((c) => c.code === "TESTB")?.id;
check("resolved both college ids", Boolean(idA && idB), JSON.stringify({ idA, idB }));

let r = await call("GET", `/api/colleges/${idA}/branding`, { host: A, cookie: adminA });
check("admin A reads college A branding (defaults)", r.status === 200 && r.json?.branding?.collegeName === "Test College Alpha", `${r.status} ${r.text.slice(0, 120)}`);

const good = { logoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png", primaryColor: "#C0392B", secondaryColor: "#2C3E50", supportEmail: "help@testa.example", supportPhone: "+91 98765 43210", termsUrl: "https://example.org/terms", privacyUrl: "https://example.org/privacy" };
r = await call("PUT", `/api/colleges/${idA}/branding`, { host: A, cookie: adminA, body: good });
check("admin A saves branding (200, version 1+)", r.status === 200 && r.json?.branding?.primaryColor === "#C0392B" && r.json?.branding?.version >= 1, `${r.status} ${r.text.slice(0, 200)}`);
const v1 = r.json?.branding?.version;
r = await call("PUT", `/api/colleges/${idA}/branding`, { host: A, cookie: adminA, body: { ...good, supportPhone: "+91 11111 22222" } });
check("saving again bumps the version", r.status === 200 && r.json?.branding?.version === v1 + 1, `${r.status} v=${r.json?.branding?.version} (was ${v1})`);

for (const [label, body] of [
  ["javascript: logo", { logoUrl: "javascript:alert(1)" }],
  ["http (not https) logo", { logoUrl: "http://example.org/a.png" }],
  ["data: background", { loginBackgroundUrl: "data:image/png;base64,AAAA" }],
  ["bad colour", { primaryColor: "red" }],
  ["unknown field", { collegeId: "x" }],
]) {
  r = await call("PUT", `/api/colleges/${idA}/branding`, { host: A, cookie: adminA, body });
  check(`rejects ${label} (400)`, r.status === 400, `${r.status}`);
}

r = await call("PUT", `/api/colleges/${idA}/branding`, { host: B, cookie: adminB, body: good });
check("admin B cannot change college A branding (403)", r.status === 403, `${r.status}`);
r = await call("GET", `/api/colleges/${idA}/branding`, { host: B, cookie: adminB });
check("admin B cannot read college A branding (403)", r.status === 403, `${r.status}`);
r = await call("PUT", `/api/colleges/${idA}/branding`, { host: A, cookie: learnerA, body: good });
check("a learner cannot change branding (403)", r.status === 403, `${r.status}`);
r = await call("PUT", `/api/colleges/${idA}/branding`, { host: A, body: good });
check("anonymous cannot change branding (401)", r.status === 401, `${r.status}`);

const home = await call("GET", "/", { host: A });
check("college A sign-in page shows its saved colour as the theme", /--primary:\s*#C0392B/i.test(home.text) || /#C0392B/i.test(home.text), "colour not in page");
check("sign-in page shows the logo", home.text.includes("PNG_transparency_demonstration_1.png"), "logo missing");
check("sign-in page shows support details", home.text.includes("help@testa.example"), "support missing");
const homeB = await call("GET", "/", { host: B });
check("college B sign-in page is unaffected by A's colour", !/#C0392B/i.test(homeB.text), "A's colour leaked to B");
const page = await call("GET", "/college/branding", { host: A, cookie: adminA });
check("college admin can open the branding editor page", page.status === 200 && /Branding/.test(page.text), `${page.status}`);
const pageL = await call("GET", "/college/branding", { host: A, cookie: learnerA });
check("a learner never receives the editor form (redirected away)", !pageL.text.includes("Save branding") && (pageL.status >= 300 || /NEXT_REDIRECT|\/dashboard/.test(pageL.text)), `${pageL.status}`);
check("the admin does receive the editor form", page.text.includes("Save branding"), "form missing");

console.log(`\n${pass} passed, ${fail} failed`); process.exitCode = fail ? 1 : 0;
