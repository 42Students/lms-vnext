// Signs in every NSRIT QA persona on the NSRIT college address and checks that the
// dashboard serves. Dev only. Usage: node scripts/verify/nsrit-qa-login.mjs
import https from "node:https";

const HOST = process.env.NSRIT_HOST ?? "nsrit.development.42lms.com";
const CODE = process.env.TEST_CODE ?? "135790";
const PACE_MS = Number(process.env.PACE_MS ?? 6500);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function call(method, path, { body, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const headers = { Origin: `https://${HOST}`, "Content-Type": "application/json" };
    if (cookie) headers.Cookie = cookie;
    const req = https.request({ hostname: HOST, port: 443, path, method, headers, timeout: 25000 }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, json, setCookie: res.headers["set-cookie"] ?? [], location: res.headers.location, text: data });
      });
    });
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("timeout")));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}
const jar = (sc) => sc.map((c) => c.split(";")[0]).filter((c) => !c.endsWith("=")).join("; ");

const PERSONAS = [
  ["college admin", "9100062001"],
  ["tpo", "9100062002"],
  ["recruiter", "9100062003"],
  ["faculty (most courses)", "9100062004"],
  ["mentor (most projects)", "9100062005"],
  ["learner (most applications)", "9100062006"],
  ["learner (has an offer)", "9100062007"],
  ["learner (most notifications)", "9100062008"],
];

let pass = 0;
let fail = 0;
for (const [label, phone] of PERSONAS) {
  await sleep(PACE_MS);
  const s = await call("POST", "/api/auth/login/start", { body: { channel: "PHONE", contact: phone } });
  if (s.status !== 200) {
    console.log(`FAIL  ${label}: start ${s.status} ${s.text.slice(0, 120)}`);
    fail++;
    continue;
  }
  const v = await call("POST", "/api/auth/login/verify", { body: { attemptId: s.json.attemptId, code: CODE, secondCode: CODE } });
  if (v.status !== 200) {
    console.log(`FAIL  ${label}: verify ${v.status} ${v.text.slice(0, 120)}`);
    fail++;
    continue;
  }
  const cookie = jar(v.setCookie);
  const dash = await call("GET", "/dashboard", { cookie });
  const ok = dash.status === 200 && /NSRIT/i.test(dash.text);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: dashboard ${dash.status}${ok ? "" : " " + (dash.location ?? "")}`);
  ok ? pass++ : fail++;
  await call("DELETE", "/api/auth/session", { cookie });
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
