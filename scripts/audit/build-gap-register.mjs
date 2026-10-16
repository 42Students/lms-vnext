#!/usr/bin/env node
// Builds docs/audit/gap-register.md and docs/audit/PROGRESS.md from the phase 2
// per-page audits (docs/audit/pages/<account>/*.md) and their Round R reviews
// (*-review.md). Plain Node, no dependencies, safe to re-run as reviews arrive.
//
//   node scripts/audit/build-gap-register.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const pagesDir = path.join(root, "docs", "audit", "pages");
const outRegister = path.join(root, "docs", "audit", "gap-register.md");
const outProgress = path.join(root, "docs", "audit", "PROGRESS.md");

const ACCOUNTS = ["tpo", "recruiter", "learner", "faculty", "college", "superadmin", "mentor", "public"];
const notes = []; // parser notes

function laneFor(account, slug) {
  if (account === "tpo") {
    if (/^(recruiters|companies|campaigns|inbox-team)/.test(slug)) return "chat-2";
    if (/^(drives|drive-workspace|batches|students|requests-verification)/.test(slug)) return "chat-5";
    return "chat-9"; // home, settings-audit, calendar-reports
  }
  if (account === "college" || account === "superadmin") return "chat-9";
  return "chat-7"; // recruiter, learner, faculty, mentor, public (chat-4 faculty, chat-11 mentor/projects may take over)
}

// Split a markdown table row on unescaped pipes.
function splitRow(line) {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|") && !s.endsWith("\\|")) s = s.slice(0, -1);
  const cells = [];
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\\" && s[i + 1] === "|") { cur += "|"; i++; continue; }
    if (s[i] === "|") { cells.push(cur.trim()); cur = ""; continue; }
    cur += s[i];
  }
  cells.push(cur.trim());
  return cells;
}

// Locate [gap..., type, severity, legacy, vnext...] tolerating stray pipes anywhere after the ID.
function splitGapCells(c) {
  for (let k = 3; k < c.length; k++) {
    const sv = clean(c[k]).replace(/`/g, "");
    const ty = clean(c[k - 1]).replace(/`/g, "");
    if (/^S[0-4]\b/.test(sv) && sv.length <= 40 && /^[A-Z][A-Z0-9\/ ,+&\-]*$/.test(ty)) {
      return { text: c.slice(1, k - 1).join(" | "), type: c[k - 1], sev: c[k], legacy: c[k + 1] || "", vnext: c.slice(k + 2).join(" | ") };
    }
  }
  return null;
}

const isSep =(l) => /^\|?\s*:?-{2,}/.test(l.trim());
const clean = (t) => t.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
const sevOf = (t) => { const m = /\bS([0-4])\b/.exec(t || ""); return m ? "S" + m[1] : null; };

// Extract all tables whose header matches `headerTest`.
function tables(lines, headerTest) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l.trim().startsWith("|")) continue;
    const prev = i > 0 ? lines[i - 1] : "";
    if (prev.trim().startsWith("|")) continue; // not the table start
    const header = splitRow(l).map((c) => clean(c).toLowerCase());
    if (!headerTest(header)) continue;
    const rows = [];
    let j = i + 1;
    if (j < lines.length && isSep(lines[j])) j++;
    while (j < lines.length && lines[j].trim().startsWith("|")) { rows.push({ cells: splitRow(lines[j]), line: j + 1 }); j++; }
    out.push({ header, rows, line: i + 1 });
    i = j;
  }
  return out;
}

const isGapHeader = (h) => /^(id|#|gap id)$/.test(h[0]) && h.some((c) => /^gap$/.test(c)) && h.some((c) => /^sev/.test(c));

function readFile(f) { return fs.readFileSync(f, "utf8").split(/\r?\n/); }

// ---- Round A -------------------------------------------------------------
const pages = []; // {account, slug, file, rel, gaps[], selfCount, reviewFile}
const gaps = [];  // all gap rows
for (const account of ACCOUNTS) {
  const dir = path.join(pagesDir, account);
  if (!fs.existsSync(dir)) { notes.push(`No directory docs/audit/pages/${account}.`); continue; }
  for (const f of fs.readdirSync(dir).sort()) {
    if (!f.endsWith(".md") || f.endsWith("-review.md")) continue;
    const slug = f.replace(/\.md$/, "");
    const rel = `docs/audit/pages/${account}/${f}`;
    const lines = readFile(path.join(dir, f));
    const page = { account, slug, file: f, rel, gaps: [], selfCount: null, selfNote: "", reviewFile: null };
    for (const t of tables(lines, isGapHeader)) {
      const hi = Object.fromEntries(t.header.map((h, i) => [h, i]));
      const stdOrder = t.header.length === 6 && /^id|#|gap id/.test(t.header[0]) && t.header[1] === "gap" && t.header[2] === "type" && /^sev/.test(t.header[3]);
      if (!stdOrder) notes.push(`${rel}:${t.line}: gap table has non-standard header [${t.header.join(" | ")}]; parsed by header name.`);
      for (const r of t.rows) {
        const c = r.cells;
        if (!c[0] || !/\w/.test(c[0])) continue;
        let id, text, type, sev, legacy, vnext;
        const sp = stdOrder ? splitGapCells(c) : null;
        if (sp) {
          id = c[0]; text = sp.text; type = sp.type; sev = sp.sev; legacy = sp.legacy; vnext = sp.vnext;
          if (c.length !== 6) notes.push(`${rel}:${r.line}: row ${clean(id)} has ${c.length} cells (stray pipe); re-aligned on the Type/Severity cells.`);
        } else if (stdOrder && c.length >= 6) {
          id = c[0]; vnext = c[c.length - 1]; legacy = c[c.length - 2]; sev = c[c.length - 3]; type = c[c.length - 4];
          text = c.slice(1, c.length - 4).join(" | ");
          notes.push(`${rel}:${r.line}: row ${clean(id)} has ${c.length} cells and no clear Type/Severity pair; used the last four cells.`);
        } else {
          const pick = (re) => { const k = t.header.findIndex((h) => re.test(h)); return k >= 0 ? c[k] : ""; };
          id = c[0]; text = pick(/^gap$/); type = pick(/^type$/); sev = pick(/^sev/); legacy = pick(/legacy/); vnext = pick(/vnext/);
        }
        id = clean(id).replace(/`/g, "");
        if (!/^[A-Za-z]+(-[A-Za-z0-9]+)*-\d+[a-z]?$/.test(id)) { notes.push(`${rel}:${r.line}: unexpected ID format "${id}" kept as is.`); }
        let sv = sevOf(sev);
        if (!sv) {
          const alt = c.map((x) => /^S[0-4]$/.test(clean(x)) ? clean(x) : null).find(Boolean);
          sv = alt || sevOf(`${text} ${type}`) || "S?";
          notes.push(`${rel}:${r.line}: ${id} severity cell "${clean(sev || "")}" not a plain S0-S4; resolved to ${sv}.`);
        }
        const g = {
          id, page: slug, account, file: rel, line: r.line,
          sev0: sv, gap: clean(text || ""), type: clean(type || "").replace(/`/g, ""), severity: sv, severity_note: "",
          legacy: clean(legacy || ""), vnext: clean(vnext || ""),
          status: /UNCONFIRMED/.test(`${text} ${legacy} ${vnext}`) ? "UNCONFIRMED" : "OPEN",
          review_note: "", source: "A", lane: laneFor(account, slug),
        };
        page.gaps.push(g); gaps.push(g);
      }
    }
    // The file's own summary count line.
    for (const l of lines) {
      if (/^\s*(Counts?|Total)\b/i.test(l) && /\b\d+\s+(gaps?|gap rows|rows)\b|\((\d+)\s+(gaps|rows)\)/i.test(l)) {
        const m = /(\d+)\s+(?:gap rows|gaps|rows)\b/i.exec(l) || /\((\d+)\s+(?:gaps|rows)\)/i.exec(l);
        if (m) { page.selfCount = Number(m[1]); page.selfNote = clean(l).slice(0, 160); page.selfSev = {}; for (const mm of l.matchAll(/\bS([1-4])\s*[= ]\s*(\d+)/g)) if (!(("S" + mm[1]) in page.selfSev)) page.selfSev["S" + mm[1]] = Number(mm[2]); break; }
      }
    }
    pages.push(page);
  }
}
if (new Set(gaps.map((g) => g.id)).size !== gaps.length) {
  const seen = new Set();
  for (const g of gaps) { if (seen.has(g.id)) notes.push(`Duplicate Round A ID ${g.id} (${g.file}:${g.line}).`); seen.add(g.id); }
}
const byId = new Map(gaps.map((g) => [g.id, g]));

// Group totals quoted in a "Counts ... Group totals" line are checked per file only.
// ---- Round R reviews -------------------------------------------------------
const reviews = []; // {file, page, rate, ...}
function findPageForReview(account, slug) {
  const exact = pages.filter((p) => p.account === account && p.slug === slug);
  if (exact.length) return exact;
  return pages.filter((p) => p.account === account && (p.slug.startsWith(slug) || slug.startsWith(p.slug)));
}
for (const account of ACCOUNTS) {
  const dir = path.join(pagesDir, account);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).sort()) {
    if (!f.endsWith("-review.md")) continue;
    const slug = f.replace(/-review\.md$/, "");
    const rel = `docs/audit/pages/${account}/${f}`;
    const lines = readFile(path.join(dir, f));
    const text = lines.join("\n");
    const targets = findPageForReview(account, slug);
    if (!targets.length) notes.push(`${rel}: no matching Round A file for slug "${slug}"; MISSED rows are attached to a pseudo page.`);
    targets.forEach((p) => (p.reviewFile = rel));
    const rev = { file: rel, account, slug, targets, rate: null, rateLine: "", stated: {}, counted: { confirmed: 0, wrong: 0, sev: 0, missed: 0, unresolved: 0 } };
    const rl = lines.find((l) => /discrepancy rate/i.test(l));
    if (rl) {
      rev.rateLine = clean(rl);
      const ms = [...rl.matchAll(/(\d+(?:\.\d+)?)\s*%/g)];
      if (ms.length) rev.rate = Number(ms[0][1]); // first percentage after "Discrepancy rate"
    } else notes.push(`${rel}: no "Discrepancy rate" line found.`);
    const sm = /(\d+)\s+Round A gaps/i.exec(text) || /Round A gaps(?: reviewed)?\s*(\d+)\s*[:.,;]/i.exec(text) || /Round A gaps(?: reviewed)?:\s*(\d+)(?!\s+CONFIRMED)/i.exec(text);
    if (sm) rev.stated.roundA = Number(sm[1]);
    const mm = /MISSED:?\s*(\d+)/i.exec(text);
    if (mm) rev.stated.missed = Number(mm[1]);

    const resolve = (raw) => {
      const id = clean(raw).replace(/`/g, "");
      if (byId.has(id)) return byId.get(id);
      const m = /(\d+)$/.exec(id);
      if (!m) return null;
      const n = Number(m[1]);
      const cands = [];
      for (const p of targets) for (const g of p.gaps) { const gm = /(\d+)[a-z]?$/.exec(g.id); if (gm && Number(gm[1]) === n) cands.push(g); }
      return cands.length === 1 ? cands[0] : null;
    };

    // Verdict tables.
    for (const t of tables(lines, (h) => h.some((c) => c === "verdict"))) {
      for (const r of t.rows) {
        const c = r.cells; if (c.length < 2) continue;
        const verdict = clean(c[1]); const note = clean(c.slice(2).join(" | "));
        const g = resolve(c[0]);
        if (!g) { rev.counted.unresolved++; notes.push(`${rel}:${r.line}: verdict row "${clean(c[0])}" does not resolve to a Round A gap.`); continue; }
        const V = verdict.toUpperCase();
        if (V.startsWith("WRONG")) {
          rev.counted.wrong++;
          const closed = !/\bno gap\b/i.test(note) && (/closed|stale|since|fixed|built|works|already|\bexists?\b|\bnow\b|\bresiduals?\b|\brenders\b/i.test(verdict) || /^(Stale|Closed|Fixed|Built|Commit)/i.test(note) || /\bcommits? `?[0-9a-f]{7}|`[0-9a-f]{9}`|\bexists?\b|\bnow\b|\bresiduals?\b|\brenders\b/i.test(note.slice(0, 400)));
          g.status = closed ? "CLOSED-SINCE" : "WRONG";
          g.review_note = clean(`${verdict}: ${note}`);
        } else if (V.startsWith("SEVERITY-CHANGE")) {
          rev.counted.sev++;
          const m = /S([0-4])\s*(?:to|->|-&gt;|→)\s*S([0-4])/i.exec(`${verdict} ${note}`);
          const old = g.severity;
          if (m) { g.severity = "S" + m[2]; g.severity_note = clean(`Review: S${m[1]} to S${m[2]}${/conditional/i.test(verdict) ? " (conditional)" : ""}. ${note}`); }
          else { g.severity_note = clean(`Review severity change (new value not parsed). ${note}`); notes.push(`${rel}:${r.line}: SEVERITY-CHANGE for ${g.id} without parsable S-to-S.`); }
          if (m && "S" + m[1] !== old) notes.push(`${rel}:${r.line}: ${g.id} review says old severity S${m[1]} but Round A has ${old}.`);
          if (/stale|closed/i.test(note) && /now WRONG|partly stale/i.test(note)) g.review_note = clean(note);
        } else if (V.startsWith("CONFIRMED")) {
          rev.counted.confirmed++;
          if (/UNCONFIRMED|live check pending/i.test(verdict) && g.status === "OPEN") g.status = "UNCONFIRMED";
          if (note && /UNCONFIRMED/.test(note) && g.status === "OPEN") g.status = "UNCONFIRMED";
          if (note && g.status !== "OPEN") g.review_note = g.review_note || clean(`${verdict}: ${note}`);
        } else notes.push(`${rel}:${r.line}: unrecognised verdict "${verdict}" for ${g.id}.`);
      }
    }
    // MISSED tables.
    for (const t of tables(lines, isGapHeader)) {
      for (const r of t.rows) {
        const c = r.cells;
        const id = clean(c[0]).replace(/`/g, "");
        if (!/R\d+$/.test(id)) continue;
        if (byId.has(id)) { notes.push(`${rel}:${r.line}: duplicate MISSED id ${id}.`); continue; }
        const base = targets[0];
        const sp = splitGapCells(c) || { text: c.slice(1, c.length - 4).join(" | "), type: c[c.length - 4], sev: c[c.length - 3], legacy: c[c.length - 2], vnext: c[c.length - 1] };
        const g = {
          id, page: base ? base.slug : slug, account, file: rel, line: r.line,
          gap: clean(sp.text), type: clean(sp.type).replace(/`/g, ""),
          severity: sevOf(sp.sev) || "S?", severity_note: "", legacy: clean(sp.legacy), vnext: clean(sp.vnext),
          status: /UNCONFIRMED/.test(c.join(" ")) ? "UNCONFIRMED" : "OPEN", review_note: "", source: "R", lane: laneFor(account, base ? base.slug : slug),
        };
        if (g.severity === "S?") notes.push(`${rel}:${r.line}: ${id} has no parsable severity.`);
        gaps.push(g); byId.set(id, g); rev.counted.missed++;
        (base || { gaps: [] }).gaps.push(g);
      }
    }
    // Severity-change details in section 4 for IDs whose verdict row lacked a value are ignored (notes above).
    reviews.push(rev);
    // consistency checks against the review's own header line
    if (rev.stated.missed != null && rev.stated.missed !== rev.counted.missed) notes.push(`${rel}: summary says MISSED ${rev.stated.missed} but ${rev.counted.missed} MISSED rows parsed.`);
    const nA = targets.reduce((a, p) => a + p.gaps.filter((g) => g.source === "A").length, 0);
    if (rev.stated.roundA != null && rev.stated.roundA !== nA) notes.push(`${rel}: review says ${rev.stated.roundA} Round A gaps but ${nA} Round A rows parsed from the audit.`);
  }
}

// ---- Closure tracking (git citations + test/acceptance evidence) ------------
// Lanes cite gap IDs in commit subjects/bodies. Cited on origin/main -> FIXED-ON-MAIN;
// cited only on an origin/chatgpt/chat-* branch -> IN-BRANCH; evidence in tests/ or
// docs/audit/acceptance/ -> VERIFIED (only ever upgrades FIXED-ON-MAIN).
const TRACK_SINCE = process.env.TRACK_SINCE || "2026-10-15";
const MAIN_REF = process.env.TRACK_MAIN_REF || "origin/main";
const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 1 << 29, stdio: ["ignore", "pipe", "pipe"] });
const pad2 = (n) => (/^R?\d$/.test(n) ? n.replace(/(\d)$/, "0$1") : n);
const knownPrefixes = new Set();
for (const g of gaps) knownPrefixes.add(g.id.replace(/-R?\d+[a-z]?$/, ""));
const parseIssues = []; // {kind, id, where}
const GEN = /\b(?:TPO|REC|LEARNER|FAC|COL|SA|MEN|PUB)(?:-[A-Za-z][A-Za-z0-9]*)+-R?\d+[a-z]?(?![A-Za-z0-9])/g;
// Return the register IDs cited in a text. Handles lists ("X-13, 21, 25"), "a/b", "and", ranges "X-01..05".
function extractIds(text, where) {
  const out = [];
  let m;
  GEN.lastIndex = 0;
  while ((m = GEN.exec(text))) {
    const full = m[0];
    const end = GEN.lastIndex;
    const prefix = full.replace(/-R?\d+[a-z]?$/, "");
    const first = /(R?\d+[a-z]?)$/.exec(full)[1];
    if (!knownPrefixes.has(prefix)) {
      // "TPO-drives-01-05" style hyphen range: the prefix itself ends in a number.
      const p2 = prefix.replace(/-\d+$/, "");
      if (p2 !== prefix && knownPrefixes.has(p2)) {
        const a = Number(/-(\d+)$/.exec(prefix)[1]), b = Number(/(\d+)/.exec(first)[1]);
        for (let n = a; n <= b && n - a < 200; n++) out.push({ prefix: p2, num: String(n).padStart(2, "0") });
        continue;
      }
      parseIssues.push({ kind: "unknown-prefix", id: full, where });
      continue;
    }
    out.push({ prefix, num: first });
    const rest = text.slice(end);
    let consumed = 0;
    const rng = /^\s*(?:\.\.|-|–|—)\s*(\d{2,3})(?![\w-])/.exec(rest);
    if (rng && !first.startsWith("R")) {
      const a = Number(/(\d+)/.exec(first)[1]), b = Number(/(\d+)/.exec(rng[1])[1]);
      for (let n = a + 1; n <= b && n - a < 200; n++) out.push({ prefix, num: String(n).padStart(2, "0") });
      consumed = rng[0].length;
    }
    let tail = rest.slice(consumed);
    for (;;) {
      const c = /^(?:\s*,\s*(?:and\s+)?|\s*\/\s*|\s+and\s+|\s*&\s*|\s*\+\s*)(R?\d+[a-z]?)(?![\w-]|\.\d)/.exec(tail);
      if (!c) break;
      // bare numbers: at least two digits (or R-prefixed) and not a count ("30 rows", "2 tests")
      if (!/^R/.test(c[1]) && c[1].replace(/\D/g, "").length < 2) break;
      if (/^\s+(?:rows?|tests?|files?|gaps?|cases?|lines?|commits?|items?|checks?|students?|ms|px|%|more|other|others)\b/i.test(tail.slice(c[0].length))) break;
      out.push({ prefix, num: c[1], bare: true });
      consumed += c[0].length; tail = tail.slice(c[0].length);
      const r2 = /^\s*\.\.\s*(R?\d+)(?![\w-])/.exec(tail);
      if (r2) {
        const a = Number(/(\d+)/.exec(c[1])[1]), b = Number(/(\d+)/.exec(r2[1])[1]);
        for (let n = a + 1; n <= b && n - a < 200; n++) out.push({ prefix, num: String(n).padStart(2, "0"), bare: true });
        consumed += r2[0].length; tail = tail.slice(r2[0].length);
      }
    }
    GEN.lastIndex = end + consumed;
  }
  const ids = [];
  for (const o of out) {
    const cands = [`${o.prefix}-${o.num}`, `${o.prefix}-${pad2(o.num)}`];
    const hit = cands.find((c) => byId.has(c));
    if (hit) ids.push(hit);
    else parseIssues.push({ kind: o.bare ? "list-number-not-in-register" : "not-in-register", id: cands[0], where });
  }
  return [...new Set(ids)];
}

if (process.argv[2] === "--selftest-ids") { console.log(JSON.stringify(extractIds(process.argv[3] || "", "selftest")), JSON.stringify(parseIssues)); process.exit(0); }
const trackerOk = (() => { try { git(["rev-parse", "--verify", "-q", MAIN_REF]); return true; } catch { return false; } })();
if (!trackerOk) notes.push(`Closure tracking skipped: ref ${MAIN_REF} not found (run git fetch origin).`);
const NOISE_TYPE = /^(docs|chore|audit)(\(|:|!)/i;
function readCommits(range, extra) {
  const fmt = "%x01%H%x02%cI%x02%P%x02%s%x02%b%x03";
  const raw = git(["log", ...range, ...extra, "--name-only", `--format=${fmt}`]);
  const res = [];
  for (const chunk of raw.split("\x01").slice(1)) {
    const [head, filesPart] = chunk.split("\x03");
    const [sha, date, parents, subject, body] = head.split("\x02");
    const files = (filesPart || "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    const isMerge = (parents || "").trim().split(/\s+/).length > 1;
    // documentation and audit housekeeping commits list gap IDs without fixing them
    if (NOISE_TYPE.test(subject)) continue;
    if (!isMerge && files.length && files.every((f) => /^(docs\/|scripts\/audit\/)/.test(f))) continue;
    res.push({ sha, date, subject, body: body || "", isMerge });
  }
  return res;
}
const cites = new Map(); // id -> {main:[], branch:[]}
const getCite = (id) => { if (!cites.has(id)) cites.set(id, { main: [], branch: [] }); return cites.get(id); };
const shaLane = new Map(); // sha -> lane branch that carries it
if (trackerOk) {
  const mainCommits = readCommits([MAIN_REF], [`--since=${TRACK_SINCE}`]);
  const brs = git(["for-each-ref", "--format=%(refname:short)", "refs/remotes/origin/chatgpt/"]).split(/\r?\n/).filter((b) => /\/chat-\d+$/.test(b));
  for (const b of brs) {
    const lane = /(chat-\d+)$/.exec(b)[1];
    try { for (const sha of git(["rev-list", b, `--since=${TRACK_SINCE}`]).split(/\r?\n/).filter(Boolean)) if (!shaLane.has(sha)) shaLane.set(sha, lane); } catch { /* ignore */ }
  }
  for (const c of mainCommits) {
    for (const id of extractIds(`${c.subject}\n${c.body}`, `main ${c.sha.slice(0, 9)}`)) getCite(id).main.push({ sha: c.sha, date: c.date, subject: c.subject, merge: c.isMerge, lane: shaLane.get(c.sha) || null });
  }
  for (const b of brs) {
    const lane = /(chat-\d+)$/.exec(b)[1];
    let bc = [];
    try { bc = readCommits([`${MAIN_REF}..${b}`], []); } catch { /* ignore */ }
    for (const c of bc) for (const id of extractIds(`${c.subject}\n${c.body}`, `${lane} ${c.sha.slice(0, 9)}`)) getCite(id).branch.push({ lane, sha: c.sha, date: c.date, subject: c.subject });
  }
}

// Evidence: tests and acceptance reports in the checked-out tree (origin/main when run by refresh-tracker.sh).
const evidence = new Map(); // id -> {tests:Set, acceptance:Set}
const addEv = (id, kind, f) => { if (!evidence.has(id)) evidence.set(id, { tests: new Set(), acceptance: new Set() }); evidence.get(id)[kind].add(f); };
function walk(dir, exts, cb) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, exts, cb);
    else if (exts.test(e.name)) cb(full);
  }
}
walk(path.join(root, "tests"), /\.(m?[jt]sx?|cjs|sql|json)$/, (f) => {
  const rel = path.relative(root, f).split(path.sep).join("/");
  for (const id of extractIds(fs.readFileSync(f, "utf8"), rel)) addEv(id, "tests", rel);
});
walk(path.join(root, "docs", "audit", "acceptance"), /\.md$/, (f) => {
  const rel = path.relative(root, f).split(path.sep).join("/");
  for (const id of extractIds(fs.readFileSync(f, "utf8"), rel)) addEv(id, "acceptance", rel);
});

const STATUSES = ["OPEN", "IN-BRANCH", "FIXED-ON-MAIN", "VERIFIED", "UNCONFIRMED", "WRONG", "CLOSED-SINCE"];
const byDateDesc = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
for (const g of gaps) {
  g.reviewStatus = g.status;
  g.fixedBy = ""; g.fixedAt = ""; g.firstFixedAt = ""; g.fixedLane = ""; g.verifiedBy = []; g.trackNote = "";
  const c = cites.get(g.id);
  const ev = evidence.get(g.id);
  if (c && c.main.length) {
    const sorted = [...c.main].sort(byDateDesc);
    g.fixedBy = sorted[0].sha.slice(0, 9); g.fixedAt = sorted[0].date;
    g.firstFixedAt = sorted[sorted.length - 1].date;
    g.fixedLane = (sorted.find((x) => x.lane) || {}).lane || "";
    if (g.reviewStatus === "WRONG") g.trackNote = `Cited on main (${g.fixedBy}) but a review marks the Round A claim WRONG; status left WRONG.`;
    else {
      g.status = "FIXED-ON-MAIN";
      if (g.reviewStatus !== "OPEN") g.trackNote = `Review status was ${g.reviewStatus}; a commit cites it on main.`;
    }
  } else if (c && c.branch.length && g.reviewStatus !== "WRONG" && g.reviewStatus !== "CLOSED-SINCE") {
    const sorted = [...c.branch].sort(byDateDesc);
    g.status = "IN-BRANCH";
    g.fixedBy = sorted[0].sha.slice(0, 9); g.fixedAt = sorted[0].date; g.firstFixedAt = sorted[sorted.length - 1].date; g.fixedLane = sorted[0].lane;
  }
  if (ev) {
    g.verifiedBy = [...ev.tests, ...ev.acceptance].sort();
    if (g.status === "FIXED-ON-MAIN") g.status = "VERIFIED";
    else if (g.status === "OPEN" || g.status === "UNCONFIRMED" || g.status === "IN-BRANCH") g.trackNote = `${g.trackNote} Mentioned in ${g.verifiedBy[0]} but not cited by a commit on main; not marked VERIFIED.`.trim();
  }
}
const isLive = (g) => g.status === "OPEN" || g.status === "UNCONFIRMED" || g.status === "IN-BRANCH";
const effLane = (g) => (g.fixedLane && g.status !== "OPEN" ? g.fixedLane : g.lane);

// ---- Output ------------------------------------------------------------------
const esc = (s) => (s || "").replace(/\|/g, "\\|");
const cut = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "..." : s);
const sevOrder = ["S1", "S2", "S3", "S4", "S?"];
const gapNum = (id) => { const m = /(R?)(\d+)$/.exec(id); return m ? (m[1] ? 1000 : 0) + Number(m[2]) : 0; };
const stamp = new Date().toISOString().slice(0, 10);

let reg = `# Gap register (phase 2 page audit)\n\nGenerated by \`node scripts/audit/build-gap-register.mjs\` on ${stamp}. Do not edit by hand: re-run the script as Round R reviews arrive.\n\n`;
reg += `Sources: Round A gap rows in \`docs/audit/pages/<account>/*.md\`, Round R verdicts and MISSED rows in \`*-review.md\`.\n\n`;
reg += `Status: **OPEN** (confirmed or not yet reviewed), **UNCONFIRMED** (a row or review says it needs a live or database check; still counted as open work), **CLOSED-SINCE** (a review says it is already fixed on main), **WRONG** (a review says the Round A claim is incorrect). Severity is the review's value where a review changed it (see the Severity column notes below the table). Source "A" = Round A, "R" = Round R MISSED row (ID contains R).\n\n`;
reg += `Closure statuses (from git history since ${TRACK_SINCE}, see docs/audit/README.md): **IN-BRANCH** (a commit on an origin/chatgpt/chat-N lane branch cites the ID, not yet on main), **FIXED-ON-MAIN** (a commit on origin/main cites the ID; "Fixed by" is the latest citing commit), **VERIFIED** (FIXED-ON-MAIN plus a test under tests/ or an acceptance report under docs/audit/acceptance/ that names the ID; listed in the notes). A citation overrides OPEN, UNCONFIRMED and CLOSED-SINCE; WRONG stays WRONG. Open work = OPEN + UNCONFIRMED + IN-BRANCH.\n\n`;
reg += `Proposed lanes: TPO recruiters, companies, campaigns, inbox-team -> chat-2; TPO drives, drive-workspace, batches, students, requests-verification -> chat-5; TPO home, settings-audit, calendar-reports, college/*, superadmin/* -> chat-9; recruiter, learner, faculty, mentor, public -> chat-7 (chat-4 can take over faculty, chat-11 mentor/projects).\n\n`;

const totals = {};
for (const account of ACCOUNTS) {
  const ag = gaps.filter((g) => g.account === account).sort((a, b) => a.page.localeCompare(b.page) || gapNum(a.id) - gapNum(b.id));
  const t = { total: ag.length, S1: 0, S2: 0, S3: 0, S4: 0, "S?": 0, ...Object.fromEntries(STATUSES.map((x) => [x, 0])), openLive: 0, openBySev: { S1: 0, S2: 0, S3: 0, S4: 0, "S?": 0 }, roundA: 0, missed: 0 };
  for (const g of ag) { t[g.severity]++; t[g.status]++; if (isLive(g)) { t.openLive++; t.openBySev[g.severity]++; } g.source === "A" ? t.roundA++ : t.missed++; }
  totals[account] = t;
  reg += `## ${account} (${t.total} rows: ${t.roundA} Round A + ${t.missed} MISSED; ${t.openLive} open or unconfirmed)\n\n`;
  reg += "| ID | Page | Gap | Type | Severity | Status | Proposed lane | Source file | Fixed by |\n|---|---|---|---|---|---|---|---|---|\n";
  for (const g of ag) {
    const sev = g.severity + (g.severity_note ? "*" : "");
    reg += `| ${g.id} | ${g.page} | ${esc(cut(g.gap, 140))} | ${esc(g.type)} | ${sev} | ${g.status} | ${g.lane} | ${g.file.replace("docs/audit/pages/", "")} | ${g.fixedBy ? (g.status === "IN-BRANCH" ? g.fixedLane + ":" : "") + g.fixedBy : ""} |\n`;
  }
  const withNotes = ag.filter((g) => g.severity_note || ((g.status === "WRONG" || g.status === "CLOSED-SINCE") && g.review_note) || g.trackNote || g.verifiedBy.length);
  if (withNotes.length) {
    reg += `\nReview notes (\`*\` after a severity marks a review severity change):\n\n`;
    for (const g of withNotes) {
      if (g.severity_note) reg += `- ${g.id} severity_note: ${cut(g.severity_note, 300)}\n`;
      if (g.trackNote) reg += `- ${g.id} tracker: ${g.trackNote}\n`;
      if (g.verifiedBy.length) reg += `- ${g.id} verified by: ${g.verifiedBy.join(", ")}\n`;
      if (g.status === "WRONG" || g.status === "CLOSED-SINCE") reg += `- ${g.id} ${g.status}: ${cut(g.review_note, 300)}\n`;
    }
  }
  reg += "\n";
}
fs.writeFileSync(outRegister, reg.replace(/\n{3,}/g, "\n\n"));

// PROGRESS
const nowIso = new Date().toISOString();
function cnt(list) { const c = Object.fromEntries(STATUSES.map((x) => [x, 0])); c.total = list.length; for (const g of list) c[g.status]++; return c; }
function trackerSections() {
  let o = `## Closure status (git citations since ${TRACK_SINCE})\n\nOpen work = OPEN + UNCONFIRMED + IN-BRANCH. Closed % = (FIXED-ON-MAIN + VERIFIED + CLOSED-SINCE) / (all rows minus WRONG). How statuses work: \`docs/audit/README.md\`.\n\n`;
  const row = (label, list) => { const c = cnt(list); return `| ${label} | ${c.total} | ${STATUSES.map((k) => c[k]).join(" | ")} | ${pctClosed(c)} |\n`; };
  const head = (first) => `| ${first} | Rows | ${STATUSES.join(" | ")} | Closed % |\n|${"---|".repeat(STATUSES.length + 3)}\n`;
  o += `### By account\n\n` + head("Account") + ACCOUNTS.map((a) => row(a, gaps.filter((g) => g.account === a))).join("") + row("**all**", gaps) + "\n";
  o += `### By severity\n\n` + head("Severity") + sevOrder.filter((v) => gaps.some((g) => g.severity === v)).map((v) => row(v, gaps.filter((g) => g.severity === v))).join("") + "\n";
  const lanes = [...new Set(gaps.map(effLane))].sort();
  o += `### By lane\n\nLane = the lane branch that carried the latest citing commit when known, else the proposed lane.\n\n` + head("Lane") + lanes.map((l) => row(l, gaps.filter((g) => effLane(g) === l))).join("") + "\n";
  o += `### Throughput per lane\n\nGaps fixed = gaps whose first citing commit (main or lane branch) falls in the window. Last 24 h is measured to the generation time (${nowIso}).\n\n`;
  const day = (d) => d.slice(0, 10);
  const fixedGaps = gaps.filter((g) => g.firstFixedAt && (g.status === "FIXED-ON-MAIN" || g.status === "VERIFIED" || g.status === "IN-BRANCH"));
  const days = [...new Set(fixedGaps.map((g) => day(g.firstFixedAt)))].sort();
  const since24 = Date.now() - 24 * 3600 * 1000;
  o += `| Lane | Last 24 h | ${days.join(" | ")} | Total |\n|---|---|${days.map(() => "---|").join("")}---|\n`;
  for (const l of lanes) {
    const fl = fixedGaps.filter((g) => effLane(g) === l);
    if (!fl.length) continue;
    o += `| ${l} | ${fl.filter((g) => Date.parse(g.firstFixedAt) >= since24).length} | ${days.map((d) => fl.filter((g) => day(g.firstFixedAt) === d).length).join(" | ")} | ${fl.length} |\n`;
  }
  o += `| **all** | ${fixedGaps.filter((g) => Date.parse(g.firstFixedAt) >= since24).length} | ${days.map((d) => fixedGaps.filter((g) => day(g.firstFixedAt) === d).length).join(" | ")} | ${fixedGaps.length} |\n\n`;
  const recent = gaps.filter((g) => g.status === "FIXED-ON-MAIN" || g.status === "VERIFIED").sort((a, b) => (a.fixedAt < b.fixedAt ? 1 : -1)).slice(0, 20);
  o += `### 20 most recent fixes on main\n\n| ID | Severity | Status | Fixed by | Date |\n|---|---|---|---|---|\n` + recent.map((g) => `| ${g.id} | ${g.severity} | ${g.status} | ${g.fixedBy} | ${g.fixedAt.slice(0, 16).replace("T", " ")} |\n`).join("") + "\n";
  const tr = parseIssues.filter((i, k, a) => a.findIndex((x) => x.kind === i.kind && x.id === i.id) === k);
  o += `### Citation parse problems\n\n${tr.length ? tr.slice(0, 80).map((i) => `- ${i.kind}: ${i.id} (${i.where})`).join("\n") + (tr.length > 80 ? `\n- ... ${tr.length - 80} more` : "") : "None."}\n\n`;
  return o;
}
const pctClosed = (t) => { const d = t.total - t.WRONG; return d > 0 ? (((t["FIXED-ON-MAIN"] + t.VERIFIED + t["CLOSED-SINCE"]) / d) * 100).toFixed(1) + "%" : "n/a"; };
const sum = (f) => ACCOUNTS.reduce((a, k) => a + f(totals[k]), 0);
let pr = `# Phase 2 audit progress\n\nGenerated by \`node scripts/audit/build-gap-register.mjs\` on ${stamp}. Re-run after each review lands. Detail: \`gap-register.md\`; decisions: \`owner-decisions.md\`; live checks: \`live-check-list.md\`.\n\n`;
pr += `Rounds: Round 0 done; Round A done for all accounts; Round R (independent adversarial review per page) in progress. Re-audit threshold: discrepancy rate above 15%.\n\n`;
pr += `## Counts per account\n\n| Account | Pages audited | Pages reviewed | Rows | Round A | MISSED | S1 | S2 | S3 | S4 | OPEN | IN-BRANCH | FIXED-ON-MAIN | VERIFIED | UNCONFIRMED | CLOSED-SINCE | WRONG | Open work | Closed % |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
for (const a of ACCOUNTS) {
  const t = totals[a]; const ps = pages.filter((p) => p.account === a);
  pr += `| ${a} | ${ps.length} | ${ps.filter((p) => p.reviewFile).length} | ${t.total} | ${t.roundA} | ${t.missed} | ${t.S1} | ${t.S2} | ${t.S3} | ${t.S4} | ${t.OPEN} | ${t["IN-BRANCH"]} | ${t["FIXED-ON-MAIN"]} | ${t.VERIFIED} | ${t.UNCONFIRMED} | ${t["CLOSED-SINCE"]} | ${t.WRONG} | ${t.openLive} | ${pctClosed(t)} |\n`;
}
pr += `| **all** | ${pages.length} | ${pages.filter((p) => p.reviewFile).length} | ${sum((t) => t.total)} | ${sum((t) => t.roundA)} | ${sum((t) => t.missed)} | ${sum((t) => t.S1)} | ${sum((t) => t.S2)} | ${sum((t) => t.S3)} | ${sum((t) => t.S4)} | ${sum((t) => t.OPEN)} | ${sum((t) => t["IN-BRANCH"])} | ${sum((t) => t["FIXED-ON-MAIN"])} | ${sum((t) => t.VERIFIED)} | ${sum((t) => t.UNCONFIRMED)} | ${sum((t) => t["CLOSED-SINCE"])} | ${sum((t) => t.WRONG)} | ${sum((t) => t.openLive)} | ${pctClosed(cnt(gaps))} |\n\n`;
pr += `Severity counts are after review severity changes and include every row regardless of status. Open + unconfirmed by severity (all accounts): S1 ${sum((t) => t.openBySev.S1)}, S2 ${sum((t) => t.openBySev.S2)}, S3 ${sum((t) => t.openBySev.S3)}, S4 ${sum((t) => t.openBySev.S4)}${sum((t) => t.openBySev["S?"]) ? `, unparsed ${sum((t) => t.openBySev["S?"])}` : ""}.\n\n`;

pr += trackerSections();
pr += `## Per page\n\n| Account | Page | Audited | Reviewed | Rows | S1 | S2 | S3 | S4 | Open + unconfirmed | Discrepancy rate | Over 15% |\n|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
const rateOf = (p) => reviews.find((r) => r.targets.includes(p));
const over = [];
for (const p of pages) {
  const rv = rateOf(p);
  const c = { S1: 0, S2: 0, S3: 0, S4: 0 }; let open = 0;
  for (const g of p.gaps) { if (c[g.severity] != null) c[g.severity]++; if (isLive(g)) open++; }
  const rate = rv && rv.rate != null ? rv.rate.toFixed(1) + "%" : rv ? "n/a" : "";
  const flag = rv && rv.rate != null && rv.rate > 15 ? "YES" : "";
  if (flag) over.push({ p, rv });
  pr += `| ${p.account} | ${p.slug} | yes | ${p.reviewFile ? "yes" : "no"} | ${p.gaps.length} | ${c.S1} | ${c.S2} | ${c.S3} | ${c.S4} | ${open} | ${rate} | ${flag} |\n`;
}
pr += `\n## Pages whose discrepancy rate is above 15%\n\n`;
if (over.length) { for (const { p, rv } of over) pr += `- ${p.account}/${p.slug}: ${rv.rate}% (${rv.rateLine.slice(0, 200)})\n`; }
else pr += `None yet.\n`;
const reviewed = reviews.filter((r) => r.rate != null);
pr += `\nReviews received: ${reviews.length} of ${pages.length} pages. Mean discrepancy rate across received reviews: ${reviewed.length ? (reviewed.reduce((a, r) => a + r.rate, 0) / reviewed.length).toFixed(1) + "%" : "n/a"}.\n`;
const pend = pages.filter((p) => !p.reviewFile);
pr += `\n## Reviews still pending\n\n${pend.length ? pend.map((p) => `- ${p.account}/${p.slug}`).join("\n") : "None."}\n`;

pr += `\n## Reconciliation with each file's own summary count\n\n| Account | Page | Parsed Round A rows | Count stated in the file | Match |\n|---|---|---|---|---|\n`;
let mism = 0;
for (const p of pages) {
  const parsed = p.gaps.filter((g) => g.source === "A").length;
  const ok = p.selfCount == null ? "n/a (no summary line)" : p.selfCount === parsed ? "yes" : "NO";
  if (p.selfCount != null && p.selfCount !== parsed) { mism++; notes.push(`${p.rel}: file states ${p.selfCount} gaps but ${parsed} rows parsed (summary line: "${p.selfNote}").`); }
  pr += `| ${p.account} | ${p.slug} | ${parsed} | ${p.selfCount ?? ""} | ${ok} |\n`;
}
for (const p of pages) {
  if (!p.selfSev || Object.keys(p.selfSev).length < 4) continue;
  const cnt = { S1: 0, S2: 0, S3: 0, S4: 0 };
  for (const g of p.gaps) if (g.source === "A" && cnt[g.sev0] != null) cnt[g.sev0]++;
  const bad = ["S1", "S2", "S3", "S4"].filter((k) => cnt[k] !== p.selfSev[k]);
  if (bad.length) notes.push(`${p.rel}: severity counts stated in file (S1 ${p.selfSev.S1}, S2 ${p.selfSev.S2}, S3 ${p.selfSev.S3}, S4 ${p.selfSev.S4}) differ from parsed Round A rows (S1 ${cnt.S1}, S2 ${cnt.S2}, S3 ${cnt.S3}, S4 ${cnt.S4}).`);
}
pr += `\nCount mismatches: ${mism}. Files without a summary line cannot be cross-checked (marked n/a).\n`;

pr += `\n## Parser notes\n\n`;
const uniq = [...new Set(notes)];
pr += uniq.length ? uniq.map((n) => `- ${n}`).join("\n") + "\n" : "No parse issues.\n";
pr += `\nParsing rules: gap tables are any table whose header is ID/Gap/Type/Severity (or Sev); the last four cells are Type, Severity, Legacy evidence, vNext evidence so a stray pipe in the gap text is tolerated. Review verdict IDs written as \`-NN\` or \`NN\` are resolved inside the matching Round A file. WRONG verdicts become CLOSED-SINCE when the note says closed, stale, fixed, built or already present on main, otherwise WRONG. A Round A row or review verdict that says UNCONFIRMED (or live check pending) gives status UNCONFIRMED. Review severity changes are read from "S<old> to S<new>" in the verdict row.\n`;
fs.writeFileSync(outProgress, pr);

// ---- tracker-data.json, tracker-summary.json, progress-history.csv -----------
const trackerData = gaps.map((g) => ({
  id: g.id, page: g.page, account: g.account, type: g.type, severity: g.severity, status: g.status,
  lane: effLane(g), proposedLane: g.lane, source: g.source, fixedBy: g.fixedBy || null, fixedAt: g.fixedAt || null,
  verifiedBy: g.verifiedBy, reviewStatus: g.reviewStatus, note: g.trackNote || null,
})).sort((a, b) => a.account.localeCompare(b.account) || a.page.localeCompare(b.page) || gapNum(a.id) - gapNum(b.id));
const laneList = [...new Set(gaps.map(effLane))].sort();
const summary = {
  generatedAt: nowIso, since: TRACK_SINCE, mainRef: MAIN_REF, statuses: STATUSES,
  total: gaps.length, byStatus: cnt(gaps), closedPercent: pctClosed(cnt(gaps)),
  byAccount: Object.fromEntries(ACCOUNTS.map((a) => [a, cnt(gaps.filter((g) => g.account === a))])),
  bySeverity: Object.fromEntries(sevOrder.filter((v) => gaps.some((g) => g.severity === v)).map((v) => [v, cnt(gaps.filter((g) => g.severity === v))])),
  byLane: Object.fromEntries(laneList.map((l) => [l, cnt(gaps.filter((g) => effLane(g) === l))])),
  fixedLast24h: Object.fromEntries(laneList.map((l) => [l, gaps.filter((g) => effLane(g) === l && g.firstFixedAt && ["FIXED-ON-MAIN", "VERIFIED", "IN-BRANCH"].includes(g.status) && Date.parse(g.firstFixedAt) >= Date.now() - 864e5).length])),
  parseProblems: parseIssues.length,
};
fs.writeFileSync(path.join(root, "docs", "audit", "tracker-data.json"), JSON.stringify(trackerData, null, 1) + "\n");
fs.writeFileSync(path.join(root, "docs", "audit", "tracker-summary.json"), JSON.stringify(summary, null, 1) + "\n");
{
  const histFile = path.join(root, "docs", "audit", "progress-history.csv");
  const hdr = "date,time,dimension,key,total," + STATUSES.join(",") + ",closed_pct\n";
  const rows = [["all", "all", cnt(gaps)]];
  for (const a of ACCOUNTS) rows.push(["account", a, cnt(gaps.filter((g) => g.account === a))]);
  for (const v of sevOrder) if (gaps.some((g) => g.severity === v)) rows.push(["severity", v, cnt(gaps.filter((g) => g.severity === v))]);
  for (const l of laneList) rows.push(["lane", l, summary.byLane[l]]);
  const lineOf = (d, t, [dim, key, c]) => [d, t, dim, key, c.total, ...STATUSES.map((k) => c[k]), pctClosed(c).replace("%", "")].join(",");
  const old = fs.existsSync(histFile) ? fs.readFileSync(histFile, "utf8") : "";
  const lastBlock = old.split("\n").filter((l) => l && !l.startsWith("date,")).slice(-rows.length);
  const fresh = rows.map((r) => lineOf("", "", r).split(",").slice(2).join(","));
  const unchanged = lastBlock.length === rows.length && lastBlock.map((l) => l.split(",").slice(2).join(",")).join("\n") === fresh.join("\n");
  if (!unchanged) fs.writeFileSync(histFile, (old || hdr) + rows.map((r) => lineOf(nowIso.slice(0, 10), nowIso.slice(11, 19), r)).join("\n") + "\n");
}


// ---- live-check-list.md -------------------------------------------------------
// Collect every UNCONFIRMED item: row-level markers in gap tables plus the
// UNCONFIRMED sections of audits and reviews. Bucketed by keyword heuristics;
// the source column lets a reader verify the bucket.
const items = []; // {account, page, ref, text, source, line}
const addItem = (account, page, ref, text, source, line) => {
  text = clean(text).replace(/^[-*]\s*/, "").replace(/^\d+\.\s*/, "");
  if (text.length < 12) return;
  if (items.some((i) => i.source === source && i.text === text)) return;
  items.push({ account, page, ref, text: cut(text, 520), source, line });
};
for (const g of gaps) {
  if (g.status !== "UNCONFIRMED" && !/UNCONFIRMED/.test(`${g.gap} ${g.legacy} ${g.vnext}`)) continue;
  const side = /UNCONFIRMED/.test(g.vnext) ? "vnext" : /UNCONFIRMED/.test(g.legacy) ? "legacy" : "gap";
  const cell = g[side === "gap" ? "gap" : side] || "";
  const i = cell.indexOf("UNCONFIRMED");
  let what = i >= 0 ? (cell.length <= 300 ? cell : cell.slice(Math.max(0, i - 120), i + 260)) : "";
  what = what.replace(/UNCONFIRMED:?\s*/g, "(unconfirmed) ");
  addItem(g.account, g.page, g.id, `${cut(g.gap, 90)} | ${side === "gap" ? "in gap" : side + " evidence"}: ${what || "see source row (status set by a review verdict)"}`, g.file.replace("docs/audit/pages/", ""), g.line, side);
}
const pageOfFile = (account, f) => f.replace(/(-review)?\.md$/, "");
for (const account of ACCOUNTS) {
  const dir = path.join(pagesDir, account);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).sort()) {
    if (!f.endsWith(".md")) continue;
    const isRev = f.endsWith("-review.md");
    const lines = readFile(path.join(dir, f));
    const page = pageOfFile(account, f);
    const src = `${account}/${f}`;
    let inSec = false, inList = false;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (/^#{2,3} /.test(l)) { inSec = /UNCONFIRMED|Unconfirmed/.test(l); inList = false; continue; }
      const trig = !l.trim().startsWith("|") && /^\s*(?:[-*]\s*)?\**(UNCONFIRMED|Confirmations needed)/i.test(l);
      if (inSec && l.trim() && !l.trim().startsWith("|---")) {
        if (l.trim().startsWith("|")) { const c = splitRow(l); if (/^(#|id|item)$/i.test(clean(c[0])) ) continue; addItem(account, page, clean(c[0]), c.slice(1).join(" | "), src, i + 1); }
        else if (/^\s*([-*]|\d+\.)\s+/.test(l)) addItem(account, page, "section", l, src, i + 1);
        continue;
      }
      if (trig) {
        const body = l.replace(/^\s*(?:[-*]\s*)?/, "");
        if (!/:\s*$/.test(body)) addItem(account, page, "section", body, src, i + 1);
        let j = i + 1;
        while (j < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[j])) { addItem(account, page, "section", lines[j], src, j + 1); j++; }
      }
    }
  }
}
const bucketOf = (t) => {
  const live = /legacy (stack|dev|site|app|FE|BE|ui|live)|running legacy|legacy.*(rendering|screenshot|compare|stack)|compare (with|against) legacy|old LMS|prod-2026|dev legacy|tenant-dom/i.test(t);
  const db = /DB\d\d_|_READY|\bflags?\b(?! gating)|to_regclass|information_schema|\bselect\b|migrations? (are |is )?(pending|registered)|registered on|dev database|\bdev db\b|\bseed(ed)?\b|\boutbox\b|in_app_notifications|grant row|query the table|env(ironment)? (var|listing)|placement_[a-z_]+|population_count|\brow\b.*\b(table|dev)\b/i.test(t);
  const deploy = /on dev\b|vNext dev|dev site|deployed|sign in as|log in as|open `?\/|375|phone width|mobile|private window|create (a|one|an)\b/i.test(t);
  const code = /\bgrep\b|\brg\b|git diff|\bread\b|inspect|\.tsx?\b|\.java\b|\.mjs\b|code[- ]only|not read|diff against|source/i.test(t);
  const policy = /owner decision|owner to confirm|owner confirm|scope undecided|\bproduct decision\b/i.test(t);
  if (db) return "B";
  if (live) return "A";
  if (deploy) return "B";
  if (policy && !code) return "D";
  if (code) return "C";
  return "A";
};
const bucketTitle = {
  A: "Part 1. Live checks on the deployed old-LMS dev site (read-only; owner signs in)",
  B: "Part 2. Settle from the vNext dev database or deployment (flags, rows, migrations, vNext dev UI)",
  C: "Part 3. Settle by reading code or running the code (no live site, no owner sign-in)",
  D: "Part 4. Policy items recorded as UNCONFIRMED (answer in owner-decisions.md, no check)",
};
let ll = `# Live check list (UNCONFIRMED items)\n\nGenerated by \`node scripts/audit/build-gap-register.mjs\` on ${stamp}. Re-run as audits and reviews change. Owner decision: live checks use the deployed dev site, read-only, and the owner signs in.\n\n`;
ll += `Every item below comes from a row, section or review item marked UNCONFIRMED. Items are bucketed by keywords in their text (the Source column shows the file and line so a bucket can be corrected); a bucket is a first guess, not a verdict. "check" is what to look at, copied from the audit.\n\n`;
ll += `Counts: ${["A", "B", "C", "D"].map((b) => `Part ${b === "A" ? 1 : b === "B" ? 2 : b === "C" ? 3 : 4} ${items.filter((i) => bucketOf(i.text) === b).length}`).join(", ")}; total ${items.length}.\n\n`;
for (const b of ["A", "B", "C", "D"]) {
  const bi = items.filter((i) => bucketOf(i.text) === b);
  ll += `# ${bucketTitle[b]} (${bi.length})\n\n`;
  for (const account of ACCOUNTS) {
    const ai = bi.filter((i) => i.account === account);
    if (!ai.length) continue;
    ll += `## ${account} (${ai.length})\n\n`;
    const pg = [...new Set(ai.map((i) => i.page))];
    for (const p of pg) {
      ll += `### ${account}/${p}\n\n| Ref | What to look at | Source |\n|---|---|---|\n`;
      for (const i of ai.filter((x) => x.page === p)) ll += `| ${i.ref} | ${esc(i.text)} | ${i.source}:${i.line} |\n`;
      ll += "\n";
    }
  }
}
fs.writeFileSync(path.join(root, "docs", "audit", "live-check-list.md"), ll);
console.log(`live-check items: ${items.length} (A ${items.filter((i) => bucketOf(i.text) === "A").length}, B ${items.filter((i) => bucketOf(i.text) === "B").length}, C ${items.filter((i) => bucketOf(i.text) === "C").length}, D ${items.filter((i) => bucketOf(i.text) === "D").length})`);

// console summary
console.log("account      rows  roundA missed  S1  S2  S3  S4  open inbr  fixed verif unconf closed wrong");
for (const a of ACCOUNTS) { const t = totals[a]; console.log(`${a.padEnd(12)} ${String(t.total).padStart(4)} ${String(t.roundA).padStart(6)} ${String(t.missed).padStart(6)} ${String(t.S1).padStart(3)} ${String(t.S2).padStart(3)} ${String(t.S3).padStart(3)} ${String(t.S4).padStart(3)} ${String(t.OPEN).padStart(5)} ${String(t["IN-BRANCH"]).padStart(4)} ${String(t["FIXED-ON-MAIN"]).padStart(6)} ${String(t.VERIFIED).padStart(5)} ${String(t.UNCONFIRMED).padStart(6)} ${String(t["CLOSED-SINCE"]).padStart(6)} ${String(t.WRONG).padStart(5)}`); }
console.log(`ALL          ${sum((t) => t.total)} (roundA ${sum((t) => t.roundA)}, missed ${sum((t) => t.missed)}); S1 ${sum((t) => t.S1)} S2 ${sum((t) => t.S2)} S3 ${sum((t) => t.S3)} S4 ${sum((t) => t.S4)}; reviews ${reviews.length}/${pages.length}`);
console.log("status counts: " + STATUSES.map((k) => k + " " + cnt(gaps)[k]).join(", ") + `; closed ${pctClosed(cnt(gaps))}; citation parse problems ${parseIssues.length}`);
console.log(`parser notes: ${uniq.length}; count mismatches: ${mism}`);
