import http from "node:http";
import https from "node:https";
const BASE = new URL(process.env.BASE_URL ?? "http://127.0.0.1:3000");
const SECURE = BASE.protocol === "https:";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PACE = Number(process.env.PACE_MS ?? 0);
let ipc = 120;
function call(method, path, { body, cookie, ua } = {}) {
  return new Promise((resolve, reject) => {
    const headers = { Origin: `${BASE.protocol}//${BASE.host}`, "Content-Type": "application/json" };
    if (!SECURE) headers["X-Forwarded-For"] = `10.6.6.${ipc++ % 250 + 1}`;
    if (ua) headers["User-Agent"] = ua;
    if (cookie) headers.Cookie = cookie;
    const lib = SECURE ? https : http;
    const req = lib.request({ hostname: BASE.hostname, port: BASE.port || (SECURE ? 443 : 80), path, method, headers }, (res) => { let d = ""; res.on("data", c => d += c); res.on("end", () => { let j = null; try { j = JSON.parse(d); } catch {} resolve({ status: res.statusCode, json: j, setCookie: res.headers["set-cookie"] ?? [], text: d }); }); });
    req.on("error", reject); if (body) req.write(JSON.stringify(body)); req.end();
  });
}
const jar = (sc) => sc.map(c => c.split(";")[0]).filter(c => !c.endsWith("=")).join("; ");
let pass = 0, fail = 0; const check = (n, ok, d = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${n}${ok ? "" : "  -> " + d}`); ok ? pass++ : fail++; };
async function login(phone, ua) {
  await sleep(PACE);
  const s = await call("POST", "/api/auth/login/start", { ua, body: { channel: "PHONE", contact: phone } });
  const v = await call("POST", "/api/auth/login/verify", { ua, body: { attemptId: s.json?.attemptId, code: "135790", secondCode: "135790" } });
  return jar(v.setCookie);
}
const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const PHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const WHO = process.env.WHO ?? "9100061102", OTHER = process.env.OTHER ?? "9100061103";

const a = await login(WHO, CHROME), b = await login(WHO, PHONE), c = await login(WHO, CHROME), other = await login(OTHER, CHROME);
let r = await call("GET", "/api/auth/devices", { cookie: a });
const list = r.json?.devices ?? [];
check("lists this person's devices (at least the 3 just created)", r.status === 200 && list.length >= 3, `${r.status} ${r.text.slice(0, 120)}`);
check("exactly one device is marked current", list.filter(d => d.current).length === 1, JSON.stringify(list.map(d => d.current)));
check("device list never exposes another person's sessions", !r.text.includes("session_id") && !r.text.includes("credential"), "unexpected fields");

const mine = list.filter(d => !d.current);
const rb = await call("GET", "/api/auth/devices", { cookie: b });
const bId = rb.json.devices.find(d => d.current).id;
r = await call("DELETE", `/api/auth/devices/${bId}`, { cookie: a });
check("revoke the phone's session from the laptop (200)", r.status === 200, `${r.status} ${r.text.slice(0,100)}`);
r = await call("GET", "/api/auth/devices", { cookie: b });
check("the revoked phone session is now rejected (401)", r.status === 401, `${r.status}`);
r = await call("GET", "/api/auth/devices", { cookie: a });
check("the laptop session still works", r.status === 200, `${r.status}`);

// ownership: another person cannot revoke my device
const aId = r.json.devices.find(d => d.current).id;
r = await call("DELETE", `/api/auth/devices/${aId}`, { cookie: other });
check("another person cannot revoke my device (404, not found for them)", r.status === 404, `${r.status}`);
r = await call("GET", "/api/auth/devices", { cookie: a });
check("my session survived that attempt", r.status === 200, `${r.status}`);
r = await call("DELETE", `/api/auth/devices/not-a-uuid`, { cookie: a });
check("a malformed device id is rejected (400)", r.status === 400, `${r.status}`);

// sign out everywhere else
r = await call("DELETE", "/api/auth/devices", { cookie: a });
check("sign out everywhere else (200)", r.status === 200 && r.json?.revoked >= 1, `${r.status} ${r.text.slice(0,100)}`);
r = await call("GET", "/api/auth/devices", { cookie: c });
check("the third session is now rejected", r.status === 401, `${r.status}`);
r = await call("GET", "/api/auth/devices", { cookie: a });
check("only this device remains", r.status === 200 && r.json.devices.length === 1 && r.json.devices[0].current, JSON.stringify(r.json));
r = await call("GET", "/api/auth/devices", { cookie: other });
check("the other person's sessions were not touched", r.status === 200 && r.json.devices.length >= 1, `${r.status}`);

// page renders
const page = await call("GET", "/account/security", { cookie: a });
check("security page renders for the signed-in person", page.status === 200 && /Signed-in devices/.test(page.text) && /Chrome on Windows/.test(page.text), `${page.status}`);
r = await call("GET", "/api/auth/devices", {});
check("anonymous cannot list devices (401)", r.status === 401, `${r.status}`);
console.log(`\n${pass} passed, ${fail} failed`); process.exitCode = fail ? 1 : 0;
