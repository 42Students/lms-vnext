#!/usr/bin/env node
// Partitions every open phase 2 audit gap into work packages (WPs) and per-lane queues.
// Plain Node, no dependencies, safe to re-run as Round R reviews arrive.
//
//   node scripts/audit/build-gap-register.mjs     (regenerate the register first)
//   node scripts/audit/build-work-packages.mjs
//
// Inputs : docs/audit/gap-register.md, docs/audit/pages/**, docs/audit/owner-decisions.md,
//          docs/audit/legacy-copy-A.md / -B.md, the repo file list (git ls-files).
// Outputs: docs/audit/work-packages/<lane>/<WP-id>.md, docs/audit/work-packages/README.md,
//          docs/orchestrator/queues/<queue>.md
//
// Re-run rule: a WP whose queue status is not TODO is FROZEN (its gap set is read back from its
// own WP file and kept); every other open gap is re-partitioned into fresh WPs numbered after the
// highest existing number of that queue. Queue statuses are preserved.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const rel = (...p) => path.join(root, ...p);
const wpDir = rel("docs", "audit", "work-packages");
const qDir = rel("docs", "orchestrator", "queues");
const LANES = ["chat-2", "chat-3", "chat-4", "chat-5", "chat-6", "chat-7", "chat-9", "chat-11"];
const LANE_TITLE = {
  "chat-2": "TPO recruiter side (Engage, companies, campaigns, inbox/messages/team/announcements, public join/unsubscribe/placements pages)",
  "chat-3": "College Admin (dashboard, academic setup, courses and content, people, attendance, placements view, verification, activity log, profile)",
  "chat-4": "Faculty, course tabs, attendance authoring and grading, learner course experience (assignments, quizzes, video playback)",
  "chat-5": "TPO placements core (batches, drives, drive workspace, students, requests) and learner-side placements (registration, apply, offers)",
  "chat-6": "Super Admin academics-people and placements, public/auth/login/session/error pages, auth-facing UI (UI only)",
  "chat-7": "Recruiter account (/recruiter, /hr) and Learner account except placements, projects and course experience",
  "chat-9": "TPO admin (home, settings, audit, calendar-reports, verification access), Super Admin tenants-modules, shell/sidebar/topbar/page titles/account menu",
  "chat-11": "Mentor, Learner projects, College Admin projects, Super Admin projects/templates/tracker, src/modules/projects",
};
const SEVS = ["S1", "S2", "S3", "S4"];
const MIN_WP = 15, MAX_WP = 25, TARGET = 20, CLAUDE_MAX = 25;
const SENSITIVE_OD = new Set(["OD-07", "OD-09", "OD-22", "OD-23", "OD-27", "OD-35"]);

// ---------------------------------------------------------------- helpers
const read = (f) => fs.readFileSync(f, "utf8");
const lines = (f) => read(f).split(/\r?\n/);
const clean = (t) => (t || "").replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
const cut = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "..." : s);
const pad = (n) => String(n).padStart(2, "0");
const gapNum = (id) => { const m = /(R?)(\d+)[a-z]?$/.exec(id); return m ? (m[1] ? 1000 : 0) + Number(m[2]) : 0; };
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|") && !s.endsWith("\\|")) s = s.slice(0, -1);
  const cells = []; let cur = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\\" && s[i + 1] === "|") { cur += "|"; i++; continue; }
    if (s[i] === "|") { cells.push(cur.trim()); cur = ""; continue; }
    cur += s[i];
  }
  cells.push(cur.trim());
  return cells;
}

// ---------------------------------------------------------------- 1. register
const regPath = rel("docs", "audit", "gap-register.md");
if (!fs.existsSync(regPath)) { console.error("docs/audit/gap-register.md missing: run build-gap-register.mjs first"); process.exit(1); }
const all = []; // every register row
for (const l of lines(regPath)) {
  if (!l.startsWith("| ")) continue;
  const c = splitRow(l);
  if (c.length < 8 || !/^[A-Za-z]+(-[A-Za-z0-9]+)*-R?\d+[a-z]?$/.test(c[0])) continue;
  const status = c[c.length - 3];
  if (!/^(OPEN|UNCONFIRMED|CLOSED-SINCE|WRONG)$/.test(status)) continue;
  all.push({
    id: c[0], page: c[1], sev: clean(c[c.length - 4]).replace(/\*/g, ""), status,
    file: c[c.length - 1], account: c[c.length - 1].split("/")[0],
  });
}
const open = all.filter((g) => g.status === "OPEN" || g.status === "UNCONFIRMED");
console.log(`register rows ${all.length}; open or unconfirmed ${open.length}`);

// ---------------------------------------------------------------- 2. full rows from the audit files
const srcCache = new Map();
function srcLines(file) {
  if (!srcCache.has(file)) srcCache.set(file, lines(rel("docs", "audit", "pages", file)));
  return srcCache.get(file);
}
for (const g of all) {
  const L = srcLines(g.file);
  const prefix = "| " + g.id + " |";
  let found = null;
  for (let i = 0; i < L.length; i++) {
    const t = L[i].replace(/\*\*|`/g, "");
    if (!t.startsWith(prefix)) continue;
    const c = splitRow(L[i]);
    if (c.length >= 6) { found = { c, line: i + 1 }; break; }
  }
  if (!found) { g.text = ""; g.type = "OTHER"; g.legacy = ""; g.vnext = ""; g.line = 1; continue; }
  const c = found.c; const n = c.length;
  g.line = found.line;
  g.text = clean(c.slice(1, n - 4).join(" | "));
  const rawType = clean(c[n - 4]).replace(/`/g, "");
  g.type = (/^[A-Z][A-Z-]+/.exec(rawType) || ["OTHER"])[0];
  g.legacy = c[n - 2]; g.vnext = c[n - 1];
}

// ---------------------------------------------------------------- 3. repo file index
let repoFiles = [];
try { repoFiles = execSync("git ls-files src", { cwd: root, encoding: "utf8", maxBuffer: 1 << 26 }).split(/\r?\n/).filter(Boolean); } catch { /* none */ }
const byBase = new Map();
for (const f of repoFiles) { const b = f.split("/").pop(); if (!byBase.has(b)) byBase.set(b, []); byBase.get(b).push(f.replace(/^src\//, "")); }
const normFiles = repoFiles.map((f) => f.replace(/^src\//, ""));

function resolvePath(tok) {
  let q = tok.replace(/^[`'"(]+|[`'"),.;:]+$/g, "");
  q = q.replace(/:\d.*$/, "");
  if (/^V\//.test(q)) q = q.slice(2);
  if (/^A\//.test(q)) q = "app/(authenticated)/" + q.slice(2);
  q = q.replace(/^src\//, "");
  if (/^(app|modules|components|lib|db|auth|security|hooks|server|utils)\//.test(q)) return q;
  if (q.startsWith("(authenticated)/")) return "app/" + q;
  if (q.includes("/")) { const hit = normFiles.filter((f) => f.endsWith("/" + q)); if (hit.length === 1) return hit[0]; return null; }
  const hits = byBase.get(q);
  return hits && hits.length === 1 ? hits[0] : null;
}
function extractPaths(cell) {
  const out = new Set();
  const re = /[A-Za-z0-9_\-.()[\]@/]+\.(?:tsx?|mjs|sql|css)\b/g;
  for (const m of (cell || "").matchAll(re)) { const r = resolvePath(m[0]); if (r) out.add(r); }
  return [...out];
}

// ---------------------------------------------------------------- 4. ownership rules
const CLS_RANK = { shell: 0, route: 1, api: 2, component: 3, module: 4 };
function classifyPath(q) {
  const seg = q.split("/");
  const base = seg[seg.length - 1];
  const r = (cls, lane, area) => ({ cls, lane, area });
  if (/^components\/shell\//.test(q) || q === "app/(authenticated)/layout.tsx") return r("shell", "chat-9", "components/shell");
  if (q.startsWith("app/(authenticated)/")) {
    const top = seg[2] || "", sub = seg[3] || "", sub2 = seg[4] || "";
    const area = `app/(authenticated)/${top}${sub && !sub.startsWith("page.") && !sub.startsWith("layout.") ? "/" + sub : ""}`;
    if (top === "tpo") {
      if (/^(recruiters|companies|campaigns|messages|team|announcements|follow-ups|find)$/.test(sub)) return r("route", "chat-2", area);
      if (/^(batches|students|requests|drive-day|placements)$/.test(sub)) return r("route", "chat-5", area);
      return r("route", "chat-9", area);
    }
    if (top === "recruiter" || top === "hr") return r("route", "chat-7", area);
    if (top === "learn") {
      if (/^(placements|my-placements)$/.test(sub)) return r("route", "chat-5", area);
      if (sub === "projects") return r("route", "chat-11", area);
      if ((sub === "courses" && sub2.startsWith("[")) || /^(assignments|quizzes|allAssignments|allQuizzes)$/.test(sub)) return r("route", "chat-4", area);
      return r("route", "chat-7", area);
    }
    if (top === "teacher" || top === "teach") return r("route", "chat-4", area);
    if (top === "mentor" || top === "tracker") return r("route", "chat-11", area);
    if (top === "college") return r("route", sub === "projects" ? "chat-11" : "chat-3", area);
    if (top === "college-admin") return r("route", "chat-3", area);
    if (top === "admin") {
      if (/^(tenants|colleges|module-access|features|settings|inbound-mail|domains|audit|organizations)$/.test(sub)) return r("route", "chat-9", area);
      if (sub === "projects") return r("route", "chat-11", area);
      return r("route", "chat-6", area);
    }
    if (top === "superadmin") return r("route", "chat-6", area);
    if (top === "account") return r("route", "chat-6", area);
    return null; // dashboard, notifications, activity, error.tsx: shared, page slug decides
  }
  if (q.startsWith("app/api/")) {
    const a = seg[2] || "";
    const area = `app/api/${a}`;
    if (a === "public") return /recruit|join|unsub|placements/.test(q) ? r("api", "chat-2", area) : r("api", "chat-6", area);
    if (a === "projects" || a === "mentor" || a === "tracker") return r("api", "chat-11", area);
    if (a === "courses" || a === "attendance" || a === "learn") return r("api", "chat-4", area);
    if (a === "tenant-domains") return r("api", "chat-9", area);
    if (a === "tpo") {
      const s = seg[3] || "";
      if (/^(recruiters|companies|campaigns|messages|team|announcements)/.test(s)) return r("api", "chat-2", area);
      if (/^(batches|students|requests|drives)/.test(s)) return r("api", "chat-5", area);
      return r("api", "chat-9", area);
    }
    if (a === "placements") {
      if (/\/tpo\/(messages|recruiters|companies|campaigns|announcements)/.test(q)) return r("api", "chat-2", `${area}/tpo`);
      if (/\/hr\//.test(q)) return r("api", "chat-7", `${area}/hr`);
      if (/\/tpo\/(settings|audit|calendar|reports)/.test(q)) return r("api", "chat-9", `${area}/tpo`);
      return r("api", "chat-5", area);
    }
    return null;
  }
  if (q.startsWith("app/")) {
    const a = seg[1] || "";
    if (/^(placements|college-join|company-join|campaign-unsubscribe|company-share)$/.test(a)) return r("route", "chat-2", `app/${a}`);
    if (a === "quiz") return r("route", "chat-4", `app/${a}`);
    return r("route", "chat-6", `app/${a.replace(/\..*$/, "") || "root"}`);
  }
  if (q.startsWith("components/")) {
    const d = seg[1] || "";
    const area = `components/${d}`;
    if (d === "tpo") {
      if (/recruiter|compan|campaign|message|announce|team/.test(base)) return r("component", "chat-2", area);
      if (/batch|student|request|drive/.test(base)) return r("component", "chat-5", area);
      return r("component", "chat-9", area);
    }
    if (d === "placements") {
      if (/^public-recruit|^public-recruiter|^tpo-recruiter|^tpo-company|^placement-employer|^placement-recruiter-access|^tpo-trust/.test(base)) return r("component", "chat-2", area);
      if (/^(hr-|recruiter-)/.test(base)) return r("component", "chat-7", area);
      if (/^college-/.test(base)) return r("component", "chat-3", area);
      if (/^(tpo-settings-nav|tpo-college-rules|tpo-season|placement-season|placement-report|placement-calendar|tpo-calendar|tpo-report|tpo-mark-own-notification)/.test(base)) return r("component", "chat-9", area);
      return r("component", "chat-5", area);
    }
    if (d === "hr") return r("component", "chat-7", area);
    if (d === "projects" || d === "tracker") return r("component", "chat-11", area);
    if (d === "courses" || d === "attendance") return r("component", "chat-4", area);
    if (d === "college" || d === "colleges") return r("component", "chat-3", area);
    if (d === "auth" || d === "public") return r("component", "chat-6", area);
    if (d === "admin") {
      if (/^(college-(archive|branding|create|edit|dashboard|feature|setup)|tenant-|inbound-mail|organization|admin-dashboard)/.test(base)) return r("component", "chat-9", area);
      return r("component", "chat-6", area);
    }
    return null; // profile, people, ui, dashboard, announcements, activity, verification, groups, academics, electives: shared
  }
  if (q.startsWith("modules/")) {
    const d = seg[1] || "";
    const area = `modules/${d}`;
    if (d === "projects" || d === "bug-tracker") return r("module", "chat-11", area);
    if (d === "courses" || d === "attendance") return r("module", "chat-4", area);
    if (/^(colleges|tenant-domains|module-access|organizations|platform-settings|inbound-mail)$/.test(d)) return r("module", "chat-9", area);
    if (d === "placements") {
      const sub = seg.length > 3 ? seg[2] : "";
      const a2 = sub ? `${area}/${sub}` : area;
      if (sub === "public-enquiry" || sub === "company-share" || sub === "join") return r("module", "chat-2", a2);
      if (sub === "public-page") return r("module", "chat-9", a2);
      if (/^hr-/.test(base)) return r("module", "chat-7", area);
      if (/^(company|tpo-company|tpo-recruiter|tpo-messaging|tpo-message|campaign|join|recruiter|inbound)/.test(base)) return r("module", "chat-2", area);
      if (/^college-/.test(base)) return r("module", "chat-3", area);
      if (/^(settings|tpo-settings|audit|report|calendar|season|tpo-home|tpo-calendar|tpo-report|placement-season|tpo-college)/.test(base)) return r("module", "chat-9", area);
      return r("module", "chat-5", area);
    }
    return null; // identity, people, academics, ..., auth/permissions are protected or shared
  }
  return null;
}

function slugLane(g) {
  const a = g.account, p = g.page;
  if (a === "tpo") {
    if (/^(recruiters|companies|campaigns|inbox-team)/.test(p)) return ["chat-2", "tpo/" + p];
    if (/^(drives|drive-workspace|batches|students|requests-verification)/.test(p)) return ["chat-5", "tpo/" + p];
    return ["chat-9", "tpo/" + p];
  }
  if (a === "recruiter") return ["chat-7", "recruiter/" + p];
  if (a === "learner") {
    if (p === "placements") return ["chat-5", "learner/placements"];
    if (p === "projects") return ["chat-11", "learner/projects"];
    if (p === "course-detail") return ["chat-4", "learner/course-detail"];
    return ["chat-7", "learner/" + p];
  }
  if (a === "faculty") return ["chat-4", "faculty/" + p];
  if (a === "mentor") return ["chat-11", "mentor/" + p];
  if (a === "college") {
    if (p === "course-tabs") return ["chat-4", "college/course-tabs"];
    if (p === "projects") return ["chat-11", "college/projects"];
    return ["chat-3", "college/" + p];
  }
  if (a === "superadmin") {
    if (/^tenants-modules/.test(p)) return ["chat-9", "superadmin/" + p];
    if (/^placements-projects-(b|c)/.test(p)) return ["chat-11", "superadmin/" + p];
    return ["chat-6", "superadmin/" + p];
  }
  if (a === "public") {
    if (/\b(join|unsubscribe|share|public placements|recruit)/i.test(g.text) || /links-marketing/.test(p) && /link|join|unsub|share|placements/i.test(g.text)) return ["chat-2", "public/" + p];
    return ["chat-6", "public/" + p];
  }
  return ["chat-6", `${a}/${p}`];
}

// classify every open gap
const pathStats = new Map(); // normalized file -> count (for "files to touch")
for (const g of open) {
  g.paths = extractPaths(g.vnext);
  const cands = g.paths.map((p) => ({ p, c: classifyPath(p) })).filter((x) => x.c);
  const [sl, sarea] = slugLane(g);
  g.slugLane = sl;
  if (cands.length) {
    const best = Math.min(...cands.map((x) => CLS_RANK[x.c.cls]));
    const top = cands.filter((x) => CLS_RANK[x.c.cls] === best);
    const votes = {};
    for (const x of top) votes[x.c.lane] = (votes[x.c.lane] || 0) + 1;
    // tie-break: lane equal to the page-slug lane, else first listed
    const maxv = Math.max(...Object.values(votes));
    const winners = Object.keys(votes).filter((k) => votes[k] === maxv);
    g.lane = winners.includes(sl) ? sl : winners[0];
    g.area = top.find((x) => x.c.lane === g.lane).c.area;
    g.areaSource = "path";
  } else { g.lane = sl; g.area = sarea; g.areaSource = "page"; }
  for (const p of g.paths) pathStats.set(p, (pathStats.get(p) || 0) + 1);
}

// ---------------------------------------------------------------- 5. owner decisions
const odText = lines(rel("docs", "audit", "owner-decisions.md"));
const ODS = []; // {id, question, recommendation, ids:Set}
const idRe = /\b([A-Z]{2,}(?:-[A-Za-z0-9]+)*?-R?\d+)\b/g;
for (const l of odText) {
  if (!/^\| OD-\d+ /.test(l)) continue;
  const c = splitRow(l);
  const src = c[c.length - 1];
  const ids = new Set();
  // full IDs, then shorthand continuations such as "-06" or "to -67"
  let lastPrefix = null, lastNum = null;
  const tokRe = /([A-Z]{2,}(?:-[A-Za-z0-9]+)*?)-(R?\d+)\b|(?:,|and|to)\s*-(\d+)\b|\b(R\d+)\b\s*$|;\s*(?:[\w/.-]+\.md )?(R\d+)\b/g;
  for (const m of src.matchAll(tokRe)) {
    if (m[1]) { lastPrefix = m[1]; lastNum = m[2]; ids.add(`${m[1]}-${m[2]}`); }
    else if (m[3] && lastPrefix) {
      const to = Number(m[3]);
      if (/\bto\s*-/.test(m[0]) && lastNum && /^\d+$/.test(lastNum)) for (let k = Number(lastNum) + 1; k <= to; k++) ids.add(`${lastPrefix}-${String(k).padStart(lastNum.length, "0")}`);
      else ids.add(`${lastPrefix}-${String(to).padStart(lastNum.length, "0")}`);
    }
  }
  // "<file>.md R0x": prefix from the gaps of that audit file
  for (const m of src.matchAll(/([a-z-]+)\/([a-z0-9-]+?)-review\.md\s+(R\d+)/g)) {
    const hit = all.find((g) => g.file === `${m[1]}/${m[2]}.md`);
    if (hit) ids.add(hit.id.replace(/-R?\d+[a-z]?$/, "") + "-" + m[3]);
  }
  ODS.push({ id: c[0], question: clean(c[1]), options: clean(c[2]), rec: clean(c[3]), src: clean(src), ids, sensitive: SENSITIVE_OD.has(c[0]) });
}
const idToOd = new Map();
for (const od of ODS) for (const id of od.ids) { if (!idToOd.has(id)) idToOd.set(id, []); idToOd.get(id).push(od); }
for (const g of open) {
  g.ods = idToOd.get(g.id) || [];
  g.skipPending = g.ods.some((o) => o.sensitive);
  g.ownerNote = g.ods.length === 0 && /needs? (an )?owner decision|owner decision/i.test(g.text) ? "text says it needs an owner decision (no OD row yet)" : "";
}

// ---------------------------------------------------------------- 6. buckets
const SCHEMA_RE = /\b(new (table|column)|no (table|column)|migration|schema|not stored|stores? no|never stored|no (such )?(field|column) in the (db|database)|persist)/i;
const SNAKE_RE = /`([a-z]+(?:_[a-z0-9]+){1,})`/g;
function schemaHint(g) {
  const txt = `${g.text} ${g.vnext}`;
  if (!SCHEMA_RE.test(txt)) return null;
  const ids = [...new Set([...txt.matchAll(SNAKE_RE)].map((m) => m[1]).filter((s) => !/^[A-Z_]+$/.test(s) && !/_READY$/.test(s)))];
  return ids.slice(0, 6);
}
const GATE_RE = /(DB\d+_[A-Z_]+_READY|[A-Z_]{4,}_READY\b|\bgated by\b|\bgate\b|fail(s)? closed|returns? 503)/;
const ERR_RE = /(raw (error )?codes?|raw error|error codes? (are )?(shown|leak)|\b[A-Z]{3,}(?:_[A-Z0-9]+){1,}\b.*\bshown\b|jargon|developer (wording|message|language|text)|developer\/status|build jargon|migration[- ]dependent|is pending database|awaiting database verification|internal (developer|build))/i;
for (const g of open) {
  g.schema = schemaHint(g); // null or array (maybe empty)
  if (GATE_RE.test(g.text) && /(STATE|PERMISSION|VALIDATION)/.test(g.type) && /(READY|503|fail(s)?[- ]closed|unset|not set|not ready|not registered)/i.test(g.text)) g.bucket = "xc-gates";
  else if (ERR_RE.test(g.text)) g.bucket = "xc-wording";
  else if (g.type === "COPY" || /^COPY/.test(g.type)) g.bucket = "wording";
  else if (/^(VALIDATION|STATE|A11Y|RESPONSIVE)$/.test(g.type) && g.schema === null && !g.skipPending && !g.ownerNote && g.text.length <= 450 && !/\b(email|e-mail|notif|sms|send|deliver|digest|audit|cron|export|import|csv)\b/i.test(g.text) && g.status === "OPEN") g.bucket = "small";
  else g.bucket = "lane";
}

// ---------------------------------------------------------------- 7. chunking
const sevIdx = (s) => SEVS.indexOf(s) < 0 ? 9 : SEVS.indexOf(s);
function orderGaps(list) {
  return [...list].sort((a, b) => sevIdx(a.sev) - sevIdx(b.sev) || (a.account + a.page).localeCompare(b.account + b.page) || gapNum(a.id) - gapNum(b.id));
}
function chunk(list, max = MAX_WP, min = MIN_WP, target = TARGET) {
  const sorted = orderGaps(list);
  // clusters: consecutive same tier + same account/page
  const clusters = [];
  for (const g of sorted) {
    const key = g.sev + "|" + g.account + "/" + g.page;
    const last = clusters[clusters.length - 1];
    if (last && last.key === key) last.items.push(g); else clusters.push({ key, items: [g] });
  }
  const chunks = []; let cur = [];
  for (const cl of clusters) {
    let items = cl.items.slice();
    while (items.length) {
      const room = max - cur.length;
      if (items.length <= room) { cur.push(...items); items = []; if (cur.length >= target) { chunks.push(cur); cur = []; } }
      else if (cur.length >= min) { chunks.push(cur); cur = []; }
      else { const take = Math.max(1, target - cur.length); cur.push(...items.splice(0, take)); chunks.push(cur); cur = []; }
    }
  }
  if (cur.length) chunks.push(cur);
  // Rebalance so every chunk is within [min, max] whenever the total allows it.
  const total = chunks.reduce((a, c) => a + c.length, 0);
  if (chunks.length > 1 && total >= min * chunks.length) {
    for (let guard = 0; guard < 500; guard++) {
      const i = chunks.findIndex((c) => c.length < min);
      if (i < 0) break;
      // pull one item from the nearest earlier chunk with surplus, shifting along the chain (order is preserved)
      let j = i - 1;
      while (j >= 0 && chunks[j].length <= min) j--;
      if (j < 0) { // no earlier surplus: pull from later chunks instead
        let k = i + 1;
        while (k < chunks.length && chunks[k].length <= min) k++;
        if (k >= chunks.length) break;
        for (let x = k; x > i; x--) chunks[x - 1].push(chunks[x].shift());
        continue;
      }
      for (let x = j; x < i; x++) chunks[x + 1].unshift(chunks[x].pop());
    }
  } else if (chunks.length > 1 && chunks[chunks.length - 1].length < min) {
    const last = chunks.pop();
    if (chunks[chunks.length - 1].length + last.length <= max) chunks[chunks.length - 1].push(...last); else chunks.push(last);
  }
  return chunks;
}

// ---------------------------------------------------------------- 8. existing queue state (re-run safety)
const nnOf = (id) => Number((/^WP-(?:chat-\d+|wording-[a-z]+|small-[a-z]+|xc)-(\d{2})-/.exec(id) || [0, 0])[1]);
function readQueue(name) {
  const f = path.join(qDir, name + ".md");
  const out = [];
  if (!fs.existsSync(f)) return out;
  for (const l of lines(f)) {
    const m = /^\d+\.\s+(WP-\S+)\s+\|\s+(TODO|IN-PROGRESS|DONE|BLOCKED)\b(.*)$/.exec(l);
    if (m) out.push({ id: m[1], status: m[2], rest: m[3], line: l });
  }
  return out;
}
function frozenGapIds(dirName, wpId) {
  const f = path.join(wpDir, dirName, wpId + ".md");
  if (!fs.existsSync(f)) return null;
  return [...read(f).matchAll(/^- \*\*([A-Za-z0-9-]+)\*\*/gm)].map((m) => m[1]);
}

// ---------------------------------------------------------------- 9. build WP model
// queue descriptor: {name, dir, idPrefix(i), items}
const openById = new Map(open.map((g) => [g.id, g]));
const assigned = new Map(); // gap id -> wp id
const wps = []; // {id, queue, dir, gaps, frozen, status, title, lane}
const queues = {};

function sevMix(gs) { const m = {}; for (const g of gs) m[g.sev] = (m[g.sev] || 0) + 1; return SEVS.filter((s) => m[s]).map((s) => `${s} ${m[s]}`).join(", ") || "none"; }
function domSlug(gs, extra) {
  const cnt = {};
  const short = (pg) => pg.replace(/^auth-public-\d-/, "public-").replace(/^academics-people-\d-/, "academics-").replace(/^placements-projects-[a-c]-/, "").replace(/^tenants-modules(-\d)?$/, "tenants-modules");
  for (const g of gs) { const k = short(g.page); cnt[k] = (cnt[k] || 0) + 1; }
  const tops = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 2).map((x) => slugify(x[0]).slice(0, 22).replace(/-$/, ""));
  const mn = SEVS.find((s) => gs.some((g) => g.sev === s)) || "sx";
  return slugify(tops.join("-") + "-" + mn.toLowerCase() + (extra ? "-" + extra : "")).slice(0, 56);
}

function buildQueue(qname, dir, pool, mkId, opts = {}) {
  const prior = readQueue(qname);
  const items = [];
  let maxNn = 0;
  for (const p of prior) {
    if (p.status === "TODO") continue;
    maxNn = Math.max(maxNn, nnOf(p.id));
    const ids = frozenGapIds(dir, p.id);
    if (!ids) continue;
    const gs = ids.map((i) => openById.get(i)).filter(Boolean);
    const keep = ids; // closed gaps stay listed in the frozen file
    for (const i of ids) assigned.set(i, p.id);
    items.push({ id: p.id, queue: qname, dir, frozen: true, status: p.status, gapIds: keep, gaps: gs, line: p.line });
  }
  const frozenIds = new Set(items.flatMap((i) => i.gapIds));
  const rest = pool.filter((g) => !frozenIds.has(g.id));
  const chunks = chunk(rest, opts.max || MAX_WP, opts.min || MIN_WP, opts.target || TARGET);
  let nn = maxNn;
  for (const ch of chunks) {
    nn++;
    const id = mkId(nn, ch);
    for (const g of ch) assigned.set(g.id, id);
    items.push({ id, queue: qname, dir, frozen: false, status: "TODO", gapIds: ch.map((g) => g.id), gaps: ch });
  }
  queues[qname] = items;
  for (const i of items) wps.push(i);
}

for (const lane of LANES) {
  const pool = open.filter((g) => g.lane === lane && g.bucket === "lane");
  buildQueue(lane === "chat-11" ? "chat-11" : lane, lane, pool, (nn, ch) => `WP-${lane}-${pad(nn)}-${domSlug(ch)}`);
}
// Claude queues: per account groups, wording and small fixes
function claudeQueue(qname, bucket, tag) {
  const pool = open.filter((g) => g.bucket === bucket);
  const prior = readQueue(qname);
  const accounts = [...new Set(pool.map((g) => g.account))];
  // order accounts by their highest-priority tier then size
  const rank = (a) => Math.min(...pool.filter((g) => g.account === a).map((g) => sevIdx(g.sev)));
  accounts.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  // frozen first
  const items = []; let maxNn = 0;
  for (const p of prior) {
    if (p.status === "TODO") continue;
    maxNn = Math.max(maxNn, nnOf(p.id));
    const ids = frozenGapIds(qname, p.id); if (!ids) continue;
    for (const i of ids) assigned.set(i, p.id);
    items.push({ id: p.id, queue: qname, dir: qname, frozen: true, status: p.status, gapIds: ids, gaps: ids.map((i) => openById.get(i)).filter(Boolean), line: p.line });
  }
  const frozenIds = new Set(items.flatMap((i) => i.gapIds));
  const fresh = [];
  for (const a of accounts) for (const ch of chunk(pool.filter((g) => g.account === a && !frozenIds.has(g.id)), CLAUDE_MAX, 12, 22)) fresh.push({ a, ch });
  // global order by top tier of the chunk, stable by account order
  fresh.sort((x, y) => sevIdx(x.ch[0].sev) - sevIdx(y.ch[0].sev));
  let nn = maxNn;
  for (const { a, ch } of fresh) {
    nn++;
    const id = `WP-${tag}-${a}-${pad(nn)}-${domSlug(ch)}`;
    for (const g of ch) assigned.set(g.id, id);
    items.push({ id, queue: qname, dir: qname, frozen: false, status: "TODO", gapIds: ch.map((g) => g.id), gaps: ch });
  }
  queues[qname] = items;
  for (const i of items) wps.push(i);
}
claudeQueue("claude-wording", "wording", "wording");
claudeQueue("claude-small-fixes", "small", "small");
// cross-cutting: two themed queues in one file
{
  const gates = open.filter((g) => g.bucket === "xc-gates");
  const words = open.filter((g) => g.bucket === "xc-wording");
  const prior = readQueue("claude-cross-cutting");
  const items = []; let maxNn = 0;
  for (const p of prior) {
    if (p.status === "TODO") continue;
    maxNn = Math.max(maxNn, nnOf(p.id));
    const ids = frozenGapIds("cross-cutting", p.id); if (!ids) continue;
    for (const i of ids) assigned.set(i, p.id);
    items.push({ id: p.id, queue: "claude-cross-cutting", dir: "cross-cutting", frozen: true, status: p.status, gapIds: ids, gaps: ids.map((i) => openById.get(i)).filter(Boolean), line: p.line });
  }
  const frozenIds = new Set(items.flatMap((i) => i.gapIds));
  let nn = maxNn;
  for (const [theme, pool] of [["unset-gates", gates], ["raw-codes-and-developer-wording", words]]) {
    for (const ch of chunk(pool.filter((g) => !frozenIds.has(g.id)), 25, 10, 22)) {
      nn++;
      const id = `WP-xc-${pad(nn)}-${theme}`;
      for (const g of ch) assigned.set(g.id, id);
      items.push({ id, queue: "claude-cross-cutting", dir: "cross-cutting", frozen: false, status: "TODO", gapIds: ch.map((g) => g.id), gaps: ch, theme });
    }
  }
  queues["claude-cross-cutting"] = items;
  for (const i of items) wps.push(i);
}

// ---------------------------------------------------------------- 10. assertions
const placedCount = new Map();
for (const w of wps) for (const g of w.gaps) placedCount.set(g.id, (placedCount.get(g.id) || 0) + 1);
const orphans = open.filter((g) => !placedCount.has(g.id));
const dups = [...placedCount].filter(([, n]) => n > 1).map(([id]) => id);
const stale = []; // frozen gaps that are no longer open are kept in their WP; not an error

// ---------------------------------------------------------------- 11. legacy copy pointers
const legacyIndex = new Map(); // basename -> ["legacy-copy-A.md:123"]
for (const name of ["legacy-copy-A.md", "legacy-copy-B.md"]) {
  const L = lines(rel("docs", "audit", name));
  L.forEach((l, i) => {
    const m = /^#{3,4} `([^`]+)`/.exec(l);
    if (m) { const b = m[1].split("/").pop(); if (!legacyIndex.has(b)) legacyIndex.set(b, []); legacyIndex.get(b).push(`${name}:${i + 1}`); }
  });
}
function legacyPointers(g) {
  const out = new Set();
  for (const m of (g.legacy || "").matchAll(/[A-Za-z0-9_\-./]+\.(?:js|jsx|ts|tsx)\b/g)) {
    const hits = legacyIndex.get(m[0].split("/").pop());
    if (hits) hits.slice(0, 2).forEach((h) => out.add(h));
  }
  return [...out];
}
function quotedStrings(g) {
  const out = [];
  const ok = (s) => s.length >= 4 && /^[A-Za-z0-9“{$]/.test(s) && /[A-Za-z]{2,}/.test(s) && !(s.includes("/") && !s.includes(" ")) && (s.includes(" ") || /^[A-Z][A-Za-z ]+$/.test(s) || s.length >= 6);
  for (const m of g.text.matchAll(/"([^"`]{4,220})"|`([^`]{4,220})`/g)) {
    const s = (m[1] || m[2]).trim();
    if (ok(s) && !out.includes(s)) out.push(s);
  }
  return out.slice(0, 10);
}

// ---------------------------------------------------------------- 12. write WP files and queues
const PITFALLS = `Pitfalls and rules (same as \`docs/orchestrator/briefs/phase2/fix-tpo.md\`):
- No edits under protected paths: \`src/auth\`, \`src/security\`, \`src/modules/storage\`, \`drizzle/\`, \`.github\`, \`deploy\`, \`scripts\`, package files, env files. The shared shell files under \`src/components/shell\` belong to lane chat-9 only: other lanes request shell changes in their final summary, never edit them.
- New table or column: write the schema as staged code plus a proposal under \`docs/proposed-migrations/<id>.sql\`; the orchestrator registers it as a real migration (real migrations exist up to 0101).
- Use central \`can()\` / \`requirePermission\`; \`isSameOriginRequest\` on every mutating route; GET handlers never write; cast reused SQL parameters; alias duplicate Drizzle columns.
- No \`as never\`, no \`eslint-disable\`, no \`setState\` in effects, no \`Date.now()\` in render, no JSX inside try/catch.
- Every UI word exactly as the old LMS (decision 13; \`docs/audit/legacy-copy-A.md\`, \`-B.md\`, dev branch is the source). No AI features. Never touch production.
- A page or API that depends on an unset gate (\`DB09_TPO_API_READY\`, \`PUBLIC_JOIN_*\`, OTP secret) must say so visibly instead of failing generically.
- Re-check current main before building: a gap may already be fixed (then say so in the commit or summary instead of rebuilding).`;

const STANDING = (name, isLane) => `## Standing instructions

- Take the first TODO WP in the list below. Mark it IN-PROGRESS at the start of your work if you can push to your branch early.
- Up to 20 commits per round. One commit may close several gap IDs of the same screen; cite every gap ID it closes in the commit message (for example \`fix(tpo): TPO-batches-01, TPO-batches-02 decision numbers on cards\`).
- Push only your own branch \`${isLane ? "chatgpt/" + name : "claude/" + name + "-<topic>"}\`. Merge the latest \`main\` into it first.
- Update the status line of the WP in this file in your last commit of the round (TODO to IN-PROGRESS, DONE, or BLOCKED with a reason after the \`|\`).
- Your final summary lists: gap IDs finished / remaining / not run (tests you wrote but could not run), plus any "Needs owner decision" items you skipped.
- Gaps linked to a security-sensitive owner decision are marked SKIP in the WP file: leave them alone. For other owner decisions the WP states the default recommendation: build the default, do not block.
- Rules and pitfalls: see the end of each WP file and \`docs/orchestrator/briefs/phase2/fix-tpo.md\`.`;

function gapLine(g) {
  const link = `../../pages/${g.file}#L${g.line}`;
  let s = `- **${g.id}** [${g.sev}${g.status === "UNCONFIRMED" ? ", UNCONFIRMED" : ""}, ${g.type}] ${cut(g.text, 260)} ([audit](${link}))`;
  if (g.skipPending) s += ` SKIP pending owner (${g.ods.filter((o) => o.sensitive).map((o) => o.id).join(", ")}): default = keep restrictive.`;
  return s;
}

function wpMarkdown(w) {
  const gs = orderGaps(w.gaps);
  const lane = w.queue.startsWith("chat-") ? w.queue : null;
  const copy = gs.filter((g) => g.type === "COPY" || /^COPY/.test(g.type));
  const schema = gs.filter((g) => g.schema !== null);
  const owners = gs.filter((g) => g.ods.length || g.ownerNote);
  const areas = {};
  for (const g of gs) areas[g.area] = (areas[g.area] || 0) + 1;
  const files = {};
  for (const g of gs) for (const p of g.paths) files["src/" + p] = (files["src/" + p] || 0) + 1;
  const fileList = Object.entries(files).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 30);
  const val = gs.filter((g) => /VALIDATION|STATE|PERMISSION/.test(g.type));
  const side = gs.filter((g) => /SIDE-EFFECT/.test(g.type));
  let m = `# ${w.id}\n\nQueue: \`${w.queue}\`${lane ? ` (lane ${lane}: ${LANE_TITLE[lane]})` : ""}. Gaps: ${gs.length} (${sevMix(gs)}). Generated by \`scripts/audit/build-work-packages.mjs\`; do not hand-edit the gap list.\n\n`;
  m += `## Goal\n\n`;
  if (w.queue === "claude-wording") m += `Wording sweep: make every user-visible string named below exactly equal to the old LMS (decision 13). Change copy only; no behaviour changes. Look the legacy string up in the catalogue before editing.\n\n`;
  else if (w.queue === "claude-small-fixes") m += `Small logic, validation and state fixes that need no new table or column. Keep each fix minimal and covered by a unit test.\n\n`;
  else if (w.queue === "claude-cross-cutting") m += `Cross-cutting theme \`${w.theme || "see gaps"}\`: ${w.theme === "unset-gates" ? "every page or API that depends on an unset readiness gate must say so visibly and in plain language (never a generic failure or an empty page). Fix the pattern once in shared code where possible, then apply it per page." : "remove raw error codes, enum codes and developer or migration wording from user-visible text; map codes to the exact legacy messages through one shared helper where possible."} Touch files across lanes with minimal diffs and merge main often.\n\n`;
  else m += `Close the gaps below for ${LANE_TITLE[lane]}. Priority order is the order listed (S1 first). Re-check main first; skip and report gaps that are already fixed.\n\n`;
  m += `## Gaps\n\nSeverity is after Round R review. Each row links to its audit file line (legacy and vNext evidence are in the row).\n\n`;
  m += gs.map(gapLine).join("\n") + "\n\n";
  m += `## Code areas and files to touch\n\nAreas (gap count): ${Object.entries(areas).sort((a, b) => b[1] - a[1]).map(([a, n]) => `\`${a}\` (${n})`).join(", ")}.\n\n`;
  m += fileList.length ? `Files named in the vNext evidence (heuristic, verify):\n\n${fileList.map(([f, n]) => `- \`${f}\`${n > 1 ? ` (${n} gaps)` : ""}`).join("\n")}\n\n` : `No vNext file paths could be resolved from the evidence; start from the audit file rows.\n\n`;
  m += `## COPY (wording) gaps\n\n`;
  if (copy.length) {
    m += `Exact legacy strings: the strings quoted in each gap row are listed first (legacy side and vNext side are both quoted in the row; the legacy string is the target). Confirm against the catalogue block named after it.\n\n`;
    for (const g of copy) {
      const q = quotedStrings(g), p = legacyPointers(g);
      m += `- **${g.id}**: ${q.length ? q.map((s) => `\`${s.replace(/`/g, "'")}\``).join("; ") : "(no quoted string in the row; read the audit row and the catalogue)"}${p.length ? `. Catalogue: ${p.map((x) => `\`docs/audit/${x}\``).join(", ")}` : ""}\n`;
    }
    m += "\n";
  } else m += `None in this WP.\n\n`;
  m += `## New table or column needed (heuristic)\n\n`;
  if (schema.length) {
    m += `These gap rows mention a table, column, migration or stored value. Confirm; if real, write the staged schema plus \`docs/proposed-migrations/<id>.sql\` and list it in your final summary (the orchestrator registers it).\n\n`;
    for (const g of schema) m += `- ${g.id}${g.schema.length ? `: ${g.schema.map((s) => `\`${s}\``).join(", ")}` : ": (no identifier named; read the row)"}\n`;
    m += "\n";
  } else m += `None expected.\n\n`;
  m += `## Required tests\n\n- Unit tests with the exact legacy strings for every COPY gap and for validation messages (${copy.length} COPY, ${val.length} validation/state/permission gaps here).\n- Integration tests for DB paths${side.length ? ` (${side.length} side-effect gaps here: assert the audit/notification row or outbound message through the one messaging module)` : ""}; write them even if you cannot run them, and say so in the summary.\n- Name tests by gap ID where practical.\n\n`;
  m += `## Definition of done\n\n- Each gap ID is cited in a commit message (or the summary says why it was skipped or already fixed).\n- Tests written as above.\n- The parity note is updated: tick the gap in the page's audit file section or add the line your lane's note file expects (see \`docs/orchestrator/briefs/phase2/\`).\n- No \`as never\`, no \`eslint-disable\`; lint, typecheck and unit tests pass.\n- ${PITFALLS.split("\n").slice(1).join("\n")}\n\n`;
  m += `## Needs owner decision\n\n`;
  if (owners.length) {
    m += `Do not block. Build the default recommendation unless the row is marked SKIP.\n\n`;
    for (const g of owners) {
      if (g.ods.length) for (const o of g.ods) m += `- ${g.id} / ${o.id}: ${cut(o.question, 220)} Default: ${cut(o.rec, 200)}${o.sensitive ? " **Security-sensitive: default = keep restrictive, pending owner. SKIP this gap.**" : ""}\n`;
      else m += `- ${g.id}: ${g.ownerNote}. Skip the undecided part and report it.\n`;
    }
    m += "\n";
  } else m += `None known. If you hit a policy question, skip that gap and list it in your final summary.\n\n`;
  return m;
}

// clean generated output (frozen WP files are kept)
const frozenFiles = new Set(wps.filter((w) => w.frozen).map((w) => path.join(wpDir, w.dir, w.id + ".md")));
fs.mkdirSync(wpDir, { recursive: true }); fs.mkdirSync(qDir, { recursive: true });
for (const d of [...LANES, "claude-wording", "claude-small-fixes", "cross-cutting"]) {
  const dir = path.join(wpDir, d);
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) { const full = path.join(dir, f); if (f.endsWith(".md") && !frozenFiles.has(full)) fs.unlinkSync(full); }
  fs.mkdirSync(dir, { recursive: true });
}
for (const w of wps) {
  if (w.frozen) continue;
  fs.writeFileSync(path.join(wpDir, w.dir, w.id + ".md"), wpMarkdown(w));
}

const QUEUE_HEAD = {
  "claude-wording": ["Claude wording queue", "Claude builder agents", "Wording sweeps: every WP is made only of COPY gaps (exact legacy strings, decision 13), grouped per account. No behaviour changes."],
  "claude-small-fixes": ["Claude small-fixes queue", "Claude builder agents", "Small logic, validation, state and accessibility gaps that need no new table or column. Grouped per account."],
  "claude-cross-cutting": ["Claude cross-cutting queue", "Claude builder agents (one agent per WP, merge main often; these WPs touch files owned by several lanes, keep diffs minimal)", "Themes that cut across lanes: unset-gate visibility, raw error codes and developer wording."],
};
function writeQueue(qname) {
  const items = queues[qname];
  const isLane = LANES.includes(qname);
  const head = isLane ? [`Queue for lane ${qname}`, `ChatGPT builder lane ${qname}`, LANE_TITLE[qname]] : QUEUE_HEAD[qname];
  const dir = isLane ? qname : qname === "claude-cross-cutting" ? "cross-cutting" : qname;
  let m = `# ${head[0]}\n\nOwner: ${head[1]}. Scope: ${head[2]}\n\nGenerated by \`scripts/audit/build-work-packages.mjs\`. Re-running keeps every WP whose status is not TODO and its gap list; only TODO WPs are re-partitioned. Overview and ownership table: \`docs/audit/work-packages/README.md\`.\n\n`;
  m += (isLane ? STANDING(qname, true) : STANDING(qname.replace("claude-", ""), false)) + "\n\n";
  m += `## Work packages (in order)\n\nFormat: \`<n>. <WP id> | <STATUS> | <gaps>\`. WP files are in \`docs/audit/work-packages/${dir}/\`.\n\n`;
  items.forEach((w, i) => {
    const gs = w.gaps;
    m += w.frozen && w.line ? `${i + 1}. ${w.line.replace(/^\d+\.\s+/, "")}\n` : `${i + 1}. ${w.id} | ${w.status} | ${w.gapIds.length} gaps: ${sevMix(gs)}\n`;
  });
  if (!items.length) m += "(no work packages)\n";
  fs.writeFileSync(path.join(qDir, qname + ".md"), m);
}
for (const q of Object.keys(queues)) writeQueue(q);

// ---------------------------------------------------------------- 13. README
const laneOpen = (lane) => open.filter((g) => assigned.get(g.id) && wps.find((w) => w.id === assigned.get(g.id))?.queue === lane);
const cnt = (gs) => Object.fromEntries(SEVS.map((s) => [s, gs.filter((g) => g.sev === s).length]));
let R = `# Phase 2 work packages\n\nGenerated by \`node scripts/audit/build-work-packages.mjs\` from \`docs/audit/gap-register.md\` (itself generated from \`docs/audit/pages/**\`). Re-run after each Round R review lands; WPs already started are kept.\n\nEvery open or unconfirmed gap (${open.length}) sits in exactly one WP. Lane queues: \`docs/orchestrator/queues/chat-<n>.md\`. Claude agent queues: \`claude-wording.md\`, \`claude-small-fixes.md\`, \`claude-cross-cutting.md\`.\n\n`;
R += `Routing: (1) cross-cutting gaps (unset gates, raw codes, developer wording) go to the cross-cutting queue; (2) the remaining COPY gaps go to the wording queue; (3) small VALIDATION/STATE/A11Y/RESPONSIVE gaps without schema, side effects or owner decisions go to the small-fixes queue; (4) everything else goes to its owner lane's WPs (15 to 25 gaps each, S1 first across the lane). Owner lane = the lane that owns the best code path named in the gap's vNext evidence (shell, then route, then API, then component, then module), falling back to the audit page.\n\n`;
R += `## Counts per queue\n\nOpen = OPEN plus UNCONFIRMED. Rounds assume about ${TARGET} gaps closed per ChatGPT round (Claude agents: about 1 WP per agent run).\n\n| Queue | S1 | S2 | S3 | S4 | Open gaps | WPs | Est. rounds |\n|---|---|---|---|---|---|---|---|\n`;
let tot = { S1: 0, S2: 0, S3: 0, S4: 0, n: 0, w: 0 };
const roundsOf = {};
for (const q of [...LANES, "claude-wording", "claude-small-fixes", "claude-cross-cutting"]) {
  const items = queues[q] || [];
  const gs = items.flatMap((w) => w.gaps);
  const c = cnt(gs);
  const rounds = LANES.includes(q) ? Math.ceil(gs.length / TARGET) : items.length;
  roundsOf[q] = rounds;
  R += `| ${q} | ${c.S1} | ${c.S2} | ${c.S3} | ${c.S4} | ${gs.length} | ${items.length} | ${rounds}${LANES.includes(q) ? "" : " (agent runs)"} |\n`;
  for (const s of SEVS) tot[s] += c[s]; tot.n += gs.length; tot.w += items.length;
}
R += `| **total** | ${tot.S1} | ${tot.S2} | ${tot.S3} | ${tot.S4} | ${tot.n} | ${tot.w} | |\n\n`;
const longest = LANES.map((l) => [l, roundsOf[l]]).sort((a, b) => b[1] - a[1]);
R += `## Critical path\n\nLargest ChatGPT queue: **${longest[0][0]}** (${longest[0][1]} rounds). Order: ${longest.map((x) => `${x[0]} ${x[1]}`).join(", ")}. If a lane is far longer than the rest, move whole WPs (never single gaps) from the tail of its queue to a shorter lane whose files do not overlap, or hand wording/small-fix WPs to Claude agents.\n\n`;
R += `## Cross-cutting WPs\n\n`;
for (const w of queues["claude-cross-cutting"]) R += `- \`${w.id}\` (${w.gapIds.length} gaps, ${sevMix(w.gaps)})\n`;
if (!queues["claude-cross-cutting"].length) R += "(none)\n";
R += `\nBuilders in other lanes must not fix these gaps; they are listed only in the cross-cutting WP files.\n\n`;
R += `## File ownership table\n\nOne owner lane per directory. Other lanes never edit these files; they ask in their final summary.\n\n| Lane | Owns |\n|---|---|\n`;
const OWN = {
  "chat-2": "`src/app/(authenticated)/tpo/{recruiters,companies,campaigns,messages,team,announcements,follow-ups,find}`; `src/app/{placements,college-join,company-join,campaign-unsubscribe,company-share}`; `src/app/api/public/*` join/unsubscribe/recruit; `src/components/tpo` recruiter and messaging files; `src/components/placements/{public-*,tpo-recruiter-*,tpo-company-*,placement-employer-*,placement-recruiter-access,tpo-trust-toggle}`; `src/modules/placements` recruiter, company, join, campaign, public-enquiry, company-share, tpo-messaging files",
  "chat-3": "`src/app/(authenticated)/{college,college-admin}` except `college/projects`; `src/components/{college,colleges}`; `src/components/placements/college-*`; `src/modules/placements/college-*`",
  "chat-4": "`src/app/(authenticated)/{teacher,teach}`; `src/app/(authenticated)/learn/{assignments,quizzes,allAssignments,allQuizzes,courses/[id]}`; `src/app/quiz`; `src/components/{courses,attendance}`; `src/modules/{courses,attendance}`",
  "chat-5": "`src/app/(authenticated)/tpo/{batches,students,requests,drive-day,placements}`; `src/app/(authenticated)/learn/{placements,my-placements}`; `src/components/placements` core drive, applicant, round, offer and `learner-*` files; `src/modules/placements` core (drives, applications, batches, eligibility, offers, learner)",
  "chat-6": "`src/app/(authenticated)/{admin (academics, people, placements, recruiters, hr), superadmin, account}`; `src/app/{login,hr-invite,recruiter-invite,not-found,global-error,page}`; `src/components/{auth,public}`; `src/components/admin` academics and people files",
  "chat-7": "`src/app/(authenticated)/{recruiter,hr}`; `src/app/(authenticated)/learn` except placements, projects and course experience; `src/components/hr`; `src/components/placements/{hr-*,recruiter-*}`; `src/modules/placements/hr-*`",
  "chat-9": "`src/components/shell` and `src/app/(authenticated)/layout.tsx` (shell is owned ONLY by chat-9); `src/app/(authenticated)/tpo/{home,settings,audit,calendar,reports,verification,more,notifications,profile}`; `src/app/(authenticated)/admin/{tenants,colleges,module-access,features,settings,inbound-mail,domains,audit,organizations}`; `src/components/admin` tenant and college-setup files; `src/modules/{colleges,tenant-domains,module-access,organizations,platform-settings,inbound-mail}`; `src/modules/placements` settings, public-page, report, calendar files",
  "chat-11": "`src/app/(authenticated)/{mentor,tracker}`; `src/app/(authenticated)/learn/projects`; `src/app/(authenticated)/college/projects`; `src/app/(authenticated)/admin/projects`; `src/components/{projects,tracker}`; `src/modules/{projects,bug-tracker}`",
};
for (const l of LANES) R += `| ${l} | ${OWN[l]} |\n`;
R += `| nobody (protected) | \`src/auth\`, \`src/security\`, \`src/modules/storage\`, \`drizzle/\`, \`.github\`, \`deploy\`, \`scripts\`, package files, env |\n| shared (change minimally, keep the diff small, merge main first) | \`src/components/{ui,profile,people,dashboard,announcements,activity,verification,groups,academics,electives}\`, \`src/modules/{identity,people,academics,departments,groups,electives,skills,notifications,messaging,verification}\`, \`src/db/schema\` (staged additions only), \`tests/\` |\n\n`;
// ambiguous ownership
const mism = {};
for (const g of open) if (g.areaSource === "path" && g.lane !== g.slugLane) { const k = `${g.slugLane} -> ${g.lane}`; mism[k] = (mism[k] || 0) + 1; }
const fallback = open.filter((g) => g.areaSource === "page").length;
R += `## Ownership ambiguities\n\n- ${open.length - fallback} gaps were placed by a code path, ${fallback} by the audit page slug (no resolvable path in the evidence).\n- Gaps whose code path owner differs from the page's default lane (the path won): ${Object.keys(mism).length ? Object.entries(mism).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join("; ") : "none"}.\n- Directories used by two accounts: \`src/components/placements\` (split by file prefix as in the table), \`src/components/admin\` (tenant and college-setup files to chat-9, the rest to chat-6), \`src/modules/placements\` (split by file prefix), \`learn/courses\` (list page chat-7, \`[id]\` chat-4), \`src/components/attendance\` (chat-4, used by College Admin attendance screens owned by chat-3: chat-3 asks chat-4 for shared component changes).\n\n`;
// owner decisions
R += `## Owner decisions (defaults applied, nothing blocked)\n\nSource: \`docs/audit/owner-decisions.md\`. Builders implement the default recommendation. Rows in bold are security-sensitive: default = keep restrictive, pending owner; the linked gaps are marked SKIP in their WP.\n\n| ID | Default applied | Linked open gaps | Sensitivity |\n|---|---|---|---|\n`;
for (const od of ODS) {
  const linked = open.filter((g) => g.ods.includes(od));
  R += `| ${od.sensitive ? `**${od.id}**` : od.id} | ${cut(od.rec, 230).replace(/\|/g, "/")} | ${linked.length}${linked.length ? ": " + linked.slice(0, 6).map((g) => g.id).join(", ") + (linked.length > 6 ? ", ..." : "") : ""} | ${od.sensitive ? "default = keep restrictive, pending owner" : ""} |\n`;
}
R += `\nScope decision OD-37 (default): all S1 to S3 plus every exact-wording S4; other S4 are included in the queues at the end so they are done last, never ahead of S1 to S3.\n\n`;
R += `## Work package index\n\n`;
for (const q of [...LANES, "claude-wording", "claude-small-fixes", "claude-cross-cutting"]) {
  R += `### ${q}\n\n`;
  for (const w of queues[q]) R += `- [${w.id}](${w.dir}/${w.id}.md): ${w.gapIds.length} gaps, ${sevMix(w.gaps)}\n`;
  R += "\n";
}
fs.writeFileSync(path.join(wpDir, "README.md"), R);

// ---------------------------------------------------------------- 14. report
console.log("\nOpen gaps by queue / severity:");
for (const q of [...LANES, "claude-wording", "claude-small-fixes", "claude-cross-cutting"]) {
  const gs = queues[q].flatMap((w) => w.gaps); const c = cnt(gs);
  console.log(`${q.padEnd(22)} S1 ${String(c.S1).padStart(3)} S2 ${String(c.S2).padStart(3)} S3 ${String(c.S3).padStart(3)} S4 ${String(c.S4).padStart(3)} total ${String(gs.length).padStart(4)} WPs ${String(queues[q].length).padStart(2)} rounds ${roundsOf[q]}`);
}
console.log(`total placed ${placedCount.size} of ${open.length} open; WPs ${wps.length}`);
const sizes = wps.map((w) => w.gapIds.length);
console.log(`WP sizes min ${Math.min(...sizes)} max ${Math.max(...sizes)}; outside 15..25: ${wps.filter((w) => !w.frozen && (w.gapIds.length < 15 || w.gapIds.length > 25)).map((w) => `${w.id}(${w.gapIds.length})`).join(", ") || "none"}`);
if (orphans.length) console.log("ORPHAN gaps:", orphans.map((g) => g.id).join(", "));
if (dups.length) console.log("DUPLICATE gaps:", dups.join(", "));
if (orphans.length || dups.length) process.exit(1);
console.log("OK: every open gap appears in exactly one WP.");
