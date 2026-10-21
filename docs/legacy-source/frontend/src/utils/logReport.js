import { normalizeSignature } from "@/utils/logSignature";
import { instantMs } from "@/utils/instant";
import { frameLabel, frameLink, loggerSearchLink, parseAppFrames } from "@/utils/logSourceLinks";

/*
 * Turns exported log lines plus the backend's triage memory into a report meant to be handed to
 * Claude as one file: ranked error groups, who and where each one hit, what was already decided
 * about it, and enough context to go straight to the code and the database.
 */

const NOISE_PATH_PREFIXES = ["/api/v1/superadmin/logs"];
const MAX_GROUPS_IN_DOCUMENT = 30;
const MAX_STACK_LINES = 25;
const SPARK = "▁▂▃▄▅▆▇█";

export const REPO_URL = "https://github.com/42Students/lms";

export const REPORT_INSTRUCTIONS = [
  "You are triaging production errors for the 42LMS platform. This file is the whole briefing: read it top to bottom, then act.",
  "",
  "For each error group below (highest impact first):",
  "1. Read the stack trace and open the linked source line. Confirm the cause in the code; do not guess.",
  "2. Classify it as one of: FIXED (already fixed in the current code), EXPECTED (benign or deliberate), or OPEN (a real bug).",
  "3. For OPEN ones, propose the smallest correct fix and say how you would test it. Use the SQL lines to check the data before you change anything.",
  "4. Anything marked known/muted, or whose status here is EXPECTED, is already decided: skip it unless it is flagged REGRESSION.",
  "",
  "Rules: read-only against production data unless the user says otherwise. Ask before deploying, running migrations, or changing production data.",
  "Finish with a short table: error, verdict (FIXED / EXPECTED / OPEN), one-line reason, and the fix you propose.",
];

export const SYSTEM_CONTEXT = [
  `Backend repo: ${REPO_URL} (Spring Boot, Java 17, MySQL, Flyway). Frontend repo: https://github.com/42Students/lms2-fe (Next.js). Work on branch \`prod-2026\` in both.`,
  "Deploys: pushing to prod-2026 triggers Cloud Build (region asia-east1, triggers prod-2026-lms-be / prod-2026-lms-fe), which runs the full test suite, then rolls out to GKE namespace `lms-prod-2026`.",
  "Database: Cloud SQL instance `root` (project students-384817, asia-south1), schema `lms_prod_2026`. Credentials live in Secret Manager; use them from your project notes, do not paste them anywhere.",
  "Log lines carry: requestId, userId, userType, facultyType, collegeId, organizationId, commit (release), pod. Names are never in the logs; they are looked up for this report only.",
  "Logger names are abbreviated Java class names (c._.l.s.i.Foo = com._42students.lms.service.impl.Foo). The source links below already point at the right file and line where a stack trace exists.",
];

// ---- small helpers -----------------------------------------------------------------------

const safeNumberId = (value) => (/^\d{1,10}$/.test(String(value ?? "")) ? String(value) : null);
const safeSlug = (value) => (/^[A-Za-z0-9_-]{1,80}$/.test(String(value ?? "")) ? String(value) : null);

export function shortCommit(commit) {
  if (!commit || commit === "unknown") return commit || "unknown";
  return String(commit).slice(0, 7);
}

function timeMs(value) {
  return instantMs(value);
}

function isoOrNull(ms) {
  return ms == null ? null : new Date(ms).toISOString();
}

function bump(map, key, by = 1) {
  if (key == null || key === "") return;
  map.set(key, (map.get(key) || 0) + by);
}

function topEntries(map, limit) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export function fence(text) {
  const runs = String(text).match(/`+/g) || [];
  const longest = runs.reduce((max, run) => Math.max(max, run.length), 0);
  const ticks = "`".repeat(Math.max(3, longest + 1));
  return `${ticks}\n${text}\n${ticks}`;
}

export function sparkline(values) {
  if (!values || !values.length) return "";
  const max = Math.max(...values);
  if (max <= 0) return SPARK[0].repeat(values.length);
  return values.map((v) => (v <= 0 ? SPARK[0] : SPARK[Math.max(1, Math.round((v / max) * (SPARK.length - 1)))])).join("");
}

/** Hourly buckets up to 2 days, then daily; returns counts oldest to newest. */
export function trendBuckets(timestamps, sinceMs, untilMs) {
  const span = Math.max(1, untilMs - sinceMs);
  const bucketMs = span <= 2 * 86_400_000 ? 3_600_000 : 86_400_000;
  const count = Math.min(48, Math.max(1, Math.ceil(span / bucketMs)));
  const buckets = new Array(count).fill(0);
  timestamps.forEach((t) => {
    if (t == null || t < sinceMs || t > untilMs) return;
    const index = Math.min(count - 1, Math.floor((t - sinceMs) / bucketMs));
    buckets[index] += 1;
  });
  return buckets;
}

/** Path with numeric and uuid segments collapsed, so /quizzes/96 and /quizzes/97 are one endpoint. */
export function endpointShape(path) {
  if (!path) return "";
  return path
    .split("?")[0]
    .split("/")
    .map((segment) => (/^\d+$/.test(segment) || /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(segment) ? ":id" : segment))
    .join("/");
}

const SLUG_RESOURCES = new Set(["courses", "projects"]);

const PATH_TABLES = {
  quizzes: { table: "quizzes", label: "quiz" },
  lessons: { table: "lesson", label: "lesson" },
  courses: { table: "course", label: "course" },
};

/** Entity ids named in a request path, with a SQL line only where the table is certain. */
export function pathEntities(path) {
  if (!path) return [];
  const segments = path.split("?")[0].split("/").filter(Boolean);
  const found = [];
  segments.forEach((segment, i) => {
    const next = segments[i + 1];
    if (next == null || !/^[a-z-]+$/i.test(segment)) return;
    const numeric = safeNumberId(next);
    // Slugs only follow resources known to use them; otherwise "api/v1" reads as an entity.
    const slug = numeric || !SLUG_RESOURCES.has(segment.toLowerCase()) ? null : safeSlug(next);
    if (!numeric && !slug) return;
    const known = PATH_TABLES[segment.toLowerCase()];
    let sql = null;
    if (known && numeric) sql = `SELECT * FROM ${known.table} WHERE id = ${numeric};`;
    if (known && !numeric && known.table === "course") sql = `SELECT * FROM course WHERE slug = '${slug}';`;
    found.push({ resource: segment.toLowerCase(), id: numeric || slug, sql });
  });
  return found;
}

export function userSql(userType, id) {
  const safe = safeNumberId(id);
  if (!safe || safe === "0") return null;
  if (userType === "LEARNER") return `SELECT * FROM learner WHERE id = ${safe};`;
  if (userType === "FACULTY") return `SELECT * FROM faculty WHERE id = ${safe};`;
  return null;
}

export const collegeSql = (id) => (safeNumberId(id) ? `SELECT * FROM college WHERE id = ${safeNumberId(id)};` : null);
export const classSql = (id) => (safeNumberId(id) ? `SELECT * FROM class WHERE id = ${safeNumberId(id)};` : null);

// ---- grouping ----------------------------------------------------------------------------

function isNoise(entry) {
  const path = entry?.httpPath || "";
  return NOISE_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

const isSlow = (entry) => entry?.message === "http.request.slow";
const isFrontend = (entry) => typeof entry?.message === "string" && entry.message.startsWith("[Frontend]");

export function groupKey(entry) {
  return entry?._sig || normalizeSignature(entry?.message, entry?.httpPath);
}

function classify(known, firstSeenMs, sinceMs) {
  if (known?.regressedAt) return "REGRESSION";
  const knownFirst = known?.firstSeenAt ? timeMs(known.firstSeenAt) : null;
  if (knownFirst != null ? knownFirst >= sinceMs : known == null) return "NEW";
  return "SEEN_BEFORE";
}

/**
 * @param {object} input
 *  entries       exported log entries (each may carry a precomputed `_sig`)
 *  since/until   ISO strings for the report range
 *  environment   PRODUCTION | DEVELOPMENT | UAT
 *  knownErrors   backend known-errors rows (matched by signatureHash)
 *  deploys       [{at, commit, pods, health?}]
 *  context       {users:[], colleges:[]} name lookups
 *  issues        open tracker issues
 *  previousTotal error count for the previous equal period (optional)
 */
export function buildReportModel({
  entries = [],
  since,
  until,
  environment = "PRODUCTION",
  level = "ERROR",
  knownErrors = [],
  deploys = [],
  context = {},
  issues = [],
  previousTotal = null,
  truncated = false,
}) {
  const sinceMs = timeMs(since);
  const untilMs = timeMs(until);
  const known = new Map(knownErrors.map((row) => [row.signatureHash, row]));
  const users = new Map((context.users || []).map((u) => [`${u.userType}#${u.id}`, u]));
  const colleges = new Map((context.colleges || []).map((c) => [String(c.id), c]));

  const excluded = { tooling: 0, muted: [], mutedCount: 0 };
  const slowEntries = [];
  const frontendEntries = [];
  const groups = new Map();
  let totalEvents = 0;

  entries.forEach((entry) => {
    if (isNoise(entry)) {
      excluded.tooling += 1;
      return;
    }
    if (isSlow(entry)) {
      slowEntries.push(entry);
      return;
    }
    const key = groupKey(entry);
    const knownRow = known.get(key);
    if (knownRow?.muted && knownRow.fixStatus !== "FIXED" && !knownRow.regressedAt) {
      excluded.mutedCount += 1;
      const existing = excluded.muted.find((m) => m.id === knownRow.id);
      if (existing) existing.count += 1;
      else excluded.muted.push({ id: knownRow.id, message: knownRow.sampleMessage, reason: knownRow.mutedReason, status: knownRow.fixStatus, count: 1 });
      return;
    }
    if (isFrontend(entry)) frontendEntries.push(entry);
    totalEvents += 1;
    if (!groups.has(key)) groups.set(key, { key, entries: [] });
    groups.get(key).entries.push(entry);
  });

  const built = [...groups.values()].map(({ key, entries: list }) => {
    const times = list.map((e) => timeMs(e.timestamp)).filter((t) => t != null);
    const knownRow = known.get(key) || null;
    const endpoints = new Map();
    const statuses = new Map();
    const userCounts = new Map();
    const collegeCounts = new Map();
    const commits = new Map();
    const pods = new Set();
    const messages = [];
    const requestIds = [];
    let withException = null;
    let severityRank = 0;
    const rank = { WARNING: 1, ERROR: 2, CRITICAL: 3, ALERT: 4, EMERGENCY: 5 };
    let severity = "ERROR";

    list.forEach((e) => {
      if (e.httpPath) bump(endpoints, `${e.httpMethod || "?"} ${endpointShape(e.httpPath)}`);
      if (e.httpStatus) bump(statuses, e.httpStatus);
      if (e.userId && e.userId !== "0") bump(userCounts, `${e.userType || "?"}#${e.userId}`);
      if (e.collegeId) bump(collegeCounts, String(e.collegeId));
      if (e.commit && e.commit !== "unknown") bump(commits, e.commit);
      if (e.pod) pods.add(e.pod);
      if (e.message && messages.length < 3 && !messages.includes(e.message)) messages.push(e.message);
      if (e.requestId && requestIds.length < 3) requestIds.push(e.requestId);
      if (e.exception && (!withException || e.exception.length > withException.exception.length)) withException = e;
      const r = rank[String(e.severity || "").toUpperCase()] || 0;
      if (r > severityRank) {
        severityRank = r;
        severity = String(e.severity).toUpperCase();
      }
    });

    const first = list[0];
    const topEndpoint = topEntries(endpoints, 1)[0]?.[0] || null;
    const sample = withException || first;
    const frames = parseAppFrames(sample.exception);
    const exampleWithPath = list.find((e) => e.httpPath) || null;
    const distinctUsers = userCounts.size;
    const status = classify(knownRow, sinceMs ?? 0, sinceMs ?? 0);
    const latestCommit = topEntries(commits, 1)[0]?.[0] || knownRow?.lastSeenCommit || null;

    const relatedFrontend = topEndpoint
      ? frontendEntries.filter((e) => e.message.includes(endpointShape(exampleWithPath?.httpPath || "")) || (exampleWithPath?.httpPath && e.message.includes(exampleWithPath.httpPath))).length
      : 0;

    const topUsers = topEntries(userCounts, 5).map(([id, count]) => {
      const ctx = users.get(id);
      const college = ctx?.collegeId != null ? colleges.get(String(ctx.collegeId)) : null;
      return { id, count, name: ctx?.displayName || null, className: ctx?.className || null, classId: ctx?.classId ?? null, collegeId: ctx?.collegeId ?? null, collegeName: college?.name || null, facultyType: ctx?.facultyType || null };
    });
    const topColleges = topEntries(collegeCounts, 5).map(([id, count]) => ({ id, count, name: colleges.get(id)?.name || null }));

    const sqlLines = [];
    topUsers.slice(0, 3).forEach((u) => {
      const [type, id] = u.id.split("#");
      const line = userSql(type, id);
      if (line) sqlLines.push(line);
    });
    topColleges.slice(0, 2).forEach((c) => {
      const line = collegeSql(c.id);
      if (line) sqlLines.push(line);
    });
    topUsers.filter((u) => u.classId != null).slice(0, 1).forEach((u) => {
      const line = classSql(u.classId);
      if (line) sqlLines.push(line);
    });
    const entities = pathEntities(exampleWithPath?.httpPath);
    entities.forEach((entity) => {
      if (entity.sql) sqlLines.push(entity.sql);
    });

    const impact =
      (status === "REGRESSION" ? 1_000_000 : 0) + (status === "NEW" ? 100_000 : 0) + distinctUsers * 100 + Math.min(list.length, 99);

    return {
      key,
      knownId: knownRow?.id ?? null,
      known: knownRow,
      status,
      severity,
      count: list.length,
      firstSeen: isoOrNull(times.length ? Math.min(...times) : null),
      lastSeen: isoOrNull(times.length ? Math.max(...times) : null),
      trend: trendBuckets(times, sinceMs ?? Math.min(...times), untilMs ?? Math.max(...times)),
      logger: first.logger || null,
      message: first.message,
      sampleMessages: messages,
      endpoints: topEntries(endpoints, 5),
      statuses: topEntries(statuses, 4),
      distinctUsers,
      topUsers,
      topColleges,
      commits: topEntries(commits, 4),
      latestCommit,
      pods: [...pods].slice(0, 4),
      requestIds,
      exception: sample.exception || null,
      frames,
      logSearch: frames.length ? null : loggerSearchLink(first.logger),
      reproduce: exampleWithPath ? `${exampleWithPath.httpMethod || "GET"} ${exampleWithPath.httpPath}${exampleWithPath.httpStatus ? ` -> HTTP ${exampleWithPath.httpStatus}` : ""}` : null,
      pathEntities: entities,
      relatedFrontend,
      sqlLines: [...new Set(sqlLines)],
      impact,
    };
  });

  built.sort((a, b) => b.impact - a.impact);

  // Slow endpoints (successful but over the backend's slow-request threshold).
  const slowByEndpoint = new Map();
  slowEntries.forEach((e) => {
    const key = `${e.httpMethod || "?"} ${endpointShape(e.httpPath)}`;
    const record = slowByEndpoint.get(key) || { endpoint: key, count: 0, max: 0, total: 0 };
    const duration = Number(e.durationMs) || 0;
    record.count += 1;
    record.max = Math.max(record.max, duration);
    record.total += duration;
    slowByEndpoint.set(key, record);
  });
  const slow = [...slowByEndpoint.values()]
    .map((r) => ({ ...r, avg: Math.round(r.total / r.count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const allUsers = new Set();
  built.forEach((g) => g.topUsers.forEach((u) => allUsers.add(u.id)));

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    environment,
    level,
    since,
    until,
    truncated,
    totalEvents,
    previousTotal,
    groups: built,
    newTypes: built.filter((g) => g.status === "NEW").length,
    regressions: built.filter((g) => g.status === "REGRESSION").length,
    distinctUsersSeen: allUsers.size,
    top3: built.slice(0, 3).map((g) => g.key),
    excluded,
    slow,
    deploys,
    issues,
    frontendErrorCount: frontendEntries.length,
  };
}

// ---- markdown ----------------------------------------------------------------------------

const fmtTime = (iso) => (iso ? `${iso.replace("T", " ").replace(/\.\d+Z$/, "").replace("Z", "")} UTC` : "unknown");

function statusLine(group) {
  const k = group.known;
  const parts = [];
  if (group.status === "REGRESSION") parts.push(`**REGRESSION**: marked fixed${k?.fixedInCommit ? ` in \`${shortCommit(k.fixedInCommit)}\`` : ""} but seen again${k?.regressedAt ? ` (${fmtTime(k.regressedAt)})` : ""}`);
  else if (group.status === "NEW") parts.push("**NEW** in this period");
  else parts.push("seen before");
  if (k?.fixStatus === "FIXED" && group.status !== "REGRESSION") parts.push(`decision: FIXED${k.fixedInCommit ? ` in \`${shortCommit(k.fixedInCommit)}\`` : ""}`);
  if (k?.fixStatus === "EXPECTED") parts.push("decision: EXPECTED");
  if (k?.muted) parts.push(`muted${k.mutedReason ? ` (${k.mutedReason})` : ""}`);
  if (k?.statusNote) parts.push(`note: ${k.statusNote}`);
  if (k?.issuePublicId) parts.push(`tracker issue ${k.issuePublicId}`);
  return parts.join(" · ");
}

function limitLines(text, max) {
  const lines = String(text).split("\n");
  return lines.length <= max ? text : `${lines.slice(0, max).join("\n")}\n... (${lines.length - max} more lines)`;
}

export function renderGroup(group, index, { ref = "prod-2026" } = {}) {
  const out = [];
  out.push(`### ${index}. ${group.message.split("\n")[0].slice(0, 160)}`);
  out.push("");
  out.push(`- **Status:** ${statusLine(group)}`);
  out.push(`- **Count:** ${group.count} · **first** ${fmtTime(group.firstSeen)} · **last** ${fmtTime(group.lastSeen)} · trend \`${sparkline(group.trend)}\``);
  out.push(`- **Severity:** ${group.severity}${group.logger ? ` · **logger:** \`${group.logger}\`` : ""}`);
  if (group.endpoints.length) out.push(`- **Endpoints:** ${group.endpoints.map(([e, c]) => `\`${e}\` ×${c}`).join(", ")}${group.statuses.length ? ` (HTTP ${group.statuses.map(([s, c]) => `${s} ×${c}`).join(", ")})` : ""}`);
  if (group.distinctUsers) {
    out.push(`- **Impact:** ${group.distinctUsers} distinct user${group.distinctUsers === 1 ? "" : "s"}`);
    group.topUsers.forEach((u) => {
      const where = [u.className && `class ${u.className}${u.classId != null ? ` (#${u.classId})` : ""}`, (u.collegeName || u.collegeId != null) && `college ${u.collegeName || ""}${u.collegeId != null ? ` (#${u.collegeId})` : ""}`.replace("college  ", "college ")].filter(Boolean).join(", ");
      out.push(`  - ${u.id}${u.name ? ` ${u.name}` : ""}${u.facultyType ? ` [${u.facultyType}]` : ""} ×${u.count}${where ? ` — ${where}` : ""}`);
    });
  } else {
    out.push("- **Impact:** user unknown (errors logged before this deploy carry no user ids, or happened outside a login)");
  }
  if (group.topColleges.length) out.push(`- **Colleges:** ${group.topColleges.map((c) => `${c.name || "college"} (#${c.id}) ×${c.count}`).join(", ")}`);
  if (group.commits.length) out.push(`- **Release(s):** ${group.commits.map(([c, n]) => `\`${shortCommit(c)}\` ×${n}`).join(", ")}`);
  if (group.pathEntities.length) out.push(`- **Ids in the request path:** ${group.pathEntities.map((p) => `${p.resource}=${p.id}`).join(", ")}`);
  if (group.reproduce) out.push(`- **Reproduce:** \`${group.reproduce}\``);
  if (group.relatedFrontend) out.push(`- **Same incident seen from the browser:** ${group.relatedFrontend} frontend error report(s) mention this endpoint`);
  if (group.requestIds.length) out.push(`- **Request ids:** ${group.requestIds.map((r) => `\`${r}\``).join(", ")}`);

  if (group.frames.length) {
    out.push("- **Source:**");
    group.frames.slice(0, 3).forEach((f) => out.push(`  - [${frameLabel(f)}](${frameLink(f, ref)})`));
  } else if (group.logSearch) {
    out.push(`- **Source:** no stack trace; [search the repo for the logger](${group.logSearch})`);
  }

  const samples = group.sampleMessages.filter((m) => m !== group.message).slice(0, 2);
  out.push("", "**Message**", fence(group.message.slice(0, 1500)));
  samples.forEach((m) => out.push(fence(m.slice(0, 600))));
  if (group.exception) out.push("", "**Stack trace**", fence(limitLines(group.exception, MAX_STACK_LINES)));
  if (group.sqlLines.length) out.push("", "**Check the data**", fence(group.sqlLines.join("\n")));
  out.push("");
  return out.join("\n");
}

export function renderReportMarkdown(model, { ref } = {}) {
  const out = [];
  const lastDeploy = model.deploys && model.deploys[0];
  const releaseRef = ref || lastDeploy?.commit || "prod-2026";
  out.push(`# 42LMS log triage report — ${model.environment}`, "");
  out.push(`Range: ${fmtTime(model.since)} to ${fmtTime(model.until)} · level ${model.level} · generated ${fmtTime(model.generatedAt)}`, "");
  out.push("## How to use this report", "", ...REPORT_INSTRUCTIONS, "", "## System context", "", ...SYSTEM_CONTEXT.map((line) => `- ${line}`), "");

  out.push("## Summary", "");
  const delta = model.previousTotal != null ? ` (previous period: ${model.previousTotal}, ${model.totalEvents - model.previousTotal >= 0 ? "+" : ""}${model.totalEvents - model.previousTotal})` : "";
  out.push(`- **${model.totalEvents}** error events in **${model.groups.length}** distinct error types${delta}`);
  out.push(`- **${model.newTypes}** new error type${model.newTypes === 1 ? "" : "s"} · **${model.regressions}** regression${model.regressions === 1 ? "" : "s"} · ${model.distinctUsersSeen} distinct users seen in the top groups`);
  if (model.truncated) out.push("- WARNING: the log export was truncated; counts are a lower bound. Narrow the range for a complete picture.");
  if (model.top3.length) {
    out.push("- **Top by impact:**");
    model.groups.slice(0, 3).forEach((g, i) => out.push(`  ${i + 1}. ${g.message.split("\n")[0].slice(0, 120)} — ${g.count}×, ${g.status.toLowerCase().replace("_", " ")}${g.distinctUsers ? `, ${g.distinctUsers} users` : ""}`));
  }
  out.push("");

  if (model.deploys && model.deploys.length) {
    out.push("## Deploys in this range", "");
    model.deploys.forEach((d) => {
      const h = d.health;
      out.push(`- ${fmtTime(d.at)} — release \`${shortCommit(d.commit)}\` (${d.pods} pod${d.pods === 1 ? "" : "s"})${h ? ` — errors 10 min before ${h.errorsBefore} / after ${h.errorsAfter}${h.capped ? "+" : ""}: **${h.verdict}**` : ""}`);
    });
    out.push("");
  }

  out.push("## Error groups (highest impact first)", "");
  if (!model.groups.length) out.push("No error groups in this range.", "");
  // Line numbers belong to the release that logged the error, so pin each link to that release.
  model.groups.slice(0, MAX_GROUPS_IN_DOCUMENT).forEach((g, i) => out.push(renderGroup(g, i + 1, { ref: g.latestCommit && g.latestCommit !== "unknown" ? g.latestCommit : releaseRef })));
  if (model.groups.length > MAX_GROUPS_IN_DOCUMENT) {
    out.push(`_${model.groups.length - MAX_GROUPS_IN_DOCUMENT} lower-impact groups are omitted; the raw export has them._`, "");
  }

  if (model.slow.length) {
    out.push("## Slow requests (succeeded, but took over 3s)", "");
    model.slow.forEach((s) => out.push(`- \`${s.endpoint}\` ×${s.count}, avg ${s.avg} ms, worst ${s.max} ms`));
    out.push("");
  }

  out.push("## Excluded noise", "");
  out.push(`- Log-tooling requests (\`/api/v1/superadmin/logs*\`): ${model.excluded.tooling} entr${model.excluded.tooling === 1 ? "y" : "ies"} ignored.`);
  out.push(`- Muted known errors: ${model.excluded.mutedCount} occurrence${model.excluded.mutedCount === 1 ? "" : "s"} across ${model.excluded.muted.length} type${model.excluded.muted.length === 1 ? "" : "s"}.`);
  model.excluded.muted.slice(0, 15).forEach((m) => out.push(`  - ×${m.count} ${String(m.message || "").split("\n")[0].slice(0, 110)}${m.reason ? ` — ${m.reason}` : ""}`));
  out.push("");

  if (model.issues && model.issues.length) {
    out.push("## Open tracker issues", "");
    model.issues.slice(0, 20).forEach((issue) => {
      out.push(`- **${issue.publicId}** [${issue.status}] ${[issue.page, issue.screen, issue.section].filter(Boolean).join(" › ")} — ${String(issue.description || "").split("\n")[0].slice(0, 160)} (reported by ${issue.reporterName})`);
    });
    out.push("");
  }

  out.push("## Appendix", "", "The raw log lines for this range are in the separate `.ndjson` export (one JSON object per line, final line is metadata).", "");
  return out.join("\n");
}

export function reportFilename(model) {
  const stamp = (iso) => String(iso).replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z").slice(0, 13);
  return `lms-report_${model.environment}_${stamp(model.since)}_to_${stamp(model.until)}.md`;
}
