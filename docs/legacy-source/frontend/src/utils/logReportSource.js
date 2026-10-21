import { exportRangeChunked, parseNdjsonExport } from "@/utils/trackerLogsExport";
import { buildReportModel, renderReportMarkdown, reportFilename } from "@/utils/logReport";
import { normalizeSignature, sha256Hex } from "@/utils/logSignature";
import { instantMs, normalizeDeploy, normalizeKnownError } from "@/utils/instant";

const MAX_CONTEXT_IDS = 100;
const MAX_HEALTH_CHECKS = 3;

/** Entries of an NDJSON export body, parsed, with the metadata line separated. */
export function parseEntries(text) {
  const { entries, meta } = parseNdjsonExport(text);
  const parsed = [];
  entries.forEach((line) => {
    try {
      parsed.push(JSON.parse(line));
    } catch {
      // A line that is not JSON is skipped rather than failing the whole report.
    }
  });
  return { entries: parsed, meta };
}

/** Adds `_sig` (the backend's signature hash) to each entry, hashing each distinct message/path once. */
export async function attachSignatures(entries) {
  const cache = new Map();
  for (const entry of entries) {
    const key = `${entry.message ?? ""}\u0000${entry.httpPath ?? ""}`;
    if (!cache.has(key)) cache.set(key, await sha256Hex(normalizeSignature(entry.message, entry.httpPath)));
    entry._sig = cache.get(key);
  }
  return entries;
}

/** The users and colleges worth naming: the busiest ids first, capped so the lookup stays small. */
export function contextRequestFor(entries) {
  const users = new Map();
  const colleges = new Map();
  entries.forEach((e) => {
    if (e.userId && e.userId !== "0" && (e.userType === "LEARNER" || e.userType === "FACULTY")) {
      const key = `${e.userType}#${e.userId}`;
      users.set(key, (users.get(key) || 0) + 1);
    }
    if (e.collegeId) colleges.set(String(e.collegeId), (colleges.get(String(e.collegeId)) || 0) + 1);
  });
  const top = (map) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_CONTEXT_IDS).map(([k]) => k);
  return {
    users: top(users).map((k) => {
      const [userType, id] = k.split("#");
      return { id: Number(id), userType };
    }),
    collegeIds: top(colleges).map(Number),
  };
}

const quiet = async (promise, fallback) => {
  try {
    return await promise;
  } catch {
    return fallback;
  }
};

/**
 * Gathers everything a report needs and builds it. All network access goes through `api` so this
 * runs unchanged in tests. Any one supporting lookup failing (deploys, names, issues) degrades the
 * report instead of failing it; only the log export itself is essential.
 */
export async function generateReport({
  environment = "PRODUCTION",
  level = "ERROR",
  since,
  until,
  includePrevious = false,
  api,
  onProgress = () => {},
  isCancelled = () => false,
}) {
  const sinceMs = new Date(since).getTime();
  const untilMs = new Date(until).getTime();
  const fetchRange = (from, to, phase) =>
    exportRangeChunked({
      since: from,
      until: to,
      isCancelled,
      onProgress: (p) => onProgress({ phase, ...p }),
      fetchChunk: (chunkSince, chunkUntil) =>
        api.exportLogs({ environment, level, search: "", since: chunkSince, until: chunkUntil, excludeTooling: true }),
    });

  onProgress({ phase: "logs", done: 0, total: 1 });
  const { text: rawText, meta } = await fetchRange(since, until, "logs");
  const { entries } = parseEntries(rawText);
  await attachSignatures(entries);

  onProgress({ phase: "context" });
  const days = Math.max(1, Math.ceil((untilMs - sinceMs) / 86_400_000) + 1);
  const [knownRaw, deploysRaw, issuesPage, context] = await Promise.all([
    quiet(api.getKnownErrors(environment), []),
    quiet(api.getDeploys({ environment, days }), []),
    quiet(api.listBugReports({ page: 0, size: 50, sort: "DESC" }), null),
    quiet(api.getLogContext(contextRequestFor(entries)), { users: [], colleges: [] }),
  ]);

  const knownErrors = (Array.isArray(knownRaw) ? knownRaw : []).map(normalizeKnownError);
  const deploys = (Array.isArray(deploysRaw) ? deploysRaw : [])
    .map(normalizeDeploy)
    .filter((d) => {
      const at = instantMs(d.at);
      return at != null && at >= sinceMs && at <= untilMs;
    })
    .slice(0, 10);
  await Promise.all(
    deploys.slice(0, MAX_HEALTH_CHECKS).map(async (deploy) => {
      deploy.health = await quiet(api.getDeployHealth({ environment, at: deploy.at }), null);
    })
  );

  const issues = ((issuesPage && issuesPage.content) || []).filter(
    (issue) => issue.status !== "CLOSED" && (issue.environment === environment || issue.environment === "NOT_SURE")
  );

  let previousTotal = null;
  if (includePrevious && !isCancelled()) {
    onProgress({ phase: "previous" });
    const span = untilMs - sinceMs;
    const previous = await quiet(
      fetchRange(new Date(sinceMs - span).toISOString(), since, "previous").then(({ text }) => parseEntries(text).entries),
      null
    );
    if (previous) {
      previousTotal = buildReportModel({ entries: previous, since: new Date(sinceMs - span).toISOString(), until: since, knownErrors, environment, level }).totalEvents;
    }
  }

  onProgress({ phase: "building" });
  const model = buildReportModel({
    entries,
    since,
    until,
    environment,
    level,
    knownErrors,
    deploys,
    context: context || { users: [], colleges: [] },
    issues,
    previousTotal,
    truncated: Boolean(meta?.truncated),
  });
  const markdown = renderReportMarkdown(model);
  return { model, markdown, rawText, filename: reportFilename(model), entryCount: entries.length };
}
