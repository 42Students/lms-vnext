// Lane dashboard: zero-dependency local server. Collects lane stats from git + small state files and serves a live page.
// Run: node tools/lane-dashboard/server.js   (default http://localhost:8787)
// Generic by design: any workflow can add panels by dropping JSON files into ./state/panels/*.json (see README.md).
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = __dirname;
const cfg = Object.assign(
  {
    port: 8787,
    repo: path.resolve(ROOT, "../.."),
    lanes: 20,
    branch: "chatgpt/chat-{n}-b", // lane branch pattern
    tag: "[chat-{n}]", // commit tag pattern on main
    baseTag: "pre-fix-wave1", // restore point tag for 'since start' stats ("" to disable)
    stalledMinutes: 30,
    fetchEverySec: 60,
    laneIdsFile: "", // optional markdown file with lines like '7: <chat id>' (chat links)
    chatUrl: "https://chatgpt.com/c/{id}",
    title: "Lane dashboard",
  },
  fs.existsSync(path.join(ROOT, "config.json")) ? JSON.parse(fs.readFileSync(path.join(ROOT, "config.json"), "utf8")) : {}
);
const STATE = path.join(ROOT, "state");
fs.mkdirSync(path.join(STATE, "panels"), { recursive: true });

const git = (args, opts = {}) => {
  try { return execFileSync("git", args, { cwd: cfg.repo, encoding: "utf8", maxBuffer: 1 << 26, timeout: 60000, stdio: ["ignore", "pipe", "ignore"], ...opts }); } catch { return ""; }
};
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const tagRe = (n) => new RegExp(cfg.tag.replace(/[[\]]/g, "\\$&").replace("{n}", n).replace(/\\\[/g, "\\["), "");

let cache = { generated: 0, panels: [] };
let lastFetch = 0, heavyAt = 0, heavy = { shortstat: "", total: 0 };
let cpuPrev = os.cpus().map((c) => ({ ...c.times }));

function machine() {
  const now = os.cpus().map((c) => ({ ...c.times }));
  let idle = 0, total = 0;
  now.forEach((t, i) => { const p = cpuPrev[i]; const d = Object.fromEntries(Object.keys(t).map((k) => [k, t[k] - p[k]])); idle += d.idle; total += Object.values(d).reduce((a, b) => a + b, 0); });
  cpuPrev = now;
  return { cpu: total ? Math.round(100 - (100 * idle) / total) : 0, memUsedGb: +((os.totalmem() - os.freemem()) / 1e9).toFixed(1), memTotalGb: +(os.totalmem() / 1e9).toFixed(1) };
}

function laneIds() {
  const out = {};
  if (!cfg.laneIdsFile) return out;
  try { for (const l of fs.readFileSync(cfg.laneIdsFile, "utf8").split("\n")) { const m = l.match(/^(\d+):\s*([0-9a-f-]{20,})/); if (m) out[+m[1]] = m[2]; } } catch {}
  return out;
}

function collect() {
  const now = Date.now() / 1000;
  if (now - lastFetch > cfg.fetchEverySec) { git(["fetch", "-q"]); lastFetch = now; }
  const panels = [];
  // 1) one log call for all lanes
  const logTxt = git(["log", "origin/main", "--since=3 hours ago", "--format=%ct%x09%s"]);
  const per = {}; for (let n = 1; n <= cfg.lanes; n++) per[n] = { c30: 0, c120: 0, last: 0, lastSubject: "" };
  const res = []; for (let n = 1; n <= cfg.lanes; n++) res.push(tagRe(n));
  for (const line of logTxt.split("\n")) {
    if (!line) continue;
    const [t, ...s] = line.split("\t"); const subj = s.join("\t"); const ts = +t;
    for (let n = 1; n <= cfg.lanes; n++) if (res[n - 1].test(subj)) {
      const p = per[n]; if (now - ts < 1800) p.c30++; if (now - ts < 7200) p.c120++; if (ts > p.last) { p.last = ts; p.lastSubject = subj.replace(res[n - 1], "").trim(); } break;
    }
  }
  // 2) last push per lane branch
  const refs = git(["for-each-ref", "--format=%(refname:short) %(committerdate:unix)", "refs/remotes/origin/chatgpt/"]);
  const branchPush = {};
  for (const l of refs.split("\n")) { const m = l.match(/chat-(\d+)-b (\d+)/); if (m) branchPush[+m[1]] = +m[2]; }
  const ids = laneIds();
  const stalledS = cfg.stalledMinutes * 60;
  const lanes = [];
  for (let n = 1; n <= cfg.lanes; n++) {
    const p = per[n]; const last = Math.max(p.last, branchPush[n] || 0); const age = last ? now - last : null;
    const status = age === null ? "unknown" : age > stalledS ? "stalled" : age > stalledS / 2 ? "slow" : "active";
    lanes.push({ lane: n, status, lastAgeSec: age === null ? null : Math.round(age), commits30m: p.c30, commits2h: p.c120, lastCommit: p.lastSubject.slice(0, 110), chat: ids[n] ? cfg.chatUrl.replace("{id}", ids[n]) : "" });
  }
  const counts = lanes.reduce((a, l) => ((a[l.status] = (a[l.status] || 0) + 1), a), {});
  // 3) overall stats (src commit rate sparkline, heavy numbers cached)
  const srcLog = git(["log", "origin/main", "--since=3 hours ago", "--format=%ct", "--", "src", "drizzle"]).split("\n").filter(Boolean).map(Number);
  const buckets = Array.from({ length: 36 }, () => 0);
  for (const ts of srcLog) { const i = 35 - Math.floor((now - ts) / 300); if (i >= 0 && i < 36) buckets[i]++; }
  if (now - heavyAt > 300) {
    heavyAt = now;
    if (cfg.baseTag) {
      heavy.shortstat = git(["diff", "--shortstat", cfg.baseTag, "origin/main", "--", "src", "drizzle"]).trim();
      heavy.total = +git(["rev-list", "--count", `${cfg.baseTag}..origin/main`, "--grep", "\\[chat-"]).trim() || 0;
    }
  }
  const mainLast = git(["log", "origin/main", "-1", "--format=%ct%x09%s"]).trim().split("\t");
  const m = machine();
  const cycle = (() => { try { return fs.readFileSync(cfg.cycleFile || path.join(STATE, "cycle.out"), "utf8"); } catch { return ""; } })();
  const lock = fs.existsSync(cfg.lockFile || path.join(STATE, "merge.lock"));
  const restored = cycle.split("\n").filter((l) => /^(guard-)?restored |swc-restored/.test(l)).map((l) => l.trim());
  const conflicts = (cycle.match(/chat-\d+: CONFLICT/g) || []).length;
  const cycleDone = /== cycle end/.test(cycle);
  panels.push({ id: "overview", title: "Overview", type: "stats", items: [
    { label: "Active lanes", value: `${counts.active || 0}/${cfg.lanes}`, tone: "good" },
    { label: "Slow", value: counts.slow || 0, tone: counts.slow ? "warn" : "" },
    { label: "Stalled", value: counts.stalled || 0, tone: counts.stalled ? "bad" : "" },
    { label: "Src commits (30 min)", value: buckets.slice(-6).reduce((a, b) => a + b, 0) },
    { label: "Lane commits since start", value: heavy.total },
    { label: "Last main commit", value: mainLast[0] ? Math.round((now - +mainLast[0]) / 60) + " min ago" : "-" },
    { label: "Merge cycle", value: lock ? "running" : cycleDone ? "idle" : "unknown", tone: lock ? "warn" : "" },
    { label: "CPU / RAM", value: `${m.cpu}% / ${m.memUsedGb}/${m.memTotalGb} GB`, tone: m.cpu > 70 ? "warn" : "" },
  ], note: heavy.shortstat });
  panels.push({ id: "rate", title: "Source commits per 5 min (last 3 h)", type: "spark", series: buckets });
  const progress = readJson(path.join(STATE, "progress.json"), null);
  if (progress && progress.items) panels.push({ id: "progress", title: progress.title || "Progress", type: "progress", items: progress.items, updated: progress.updated });
  panels.push({ id: "lanes", title: "Lanes", type: "table", columns: [
    { key: "lane", label: "Lane" }, { key: "status", label: "Status", badge: true }, { key: "lastAgeSec", label: "Last activity", fmt: "age" },
    { key: "commits30m", label: "30 min" }, { key: "commits2h", label: "2 h" }, { key: "lastCommit", label: "Last commit" }, { key: "chat", label: "Chat", link: true },
  ], rows: lanes });
  panels.push({ id: "merge", title: "Merge robot", type: "log", lines: [`conflicts retried: ${conflicts}`, ...(restored.length ? restored.map((r) => "reverted (syntax/package): " + r) : ["no files reverted in the last cycle"])] });
  // 4) generic panels from other workflows
  try { for (const f of fs.readdirSync(path.join(STATE, "panels")).sort()) { if (f.endsWith(".json")) { const p = readJson(path.join(STATE, "panels", f), null); if (p && p.type) panels.push({ id: f.replace(/\.json$/, ""), ...p }); } } } catch {}
  const ev = (() => { try { return fs.readFileSync(path.join(STATE, "events.log"), "utf8").trim().split("\n").slice(-25).reverse(); } catch { return []; } })();
  if (ev.length) panels.push({ id: "events", title: "Event log", type: "log", lines: ev });
  cache = { generated: Date.now(), title: cfg.title, panels };
}

function safeCollect() { try { collect(); } catch (e) { cache.error = String(e.message || e); } }
safeCollect();
setInterval(safeCollect, 15000);

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
http.createServer((req, res) => {
  const url = req.url.split("?")[0];
  if (url === "/api/state") { res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" }); return res.end(JSON.stringify(cache)); }
  const f = path.join(ROOT, "public", url === "/" ? "index.html" : url.replace(/\.\./g, ""));
  if (fs.existsSync(f) && fs.statSync(f).isFile()) { res.writeHead(200, { "content-type": MIME[path.extname(f)] || "text/plain" }); return fs.createReadStream(f).pipe(res); }
  res.writeHead(404); res.end("not found");
}).listen(cfg.port, "127.0.0.1", () => console.log(`${cfg.title}: http://localhost:${cfg.port}`));
