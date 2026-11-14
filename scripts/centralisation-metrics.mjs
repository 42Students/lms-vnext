#!/usr/bin/env node
// Centralisation ratchet. Counts the scattered patterns listed in docs/planning/centralisation-audit-2026-11-14.md and keeps
// them in docs/security/baselines/centralisation.json.
//
//   node scripts/centralisation-metrics.mjs            print the table
//   node scripts/centralisation-metrics.mjs --check    fail if an ENFORCED metric rose above its baseline
//   node scripts/centralisation-metrics.mjs --write    rewrite the baseline (an enforced metric may not be raised)
//
// A metric starts as "tracking" (reported, never blocking). It becomes ENFORCED once its central module exists, so other lanes
// are never failed by a pattern that has no replacement yet. Flip `enforce` in this file when a module lands.
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { baselinePath } from "./lib/baselines.mjs";
export const BASELINE = baselinePath("centralisation");

const inApi = (p) => p.startsWith("src/app/api/");
const inServer = (p) => p.startsWith("src/modules/") || p.startsWith("src/app/api/");
const notIn = (...prefixes) => (p) => !prefixes.some((x) => p === x || p.startsWith(x));

/** unit "matches" counts occurrences; unit "files" counts files containing at least one match. */
export const METRICS = [
  // Tier 1: security and correctness
  { id: "authz.serviceEnforcedRoutes", audit: 1, label: 'routes declaring permission "service-enforced"', scope: inApi, pattern: /permission:\s*["']service-enforced["']/g, unit: "matches", enforce: true },
  { id: "authz.ownActorGuardDefs", audit: 1, label: "per-file requireX actor guard definitions", scope: (p) => p.startsWith("src/"), pattern: /function require(?:Learner|Faculty|Tpo|College|Staff|Mentor|Recruiter|Admin|Super)[A-Za-z]*\(/g, unit: "matches", enforce: true },
  { id: "plumbing.handlerOriginChecks", audit: 2, label: "origin checks inside API handlers", scope: inApi, pattern: /isSameOriginRequest\(/g, unit: "matches", enforce: true },
  { id: "plumbing.handlerActorLookups", audit: 2, label: "getCurrentRequestContext() inside API handlers", scope: inApi, pattern: /getCurrentRequestContext\(/g, unit: "matches" },
  { id: "plumbing.bodyReaderModules", audit: 2, label: "request-body reader modules in src/lib", scope: (p) => /^src\/lib\/bounded-[a-z-]+\.ts$/.test(p), pattern: /^/g, unit: "files", enforce: true },
  { id: "errors.apiErrorMapperModules", audit: 3, label: "API error mapper modules in src/lib", scope: (p) => /^src\/lib\/(?:[a-z-]+-)?api-error\.ts$/.test(p), pattern: /^/g, unit: "files" },
  { id: "errors.plainThrowError", audit: 3, label: 'throw new Error("...") in src', scope: (p) => p.startsWith("src/"), pattern: /throw new Error\("/g, unit: "matches" },
  { id: "errors.customErrorClasses", audit: 3, label: "custom Error classes", scope: (p) => p.startsWith("src/"), pattern: /class \w+Error extends Error/g, unit: "matches" },
  { id: "errors.messageReturnedFromApi", audit: 3, label: "error.message used in API routes", scope: inApi, pattern: /\b(?:error|err|e)\.message\b/g, unit: "matches" },
  { id: "responses.cacheControlLiterals", audit: 4, label: "Cache-Control literals in API routes", scope: inApi, pattern: /Cache-Control/g, unit: "matches", enforce: true },
  { id: "responses.numericStatusLiterals", audit: 4, label: "numeric status literals in API routes", scope: inApi, pattern: /status: ?(?:400|401|403|404|409|422|429|500|503)\b/g, unit: "matches" },
  { id: "events.inlineActivityInserts", audit: 5, label: "inline insert into activity_events", scope: (p) => p.startsWith("src/"), pattern: /insert\(activityEvents\)|INSERT INTO activity_events/g, unit: "matches" },
  { id: "tenant.inlineCollegeIdCompare", audit: 6, label: "inline collegeId equality checks", scope: (p) => p.startsWith("src/"), pattern: /collegeId (?:===|!==) /g, unit: "matches", enforce: true },
  { id: "data.directDbRoutes", audit: 7, label: "API routes importing the database directly", scope: inApi, pattern: /\bgetDb\b[\s\S]*from\s+["']@\/db/, unit: "files" },
  { id: "config.processEnvReads", audit: 9, label: "process.env reads outside the config module", scope: (p) => p.startsWith("src/") && notIn("src/lib/env.ts", "src/config/")(p), pattern: /process\.env/g, unit: "matches", enforce: true },
  { id: "config.readyFlagReads", audit: 9, label: "bare READY/ENABLED flag reads", scope: (p) => p.startsWith("src/") && notIn("src/config/")(p), pattern: /process\.env\["[A-Z0-9_]*(?:READY|ENABLED)[A-Z0-9_]*"\]/g, unit: "matches", enforce: true },
  { id: "limits.rateLimitLiterals", audit: 11, label: "inline rateLimit config literals", scope: (p) => p.startsWith("src/"), pattern: /rateLimit: ?\{/g, unit: "matches", enforce: true },
  { id: "limits.timeoutLiterals", audit: 11, label: "inline timeoutMs literals", scope: (p) => p.startsWith("src/"), pattern: /timeoutMs ?[:=] ?[0-9_]+/g, unit: "matches", enforce: true },
  { id: "session.cookieSets", audit: 12, label: "cookies.set( calls", scope: (p) => p.startsWith("src/") && p !== "src/auth/cookies.ts", pattern: /cookies\.set\(/g, unit: "matches", enforce: true },
  { id: "roles.roleLiterals", audit: 13, label: "role name string literals", scope: (p) => p.startsWith("src/") && notIn("src/modules/identity/constants.ts", "src/db/")(p), pattern: /"(?:COLLEGE_ADMIN|FACULTY|LEARNER|TPO|MENTOR|SUPER_ADMIN)"/g, unit: "matches", enforce: true },
  { id: "outbound.serverRawFetch", audit: 14, label: "raw fetch( in server code", scope: inServer, pattern: /(?<![A-Za-z.])fetch\(/g, unit: "matches", enforce: true },
  { id: "exports.csvCellCopies", audit: 15, label: "csvCell redefinitions", scope: (p) => p.startsWith("src/"), pattern: /(?:function|const) csvCell\b/g, unit: "matches" },
  { id: "files.dispositionLiterals", audit: 16, label: "hand-built Content-Disposition headers", scope: (p) => p.startsWith("src/") && notIn("src/security/download-core.ts", "src/security/downloads.ts", "src/modules/storage/")(p), pattern: /attachment;\s*filename=/gi, unit: "matches", enforce: true },
  { id: "files.mimeLiterals", audit: 16, label: 'literal "application/pdf" lists', scope: (p) => p.startsWith("src/") && notIn("src/modules/storage/")(p), pattern: /"application\/pdf"/g, unit: "matches" },
  // Tier 2: behaviour that must be identical
  { id: "time.asiaKolkataLiterals", audit: 19, label: "Asia/Kolkata literals outside format-date", scope: (p) => p.startsWith("src/") && p !== "src/config/locale.ts" && p !== "src/modules/placements/tpo-timed-debar-view-model.ts", pattern: /Asia\/Kolkata/g, unit: "matches", enforce: true },
  { id: "time.inlineIntlDateFormatters", audit: 19, label: "inline Intl.DateTimeFormat", scope: (p) => p.startsWith("src/") && p !== "src/lib/format-date.ts", pattern: /new Intl\.DateTimeFormat/g, unit: "matches" },
  { id: "validation.inlineUuidSchemas", audit: 21, label: "inline uuid zod schemas", scope: (p) => p.startsWith("src/"), pattern: /z\.string\(\)\.uuid\(|z\.uuid\(/g, unit: "matches" },
  { id: "pagination.pageSizeConstants", audit: 22, label: "PAGE_SIZE constants", scope: (p) => p.startsWith("src/"), pattern: /const PAGE_SIZE\b/g, unit: "matches" },
  { id: "status.statusCompares", audit: 23, label: "status string comparisons", scope: (p) => p.startsWith("src/"), pattern: /=== ?"(?:ACTIVE|SUSPENDED|PENDING|PUBLISHED|DRAFT|ARCHIVED|SUBMITTED|WITHDRAWN|COMPLETED|CANCELLED)"/g, unit: "matches" },
  { id: "routes.routeLiterals", audit: 24, label: "hard-coded internal route strings", scope: (p) => p.startsWith("src/"), pattern: /"\/(?:college|admin|tpo|learn|teacher|mentor|hr)\//g, unit: "matches" },
  { id: "legacy.legacyFiles", audit: 25, label: "files with legacy in the path", scope: (p) => p.startsWith("src/") && /legacy/i.test(p), pattern: /^/g, unit: "files" },
  // Tier 3: UI and copy
  { id: "copy.titleLiterals", audit: 29, label: 'literal title="..." copy', scope: (p) => p.startsWith("src/") && p.endsWith(".tsx"), pattern: /title="[A-Z]/g, unit: "matches" },
  { id: "copy.descriptionLiterals", audit: 29, label: 'literal description="..." copy', scope: (p) => p.startsWith("src/") && p.endsWith(".tsx"), pattern: /description="[A-Z]/g, unit: "matches" },
  { id: "logging.consoleCalls", audit: 34, label: "raw console calls", scope: (p) => p.startsWith("src/"), pattern: /console\.(?:log|warn|error|info|debug)\(/g, unit: "matches" },
];

/** Names (functions, constants, schemas) defined in at least four files: the audit's "duplicated helpers". */
export function duplicatedNameCount(sources) {
  const defs = new Map();
  const add = (name, path) => {
    if (!defs.has(name)) defs.set(name, new Set());
    defs.get(name).add(path);
  };
  for (const { path, text } of sources) {
    if (!path.startsWith("src/")) continue;
    for (const m of text.matchAll(/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_]\w*)/gm)) add(m[1], path);
    for (const m of text.matchAll(/^(?:export\s+)?const\s+([A-Z][A-Z0-9_]{3,})\s*=/gm)) add(m[1], path);
    for (const m of text.matchAll(/^(?:export\s+)?const\s+([a-z]\w*Schema)\s*=/gm)) add(m[1], path);
  }
  const skip = /^(GET|POST|PUT|PATCH|DELETE|default|handle\w*|Page|Layout|Loading|Error|Props|State|Item|Row|Data|Config|Options|Context|Input|Output|Result|Params|Query|render\w*|generateMetadata|metadata|dynamic|runtime)$/;
  return [...defs.entries()].filter(([name, set]) => set.size >= 4 && !skip.test(name)).length;
}

export function countMetric(metric, sources) {
  let total = 0;
  for (const { path, text } of sources) {
    if (!metric.scope(path)) continue;
    if (metric.unit === "files") {
      metric.pattern.lastIndex = 0;
      if (metric.pattern.test(text)) total += 1;
    } else {
      total += (text.match(metric.pattern) ?? []).length;
    }
  }
  return total;
}

export function computeCounts(sources) {
  const counts = {};
  for (const metric of METRICS) counts[metric.id] = countMetric(metric, sources);
  counts["helpers.duplicatedNames"] = duplicatedNameCount(sources);
  return counts;
}

export function loadSources() {
  const files = execSync("git ls-files src", { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
    .split("\n")
    .filter((f) => /\.(?:ts|tsx)$/.test(f));
  return files.map((path) => ({ path, text: readFileSync(path, "utf8") }));
}

const ENFORCED = new Set(
  METRICS.filter((m) => m.enforce === true).map((m) => m.id),
);

export function compare(counts, baseline, enforced = ENFORCED) {
  const rose = [];
  for (const [id, now] of Object.entries(counts)) {
    const before = baseline.counts?.[id];
    if (before === undefined) continue;
    if (now > before && enforced.has(id)) rose.push({ id, before, now });
  }
  return rose;
}

function main() {
  const args = process.argv.slice(2);
  const counts = computeCounts(loadSources());
  const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : null;

  if (args.includes("--write")) {
    if (baseline) {
      const rose = compare(counts, baseline);
      if (rose.length) {
        console.error("refusing to raise enforced metrics: " + rose.map((r) => `${r.id} ${r.before} -> ${r.now}`).join(", "));
        process.exit(1);
      }
    }
    mkdirSync(dirname(BASELINE), { recursive: true });
    const note =
      "Centralisation ratchet (docs/planning/centralisation-audit-2026-11-14.md). Counts of scattered patterns. Enforced metrics may only go down; tracking metrics are reported only until their central module exists.";
    writeFileSync(BASELINE, JSON.stringify({ note, counts }, null, 1) + "\n");
    console.log("baseline written (" + Object.keys(counts).length + " metrics)");
    return;
  }

  const labels = new Map(METRICS.map((m) => [m.id, m]));
  const rows = Object.entries(counts).map(([id, now]) => {
    const metric = labels.get(id);
    const before = baseline?.counts?.[id];
    const delta = before === undefined ? "new" : now === before ? "=" : now < before ? `-${before - now}` : `+${now - before}`;
    return `${ENFORCED.has(id) ? "ENFORCED " : "tracking "} ${String(now).padStart(6)} ${delta.padStart(6)}  ${id.padEnd(36)} ${metric?.label ?? "names defined in 4+ files"}`;
  });
  console.log(rows.join("\n"));

  if (args.includes("--check")) {
    if (!baseline) {
      console.error("no baseline: run with --write");
      process.exit(1);
    }
    const missing = Object.keys(counts).filter((id) => baseline.counts?.[id] === undefined);
    if (missing.length) {
      console.error("metrics missing from the baseline (run --write): " + missing.join(", "));
      process.exit(1);
    }
    const rose = compare(counts, baseline);
    if (rose.length) {
      console.error("centralisation ratchet: enforced metrics rose: " + rose.map((r) => `${r.id} ${r.before} -> ${r.now}`).join(", "));
      process.exit(1);
    }
    console.log("centralisation ok (" + ENFORCED.size + " enforced of " + Object.keys(counts).length + ")");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
// Referenced so a bundler or editor does not drop it: the script lives next to the others in scripts/.
void fileURLToPath;
