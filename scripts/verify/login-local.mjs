import http from "node:http";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const CODE = process.env.TEST_CODE ?? "135790";
const u = new URL(BASE);

let ipCounter = 10;
function call(method, path, { host, body, cookie, ip } = {}) {
  return new Promise((resolve, reject) => {
    const headers = {
      Host: host ?? u.host,
      Origin: `${u.protocol}//${host ?? u.host}`,
      "Content-Type": "application/json",
      "X-Forwarded-For": ip ?? `10.0.${Math.floor(ipCounter / 250)}.${(ipCounter++ % 250) + 1}`,
    };
    if (cookie) headers.Cookie = cookie;
    const req = http.request(
      { hostname: u.hostname, port: u.port, path, method, headers },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          let json = null;
          try { json = JSON.parse(data); } catch {}
          const setCookie = res.headers["set-cookie"] ?? [];
          resolve({ status: res.statusCode, json, setCookie, location: res.headers.location, text: data });
        });
      },
    );
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const jar = (setCookie) =>
  setCookie
    .map((c) => c.split(";")[0])
    .filter((c) => !c.endsWith("="))
    .join("; ");

let pass = 0, fail = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + detail}`);
  ok ? pass++ : fail++;
}

async function login(contact, { host, channel = "PHONE", code = CODE } = {}) {
  const start = await call("POST", "/api/auth/login/start", { host, body: { channel, contact } });
  if (start.status !== 200) return { start };
  const verify = await call("POST", "/api/auth/login/verify", { host, body: { attemptId: start.json.attemptId, code, secondCode: code } });
  return { start, verify, cookie: jar(verify.setCookie) };
}

const A = "testa.development.42lms.com";
const B = "testb.development.42lms.com";

// 1 platform host sign-in for each role
for (const [label, phone] of [
  ["learner A", "9100061101"], ["faculty A", "9100061102"], ["mentor A", "9100061103"],
  ["college admin A", "9100061104"], ["tpo A", "9100061105"], ["learner B", "9100061201"],
  ["college admin B", "9100061204"], ["hr/recruiter", "9100061301"],
  ["shared faculty", "9100061401"], ["super admin", "9100061000"],
]) {
  const r = await login(phone);
  check(`platform sign-in by phone: ${label}`, r.verify?.status === 200, JSON.stringify(r.verify?.json ?? r.start?.json));
}

// 2 email channel
{
  const r = await login("Admin.A@vnext.test", { channel: "EMAIL" });
  check("platform sign-in by email (case-insensitive): college admin A", r.verify?.status === 200, JSON.stringify(r.verify?.json ?? r.start?.json));
}

// 3 session is real: dashboard reachable, then logout kills it
{
  const r = await login("9100061104");
  const dash = await call("GET", "/dashboard", { cookie: r.cookie });
  check("authenticated /dashboard serves (200)", dash.status === 200, `${dash.status} ${dash.location ?? ""}`);
  check("college admin A auto-selected single college (page names it)", /Test College Alpha/.test(dash.text), "college name missing");
  const out = await call("DELETE", "/api/auth/session", { cookie: r.cookie });
  check("logout succeeds", out.status === 200, String(out.status));
  const after = await call("GET", "/dashboard", { cookie: r.cookie });
  check("revoked session no longer works (redirect)", after.status >= 300 && after.status < 400, `${after.status}`);
}

// 4 wrong codes + budget + replay
{
  const s = await call("POST", "/api/auth/login/start", { body: { channel: "PHONE", contact: "9100061101" } });
  const id = s.json.attemptId;
  const codes = [];
  for (let i = 0; i < 5; i++) {
    const r = await call("POST", "/api/auth/login/verify", { body: { attemptId: id, code: "000000" } });
    codes.push(r.status + ":" + r.json?.error);
  }
  check("5 wrong codes -> 401 INCORRECT_OTP each", codes.every((c) => c === "401:INCORRECT_OTP"), codes.join(","));
  const sixth = await call("POST", "/api/auth/login/verify", { body: { attemptId: id, code: CODE, secondCode: CODE } });
  check("budget spent: even the right code is refused (429)", sixth.status === 429 && sixth.json?.error === "OTP_ATTEMPTS_EXCEEDED", JSON.stringify(sixth.json));
}
{
  const s = await call("POST", "/api/auth/login/start", { body: { channel: "PHONE", contact: "9100061102" } });
  const ok = await call("POST", "/api/auth/login/verify", { body: { attemptId: s.json.attemptId, code: CODE, secondCode: CODE } });
  const replay = await call("POST", "/api/auth/login/verify", { body: { attemptId: s.json.attemptId, code: CODE, secondCode: CODE } });
  check("code works once", ok.status === 200, String(ok.status));
  check("replay of a used challenge fails (401 INVALID_ATTEMPT)", replay.status === 401 && replay.json?.error === "INVALID_ATTEMPT", JSON.stringify(replay.json));
}

// 5 unknown / disabled-style inputs
{
  const r1 = await call("POST", "/api/auth/login/start", { body: { channel: "PHONE", contact: "9999999999" } });
  check("unknown number -> 404 NOT_REGISTERED", r1.status === 404 && r1.json?.error === "NOT_REGISTERED", JSON.stringify(r1.json));
  const r2 = await call("POST", "/api/auth/login/start", { body: { channel: "PHONE", contact: "abc" } });
  check("garbage contact -> 400 INVALID_CONTACT", r2.status === 400 && r2.json?.error === "INVALID_CONTACT", JSON.stringify(r2.json));
  const r3 = await call("POST", "/api/auth/login/start", { body: { nonsense: true } });
  check("malformed body -> 400", r3.status === 400, String(r3.status));
}

// 6 multi-tenant host behaviour
{
  let r = await login("9100061101", { host: A });
  check("college A host: learner A signs in", r.verify?.status === 200, JSON.stringify(r.verify?.json ?? r.start?.json));
  const dash = await call("GET", "/dashboard", { host: A, cookie: r.cookie });
  check("college A host: dashboard serves for learner A", dash.status === 200, `${dash.status}`);

  r = await login("9100061201", { host: A });
  check("college A host: learner B is refused (NO_ACCOUNT_FOR_DOMAIN)", r.start?.status === 404 && r.start?.json?.error === "NO_ACCOUNT_FOR_DOMAIN", JSON.stringify(r.start?.json));

  r = await login("9100061101", { host: B });
  check("college B host: learner A is refused", r.start?.status === 404 && r.start?.json?.error === "NO_ACCOUNT_FOR_DOMAIN", JSON.stringify(r.start?.json));

  r = await login("9100061301", { host: A });
  check("college A host: recruiter with grant is allowed", r.verify?.status === 200, JSON.stringify(r.verify?.json ?? r.start?.json));
  r = await login("9100061301", { host: B });
  check("college B host: recruiter with grant is allowed", r.verify?.status === 200, JSON.stringify(r.verify?.json ?? r.start?.json));

  r = await login("9100061000", { host: A });
  check("college host: super admin must use platform host (refused)", r.start?.status === 404, JSON.stringify(r.start?.json));

  r = await login("9100061401", { host: B });
  check("shared faculty signs in on college B host", r.verify?.status === 200, JSON.stringify(r.verify?.json ?? r.start?.json));
  const selected = r.verify?.setCookie?.some((c) => c.startsWith("lms_membership=") && !c.startsWith("lms_membership=;"));
  check("college host fixes the membership cookie", Boolean(selected), JSON.stringify(r.verify?.setCookie));

  // challenge started on A cannot be used on B or the platform host
  const s = await call("POST", "/api/auth/login/start", { host: A, body: { channel: "PHONE", contact: "9100061101" } });
  const onB = await call("POST", "/api/auth/login/verify", { host: B, body: { attemptId: s.json.attemptId, code: CODE, secondCode: CODE } });
  check("challenge from host A rejected on host B (WRONG_TENANT)", onB.status === 403 && onB.json?.error === "WRONG_TENANT", JSON.stringify(onB.json));
  const onPlatform = await call("POST", "/api/auth/login/verify", { body: { attemptId: s.json.attemptId, code: CODE, secondCode: CODE } });
  check("challenge from host A rejected on platform host", onPlatform.status === 403, String(onPlatform.status));
}

// 7 unknown host fails closed
{
  const r = await call("POST", "/api/auth/login/start", { host: "evil.example.com", body: { channel: "PHONE", contact: "9100061101" } });
  check("unknown host fails closed (404 UNKNOWN_TENANT_HOST)", r.status === 404 && r.json?.error === "UNKNOWN_TENANT_HOST", JSON.stringify(r.json));
}

// 8 origin guard
{
  const r = await new Promise((resolve) => {
    const req = http.request({ hostname: u.hostname, port: u.port, path: "/api/auth/login/start", method: "POST", headers: { Host: u.host, Origin: "https://evil.example.com", "Content-Type": "application/json" } }, (res) => { res.resume(); res.on("end", () => resolve(res.statusCode)); });
    req.write(JSON.stringify({ channel: "PHONE", contact: "9100061101" })); req.end();
  });
  check("cross-origin POST rejected (403)", r === 403, String(r));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;

// 9 post-login host enforcement: a session minted on host A must not open host B or the unknown host
{
  const ha = "testa.development.42lms.com", hb = "testb.development.42lms.com";
  const r = await login("9100061102", { host: ha });
  const onA = await call("GET", "/dashboard", { host: ha, cookie: r.cookie });
  const onB = await call("GET", "/dashboard", { host: hb, cookie: r.cookie });
  const onUnknown = await call("GET", "/dashboard", { host: "evil.example.com", cookie: r.cookie });
  const onApiB = await call("GET", "/api/auth/memberships", { host: hb, cookie: r.cookie });
  check("session opens its own college host", onA.status === 200, String(onA.status));
  check("college A session refused on college B host (redirect)", onB.status >= 300 && onB.status < 400, String(onB.status));
  check("college A session refused on an unknown host (redirect)", onUnknown.status >= 300 && onUnknown.status < 400, String(onUnknown.status));
  check("college A session refused by the API on college B host", onApiB.status === 401 || onApiB.status === 403 || (onApiB.status >= 300 && onApiB.status < 400), String(onApiB.status));
  console.log(`\n${pass} passed, ${fail} failed (after host-enforcement checks)`);
  process.exitCode = fail ? 1 : 0;
}
