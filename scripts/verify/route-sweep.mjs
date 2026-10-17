// Local route smoke sweep. Signs in as every role through the scripted local
// OTP flow, requests the pages each role's sidebar exposes (and, with --all,
// every static page of the role's own portal plus resolvable dynamic ones), and
// checks that every other portal refuses the role.
//
//   node scripts/verify/route-sweep.mjs --start <dir> [--all] [--report out.md]
//   node scripts/verify/route-sweep.mjs --base http://localhost:3100 [--all]
//
// Options
//   --base <url>      server to test (default http://localhost:3100). localhost only.
//   --start <dir>     spawn `next dev -p <port>` from <dir> (a copy of the repo when a
//                     dev server already runs in the project dir) with DATABASE_URL
//                     forced to TEST_DATABASE_URL from .env.local; its log is scanned
//                     for server errors per request; it is stopped at the end.
//   --server-log <f>  scan this log file for server errors when not using --start.
//   --all             also request every static page in the role's own portal and
//                     dynamic pages whose ids resolve from the test database.
//   --roles a,b       limit roles. --no-deny skips the denial checks.
//   --mobile          (needs playwright) 375px screenshot overflow check per nav route.
//   --report <file>   markdown report (default os.tmpdir()/route-sweep.md).
//
// LOCAL ONLY: refuses non-local base URLs and non-127.0.0.1/localhost databases.
// Needs the seeded test tenants (scripts/seed-test-tenants.ts) and APP_ENV=development.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..", "..");
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d;
};

const START = opt("start", flag("start") ? repo : null);
const BASE = new URL(opt("base", process.env.BASE_URL ?? "http://localhost:3100"));
const REPORT = opt("report", path.join(os.tmpdir(), "route-sweep.md"));
const ALL = flag("all");
const MOBILE = flag("mobile");
const DENY = !flag("no-deny");
const CODE = process.env.TEST_CODE ?? "135790";
const TIMEOUT = Number(process.env.SWEEP_TIMEOUT_MS ?? 180000);
const isLocal = (h) => ["localhost", "127.0.0.1", "[::1]"].includes(h);
if (!isLocal(BASE.hostname)) {
  console.error(`refusing non-local base URL ${BASE.origin}`);
  process.exit(2);
}

// ---------- env (never printed) ----------
function readEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const l of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}
const envFile = readEnv(path.join(repo, ".env.local"));
const testDb = process.env.TEST_DATABASE_URL ?? envFile.TEST_DATABASE_URL;
function assertLocalDb(url) {
  const u = new URL(url);
  if (!["127.0.0.1", "localhost"].includes(u.hostname) || u.port !== "54329" || !/test/.test(u.pathname)) {
    throw new Error("TEST_DATABASE_URL must be the disposable local test database (127.0.0.1:54329, *test*)");
  }
}

// ---------- routes ----------
function walkPages(dir, base = "") {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      const seg = /^\(.*\)$/.test(e.name) ? "" : "/" + e.name;
      if (e.name.startsWith("@") || e.name.startsWith("_")) continue;
      out.push(...walkPages(path.join(dir, e.name), base + seg));
    } else if (/^page\.(tsx|ts|jsx|js)$/.test(e.name)) out.push(base || "/");
  }
  return out;
}
const allRoutes = walkPages(path.join(repo, "src/app/(authenticated)")).sort();
const staticRoutes = allRoutes.filter((r) => !r.includes("["));
const dynamicRoutes = allRoutes.filter((r) => r.includes("["));

// Nav config straight from the shell model.
const shellSrc = fs.readFileSync(path.join(repo, "src/components/shell/shell-model.ts"), "utf8");
function navHrefs(constName) {
  const m = new RegExp(`const ${constName}: ShellNavItem\\[\\] = \\[([\\s\\S]*?)\\n\\];`).exec(shellSrc);
  if (!m) throw new Error(`nav array ${constName} not found in shell-model.ts`);
  return [...m[1].matchAll(/href:\s*"([^"]+)"/g)].map((x) => x[1]);
}
const dash = ["/dashboard"];
const ROLES = {
  learner: { phone: "9100061101", nav: navHrefs("learnerItems"), own: ["/learn"] },
  faculty: { phone: "9100061102", nav: navHrefs("facultyItems"), own: ["/teacher", "/teach"] },
  mentor: { phone: "9100061103", nav: navHrefs("mentorItems"), own: ["/mentor"] },
  collegeAdmin: { phone: "9100061104", nav: [...dash, ...navHrefs("collegeAdminItems")], own: ["/college", "/college-admin"] },
  tpo: { phone: "9100061105", nav: [...dash, ...navHrefs("tpoItems")], own: ["/tpo"] },
  hr: { phone: "9100061301", nav: [...dash, ...navHrefs("recruiterItems")], own: ["/hr"] },
  superAdmin: { phone: "9100061000", nav: navHrefs("superAdminItems"), own: ["/admin", "/activity"], sees: "all" },
};
const PORTALS = ["/admin", "/college", "/college-admin", "/tpo", "/hr", "/teacher", "/teach", "/mentor", "/learn"];
const inPrefix = (r, p) => r === p || r.startsWith(p + "/");
const portalOf = (r) => PORTALS.find((p) => inPrefix(r, p));
// Pages another role may legitimately open (documented exceptions, not leaks).
const ALLOWED_CROSS = { learner: [/^\/tpo\/drive-day/] };
const wantRoles = (opt("roles", "") || Object.keys(ROLES).join(",")).split(",");

// ---------- dynamic id resolver ----------
const PARAM_TABLES = {
  deliveryId: "course_section_deliveries",
  projectId: "project_instances",
  jobId: "placement_jobs",
  applicationId: "placement_applications",
  collegeId: "colleges",
  companyId: "placement_companies",
  leadId: "placement_tpo_leads",
  templateId: "project_templates",
  membershipId: "college_memberships",
};
async function resolveIds() {
  const ids = {};
  if (!testDb) return ids;
  try {
    assertLocalDb(testDb);
    const pg = (await import("pg")).default;
    const c = new pg.Client({ connectionString: testDb });
    await c.connect();
    for (const [k, t] of Object.entries(PARAM_TABLES)) {
      try {
        const r = await c.query(`select id from ${t} order by id limit 1`);
        if (r.rows[0]) ids[k] = r.rows[0].id;
      } catch { /* table/column absent: leave unresolved */ }
    }
    await c.end();
  } catch (e) {
    console.warn("id resolver unavailable:", e.message);
  }
  return ids;
}
function fill(route, ids) {
  let ok = true;
  const out = route.replace(/\[(?:\.\.\.)?([A-Za-z]+)\]/g, (_, k) => {
    if (ids[k]) return ids[k];
    ok = false;
    return "";
  });
  return ok ? out : null;
}

// ---------- server ----------
let serverProc = null;
let serverLog = "";
let logFile = opt("server-log", null);
async function startServer() {
  if (!testDb) throw new Error("TEST_DATABASE_URL missing from .env.local");
  assertLocalDb(testDb);
  const dir = path.resolve(START);
  // a copied tree uses a node_modules junction, which Turbopack rejects: use webpack there
  const env = { ...process.env, ...envFile, DATABASE_URL: testDb, PORT: BASE.port, NEXT_TELEMETRY_DISABLED: "1" };
  for (const k of ["DB_USER", "DB_PASSWORD", "DB_NAME", "INSTANCE_UNIX_SOCKET"]) delete env[k];
  const bin = path.join(dir, "node_modules", "next", "dist", "bin", "next");
  serverProc = spawn(process.execPath, [bin, "dev", ...(dir === repo ? [] : ["--webpack"]), "-p", BASE.port || "3100"], { cwd: dir, env, stdio: ["ignore", "pipe", "pipe"] });
  const add = (b) => { serverLog += b.toString(); };
  serverProc.stdout.on("data", add);
  serverProc.stderr.on("data", add);
  for (let i = 0; i < 120; i++) {
    if (/Ready in|ready - started/i.test(serverLog)) return;
    if (serverProc.exitCode !== null) throw new Error("next dev exited early:\n" + serverLog.slice(-1500));
    await sleep(1000);
  }
  throw new Error("next dev did not become ready");
}
function stopServer() {
  if (!serverProc) return;
  try {
    if (process.platform === "win32") spawn("taskkill", ["/pid", String(serverProc.pid), "/T", "/F"], { stdio: "ignore" });
    else serverProc.kill("SIGTERM");
  } catch { /* already gone */ }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function logLength() {
  if (serverProc) return serverLog.length;
  if (logFile && fs.existsSync(logFile)) return fs.statSync(logFile).size;
  return 0;
}
function logSince(n) {
  if (serverProc) return serverLog.slice(n);
  if (logFile && fs.existsSync(logFile)) return fs.readFileSync(logFile, "utf8").slice(n);
  return "";
}
const SERVER_ERR = /(⨯|Unhandled|unhandledRejection|uncaughtException|Error: |ECONNREFUSED|Module not found|Failed to compile| 500 in )/;

// ---------- http ----------
let ipc = 1;
async function http(method, p, { cookie, body, manual = true } = {}) {
  const headers = {
    Origin: BASE.origin,
    "X-Forwarded-For": `10.77.${Math.floor(ipc / 250)}.${(ipc++ % 250) + 1}`,
  };
  if (body) headers["Content-Type"] = "application/json";
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(new URL(p, BASE), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: manual ? "manual" : "follow",
    signal: AbortSignal.timeout(TIMEOUT),
  });
  const text = await res.text();
  return {
    status: res.status,
    location: res.headers.get("location"),
    setCookie: res.headers.getSetCookie?.() ?? [],
    text,
  };
}
async function login(phone) {
  const s = await http("POST", "/api/auth/login/start", { body: { channel: "PHONE", contact: phone } });
  if (s.status !== 200) throw new Error(`login/start ${s.status}`);
  const attemptId = JSON.parse(s.text).attemptId;
  const v = await http("POST", "/api/auth/login/verify", { body: { attemptId, code: CODE, secondCode: CODE } });
  if (v.status !== 200) throw new Error(`login/verify ${v.status}`);
  return v.setCookie.map((c) => c.split(";")[0]).filter((c) => !c.endsWith("=")).join("; ");
}

// ---------- assertions ----------
const strip = (s) => s.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
const BAD_TEXT = [
  [/Something went wrong/i, "error boundary: Something went wrong"],
  [/workspace could not be loaded/i, "error boundary: workspace could not be loaded"],
  [/Application error: a (server|client)-side exception/i, "Next application error"],
  [/Unhandled Runtime Error/i, "Next runtime error overlay"],
  [/Internal Server Error/i, "Internal Server Error"],
  [/Page Not Found|This page could not be found/i, "rendered the 404 page"],
];
const DENIED_TEXT = /(access denied|not authori[sz]ed|forbidden|do(?:es)?n.t have (?:access|permission)|not allowed|no access|permission)/i;
function snippet(t) {
  const s = strip(t);
  return s.slice(0, 160);
}
async function follow(p, cookie) {
  let cur = p, hops = 0, r;
  const chain = [];
  for (;;) {
    r = await http("GET", cur, { cookie });
    if (r.status >= 300 && r.status < 400 && r.location && hops < 6) {
      chain.push(r.status);
      cur = new URL(r.location, BASE).pathname + new URL(r.location, BASE).search;
      hops++;
      continue;
    }
    return { ...r, finalPath: cur, redirected: hops > 0 };
  }
}

const failures = [];
const security = [];
const warnings = [];
let checked = 0;
const perRole = {};

async function checkAllowed(role, cookie, route, urlPath) {
  const before = logLength();
  let r;
  try {
    r = await follow(urlPath, cookie);
  } catch (e) {
    failures.push({ role, route, error: "request failed: " + e.message, snippet: "" });
    return;
  }
  await sleep(40);
  const errs = logSince(before).split("\n").filter((l) => SERVER_ERR.test(l) && !/^\s*GET .* 200 in/.test(l));
  checked++;
  perRole[role].checked++;
  const bad = (error, sn = snippet(r.text)) => {
    failures.push({ role, route: urlPath, error, snippet: sn });
    perRole[role].failed++;
  };
  const before2 = failures.length;
  if (r.finalPath.startsWith("/login")) return bad(`bounced to ${r.finalPath}`, "session rejected");
  if (r.status !== 200) return bad(`HTTP ${r.status}`);
  for (const [re, label] of BAD_TEXT) if (re.test(strip(r.text))) bad(label);
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(r.text);
  if (!h1 || !strip(h1[1])) bad("no non-empty <h1>");
  if (errs.length) bad("server log error", errs.slice(0, 2).join(" | ").slice(0, 240));
  if (failures.length === before2 && r.redirected) warnings.push(`${role} ${urlPath} redirected to ${r.finalPath}`);
}

async function checkDenied(role, cookie, route) {
  let r;
  try {
    r = await http("GET", route, { cookie });
  } catch (e) {
    warnings.push(`${role} ${route} deny request failed: ${e.message}`);
    return;
  }
  checked++;
  perRole[role].denyChecked++;
  if (r.status === 200) {
    const text = strip(r.text);
    const body = strip((/<main[\s\S]*<\/main>/i.exec(r.text) ?? [r.text])[0]);
    if (DENIED_TEXT.test(body) && body.length < 600) return; // a styled "no access" page, not a leak
    if (/Page Not Found/i.test(text)) return;
    security.push({ role, route, error: "HTTP 200 for a route this role must not open", snippet: snippet(r.text) });
    perRole[role].security++;
  }
}

// ---------- mobile (optional) ----------
let pw = null;
if (MOBILE) {
  try {
    pw = await import("@playwright/test");
  } catch {
    console.warn("--mobile requested but playwright is not installed; skipping");
  }
}

// ---------- main ----------
const t0 = Date.now();
let exitCode = 0;
try {
  if (START) {
    console.log(`starting next dev on ${BASE.origin} from ${START}`);
    await startServer();
  }
  const ids = await resolveIds();
  const unresolved = new Set();
  const ownPlan = (role) => {
    const def = ROLES[role];
    const routes = new Set(def.nav.filter((h) => allRoutes.includes(h) || staticRoutes.includes(h)));
    for (const h of def.nav) if (!staticRoutes.includes(h)) warnings.push(`${role}: nav href ${h} has no static page`);
    if (ALL) {
      for (const r of staticRoutes) if (def.own.some((p) => inPrefix(r, p))) routes.add(r);
      for (const r of dynamicRoutes) {
        if (!def.own.some((p) => inPrefix(r, p))) continue;
        const f = fill(r, ids);
        if (f) routes.add(f);
        else unresolved.add(r);
      }
    }
    return [...routes];
  };

  for (const role of wantRoles) {
    const def = ROLES[role];
    if (!def) { console.warn(`unknown role ${role}`); continue; }
    perRole[role] = { checked: 0, failed: 0, denyChecked: 0, security: 0 };
    let cookie;
    try {
      cookie = await login(def.phone);
    } catch (e) {
      failures.push({ role, route: "(login)", error: e.message + (e.cause ? ` (${e.cause.code ?? e.cause.message})` : ""), snippet: "" });
      perRole[role].failed++;
      continue;
    }
    const plan = ownPlan(role);
    console.log(`[${role}] ${plan.length} pages`);
    for (const urlPath of plan) {
      await checkAllowed(role, cookie, urlPath, urlPath);
      process.stdout.write(".");
    }
    process.stdout.write("\n");

    if (DENY && def.sees !== "all") {
      const deny = staticRoutes.filter((r) => {
        const p = portalOf(r);
        if (!p || def.own.includes(p)) return false;
        if ((ALLOWED_CROSS[role] ?? []).some((re) => re.test(r))) return false;
        return true;
      });
      console.log(`[${role}] ${deny.length} denial checks`);
      for (const r of deny) await checkDenied(role, cookie, r);
    }

    if (pw) {
      const browser = await pw.chromium.launch();
      const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
      await ctx.addCookies(cookie.split("; ").map((c) => ({ name: c.split("=")[0], value: c.slice(c.indexOf("=") + 1), url: BASE.origin })));
      const page = await ctx.newPage();
      for (const urlPath of def.nav.filter((h) => staticRoutes.includes(h))) {
        try {
          await page.goto(new URL(urlPath, BASE).href, { waitUntil: "load", timeout: 60000 });
          const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
          if (o.sw > o.iw) failures.push({ role, route: urlPath, error: `mobile overflow scrollWidth ${o.sw} > ${o.iw}`, snippet: "" });
        } catch (e) {
          warnings.push(`${role} ${urlPath} mobile check failed: ${e.message.split("\n")[0]}`);
        }
      }
      await browser.close();
    }
  }

  // ---------- report ----------
  const md = [];
  md.push(`# Route sweep ${new Date().toISOString()}`);
  md.push("");
  md.push(`Base ${BASE.origin}; mode ${ALL ? "all own-portal + dynamic" : "nav only"}; ${Math.round((Date.now() - t0) / 1000)}s.`);
  md.push(`Static pages found: ${staticRoutes.length}; dynamic: ${dynamicRoutes.length}; resolved ids: ${Object.keys(ids).join(", ") || "none"}.`);
  md.push(`Checks: ${checked}; failures: ${failures.length}; SECURITY findings: ${security.length}.`);
  md.push("");
  md.push("| role | allowed-page checks | failed | denial checks | security |");
  md.push("| --- | --- | --- | --- | --- |");
  for (const [r, s] of Object.entries(perRole)) md.push(`| ${r} | ${s.checked} | ${s.failed} | ${s.denyChecked} | ${s.security} |`);
  const table = (title, rows) => {
    md.push("", `## ${title} (${rows.length})`, "");
    if (!rows.length) return md.push("none");
    md.push("| role | route | error | snippet |", "| --- | --- | --- | --- |");
    for (const f of rows) md.push(`| ${f.role} | \`${f.route}\` | ${f.error.replace(/\|/g, "/")} | ${f.snippet.replace(/\|/g, "/").replace(/\n/g, " ")} |`);
  };
  table("SECURITY findings", security);
  table("Failures", failures);
  if (unresolved.size) md.push("", `## Dynamic routes skipped, no id resolved (${unresolved.size})`, "", ...[...unresolved].map((u) => `- \`${u}\``));
  if (warnings.length) md.push("", `## Notes (${warnings.length})`, "", ...[...new Set(warnings)].map((w) => `- ${w}`));
  fs.writeFileSync(REPORT, md.join("\n") + "\n");
  console.log(`\nchecks ${checked}, failures ${failures.length}, SECURITY ${security.length}. report: ${REPORT}`);
  exitCode = failures.length || security.length ? 1 : 0;
} catch (e) {
  console.error("sweep aborted:", e.message);
  exitCode = 2;
} finally {
  stopServer();
}
process.exit(exitCode);
