import https from "node:https";

const PLATFORM = "vnext.development.42lms.com";
const A = "testa.development.42lms.com";
const B = "testb.development.42lms.com";
const CODE = process.env.TEST_CODE ?? "135790";
const PACE_MS = Number(process.env.PACE_MS ?? 6500);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function call(method, path, { host = PLATFORM, body, cookie, origin } = {}) {
  return new Promise((resolve, reject) => {
    const headers = {
      Origin: origin ?? `https://${host}`,
      "Content-Type": "application/json",
    };
    if (cookie) headers.Cookie = cookie;
    const req = https.request(
      { hostname: host, port: 443, path, method, headers, timeout: 20000 },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          let json = null;
          try { json = JSON.parse(data); } catch {}
          resolve({
            status: res.statusCode,
            json,
            setCookie: res.headers["set-cookie"] ?? [],
            location: res.headers.location,
            text: data,
          });
        });
      },
    );
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("timeout")));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const jar = (setCookie) =>
  setCookie.map((c) => c.split(";")[0]).filter((c) => !c.endsWith("=")).join("; ");

let pass = 0, fail = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + detail}`);
  ok ? pass++ : fail++;
}

async function start(contact, opts = {}) {
  await sleep(PACE_MS);
  return call("POST", "/api/auth/login/start", {
    host: opts.host,
    body: { channel: opts.channel ?? "PHONE", contact },
  });
}

async function login(contact, opts = {}) {
  const s = await start(contact, opts);
  if (s.status !== 200) return { start: s };
  const v = await call("POST", "/api/auth/login/verify", {
    host: opts.host,
    body: { attemptId: s.json.attemptId, code: opts.code ?? CODE, secondCode: opts.code ?? CODE },
  });
  return { start: s, verify: v, cookie: jar(v.setCookie) };
}

// 0 deployment is the right build
{
  const r = await call("GET", "/ready");
  check("live /ready reports database ok", r.status === 200 && r.json?.dependencies?.database === "ok", r.text.slice(0, 120));
}

// 1 every role by phone on the platform host
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
  const r = await login("Admin.B@vnext.test", { channel: "EMAIL" });
  check("platform sign-in by email: college admin B", r.verify?.status === 200, JSON.stringify(r.verify?.json ?? r.start?.json));
}

// 3 session works, logout revokes
{
  const r = await login("9100061201");
  const dash = await call("GET", "/dashboard", { cookie: r.cookie });
  check("authenticated /dashboard serves (200)", dash.status === 200, `${dash.status} ${dash.location ?? ""}`);
  check("learner B auto-selected the single college", /Test College Beta/.test(dash.text), "college name missing");
  const out = await call("DELETE", "/api/auth/session", { cookie: r.cookie });
  check("logout succeeds", out.status === 200, String(out.status));
  const after = await call("GET", "/dashboard", { cookie: r.cookie });
  check("revoked session no longer works", after.status >= 300 && after.status < 400, String(after.status));
}

// 4 wrong codes, budget, replay
{
  // This block makes ~9 verify calls in a burst; let the per-IP minute window
  // (10 verifies/min) reset so the limiter does not mask the OTP rules.
  await sleep(65000);
  const s = await start("9100061202");
  const codes = [];
  for (let i = 0; i < 5; i++) {
    const r = await call("POST", "/api/auth/login/verify", { body: { attemptId: s.json.attemptId, code: "000000" } });
    codes.push(`${r.status}:${r.json?.error}`);
  }
  check("5 wrong codes -> 401 INCORRECT_OTP", codes.every((c) => c === "401:INCORRECT_OTP"), codes.join(","));
  const sixth = await call("POST", "/api/auth/login/verify", { body: { attemptId: s.json.attemptId, code: CODE, secondCode: CODE } });
  check("budget spent: right code refused (429)", sixth.status === 429 && sixth.json?.error === "OTP_ATTEMPTS_EXCEEDED", JSON.stringify(sixth.json));
}
{
  const s = await start("9100061203");
  const ok = await call("POST", "/api/auth/login/verify", { body: { attemptId: s.json.attemptId, code: CODE, secondCode: CODE } });
  const replay = await call("POST", "/api/auth/login/verify", { body: { attemptId: s.json.attemptId, code: CODE, secondCode: CODE } });
  check("code works once", ok.status === 200, String(ok.status));
  check("replay fails (401 INVALID_ATTEMPT)", replay.status === 401 && replay.json?.error === "INVALID_ATTEMPT", JSON.stringify(replay.json));
}

// 5 bad inputs
{
  const r1 = await start("9999999999");
  check("unknown number -> 404 NOT_REGISTERED", r1.status === 404 && r1.json?.error === "NOT_REGISTERED", JSON.stringify(r1.json));
  const r2 = await start("abc");
  check("garbage contact -> 400", r2.status === 400, JSON.stringify(r2.json));
}

// 6 multi-tenant on the real college hosts
{
  let r = await login("9100061102", { host: A });
  check("host A: faculty A signs in", r.verify?.status === 200, JSON.stringify(r.verify?.json ?? r.start?.json));
  const dash = await call("GET", "/dashboard", { host: A, cookie: r.cookie });
  check("host A: dashboard serves and names Test College Alpha", dash.status === 200 && /Test College Alpha/.test(dash.text), `${dash.status}`);

  const home = await call("GET", "/", { host: A });
  check("host A: sign-in page is college-branded", home.status === 200 && /Test College Alpha/.test(home.text), `${home.status}`);

  r = await start("9100061201", { host: A });
  check("host A: learner B refused (NO_ACCOUNT_FOR_DOMAIN)", r.status === 404 && r.json?.error === "NO_ACCOUNT_FOR_DOMAIN", JSON.stringify(r.json));
  r = await start("9100061101", { host: B });
  check("host B: learner A refused", r.status === 404 && r.json?.error === "NO_ACCOUNT_FOR_DOMAIN", JSON.stringify(r.json));

  r = await login("9100061301", { host: A });
  check("host A: recruiter with grant allowed", r.verify?.status === 200, JSON.stringify(r.verify?.json ?? r.start?.json));
  r = await login("9100061301", { host: B });
  check("host B: recruiter with grant allowed", r.verify?.status === 200, JSON.stringify(r.verify?.json ?? r.start?.json));

  r = await start("9100061000", { host: A });
  check("college host: super admin refused (uses platform host)", r.status === 404, JSON.stringify(r.json));

  r = await login("9100061401", { host: B });
  const picked = r.verify?.setCookie?.some((c) => c.startsWith("lms_membership=") && !c.startsWith("lms_membership=;"));
  check("host B: shared faculty signs in and membership is fixed", r.verify?.status === 200 && picked, JSON.stringify(r.verify?.json));

  const s = await start("9100061103", { host: A });
  const onB = await call("POST", "/api/auth/login/verify", { host: B, body: { attemptId: s.json.attemptId, code: CODE, secondCode: CODE } });
  check("challenge from host A rejected on host B (WRONG_TENANT)", onB.status === 403 && onB.json?.error === "WRONG_TENANT", JSON.stringify(onB.json));
  const onP = await call("POST", "/api/auth/login/verify", { body: { attemptId: s.json.attemptId, code: CODE, secondCode: CODE } });
  check("challenge from host A rejected on platform host", onP.status === 403, String(onP.status));
}

// 7 hardening on the real edge
{
  const r = await call("POST", "/api/auth/login/start", { origin: "https://evil.example.com", body: { channel: "PHONE", contact: "9100061101" } });
  check("cross-origin POST rejected (403)", r.status === 403, String(r.status));

  const spoof = [];
  await sleep(PACE_MS);
  for (let i = 0; i < 12; i++) {
    const req = await new Promise((resolve, reject) => {
      const q = https.request({ hostname: PLATFORM, port: 443, path: "/api/auth/login/start", method: "POST", headers: { Origin: `https://${PLATFORM}`, "Content-Type": "application/json", "X-Forwarded-For": `203.0.113.${i + 1}` } }, (res) => { res.resume(); res.on("end", () => resolve(res.statusCode)); });
      q.on("error", reject); q.write(JSON.stringify({ channel: "PHONE", contact: "9999999990" })); q.end();
    });
    spoof.push(req);
  }
  check("spoofed X-Forwarded-For cannot dodge the IP throttle (a 429 appears)", spoof.includes(429), spoof.join(","));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
