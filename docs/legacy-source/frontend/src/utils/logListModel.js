import { buildReportModel, renderGroup, shortCommit } from "@/utils/logReport";
import { instantMs } from "@/utils/instant";

/**
 * Puts deploy markers into a newest-first list at the moment they happened, so "did that release
 * break something?" is answered by scrolling past the line. `rows` are { entry, count } items.
 */
export function interleaveDeploys(rows, deploys, oldestLoadedMs) {
  if (!Array.isArray(rows) || rows.length === 0) return rows || [];
  const markers = (Array.isArray(deploys) ? deploys : [])
    .map((deploy) => ({ deploy, t: instantMs(deploy.at) }))
    .filter((m) => m.t != null)
    .sort((a, b) => b.t - a.t);
  if (markers.length === 0) return rows.map((row) => ({ type: "entry", row }));

  const newest = new Date(rows[0].entry.timestamp).getTime();
  const oldest = new Date(rows[rows.length - 1].entry.timestamp).getTime();
  const out = [];
  let next = 0;
  // Deploys newer than everything shown are not part of this view.
  while (next < markers.length && Number.isFinite(newest) && markers[next].t > newest) next += 1;

  rows.forEach((row) => {
    const t = new Date(row.entry.timestamp).getTime();
    // Entries at or after a deploy stay above its marker; the marker sits before the first older one.
    while (next < markers.length && Number.isFinite(t) && markers[next].t > t) {
      out.push({ type: "deploy", deploy: markers[next].deploy });
      next += 1;
    }
    out.push({ type: "entry", row });
  });
  // Grouped rows are placed by their newest occurrence, so a deploy can sit among older occurrences
  // that are folded into a group. It still belongs in the timeline while it falls within the span
  // that was actually loaded, so it closes the list.
  const limit = Number.isFinite(oldestLoadedMs) ? Math.min(oldestLoadedMs, oldest) : oldest;
  while (next < markers.length && Number.isFinite(limit) && markers[next].t >= limit) {
    out.push({ type: "deploy", deploy: markers[next].deploy });
    next += 1;
  }
  return out;
}

/** The chip a group shows for its tracked decision: label, tone, and a tooltip. */
export function statusChip(known) {
  if (!known) return null;
  if (known.regressedAt) {
    return { label: "Regression", tone: "danger", title: `Marked fixed${known.fixedInCommit ? ` in ${shortCommit(known.fixedInCommit)}` : ""} but it came back` };
  }
  if (known.fixStatus === "FIXED") {
    return { label: known.fixedInCommit ? `Fixed ${shortCommit(known.fixedInCommit)}` : "Fixed", tone: "success", title: known.statusNote || "Marked fixed" };
  }
  if (known.fixStatus === "EXPECTED") return { label: "Expected", tone: "muted", title: known.mutedReason || known.statusNote || "Marked expected" };
  if (known.muted) return { label: "Muted", tone: "muted", title: known.mutedReason || "Muted" };
  return { label: "Open", tone: "warning", title: known.statusNote || "Not yet triaged" };
}

/** A self-contained prompt for one error group, for pasting straight into Claude. */
export function singleGroupPrompt(occurrences, { environment = "PRODUCTION", knownErrors = [], context = {}, deploys = [] } = {}) {
  const times = occurrences.map((e) => new Date(e.timestamp).getTime()).filter(Number.isFinite);
  const since = new Date(times.length ? Math.min(...times) : Date.now()).toISOString();
  const until = new Date((times.length ? Math.max(...times) : Date.now()) + 1000).toISOString();
  const model = buildReportModel({ entries: occurrences, since, until, environment, knownErrors, context, deploys });
  const group = model.groups[0];
  if (!group) return "";
  const lastDeploy = deploys && deploys[0];
  const producedBy = group.latestCommit && group.latestCommit !== "unknown" ? group.latestCommit : null;
  return [
    `Investigate this ${environment.toLowerCase()} error in the 42LMS backend (https://github.com/42Students/lms, branch prod-2026).`,
    "Confirm the cause in the code, say whether it is FIXED / EXPECTED / OPEN, and if OPEN propose the smallest correct fix and how to test it. Use the SQL lines to check data before changing anything; do not deploy without asking.",
    "",
    renderGroup(group, 1, { ref: producedBy || lastDeploy?.commit || "prod-2026" }),
  ].join("\n");
}

/** The tracker-issue payload for a group; mirrors what the manual report form sends. */
export function issuePayloadFor(group, { environment = "PRODUCTION", permalink = null } = {}) {
  const entry = group.entry || group;
  const lines = [
    "Backend error observed in Logs:",
    entry.message || "",
    entry.httpMethod && entry.httpPath ? `Endpoint: ${entry.httpMethod} ${entry.httpPath}${entry.httpStatus ? ` -> HTTP ${entry.httpStatus}` : ""}` : null,
    group.count > 1 ? `Occurrences in the loaded window: ${group.count}` : null,
    entry.userType && entry.userId ? `First seen for: ${entry.userType} #${entry.userId}${entry.collegeId ? `, college #${entry.collegeId}` : ""}` : null,
    entry.commit && entry.commit !== "unknown" ? `Release: ${shortCommit(entry.commit)}` : null,
    entry.timestamp ? `Time: ${entry.timestamp}` : null,
  ].filter(Boolean);
  const path = entry.httpPath || "";
  return {
    reporterName: "Logs (auto)",
    accountRole: "NOT_SURE",
    environment,
    page: "Backend logs",
    screen: path ? path.split("?")[0].slice(0, 120) : null,
    section: entry.logger ? String(entry.logger).slice(0, 120) : null,
    issueType: entry.httpStatus && String(entry.httpStatus).startsWith("5") ? "Server Error / 500" : "Crash / Error",
    description: lines.join("\n").slice(0, 4000),
    severity: group.count >= 10 ? "MAJOR" : "MINOR",
    evidenceLink: permalink,
    sourceUrl: null,
    sourcePath: null,
    browser: null,
    viewport: null,
  };
}
