#!/usr/bin/env node
/**
 * DB-008 read-only promotion readiness probe.
 * Run: node scripts/db05-migration-readiness.mjs [--json]
 * Exits 2 while any gate is blocked; does NOT execute migrations or tests.
 * A green static inventory never substitutes for executed PG/CI acceptance.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function readJson(path) {
  return JSON.parse(readFileSync(resolve(root, path), "utf8"));
}
const manifest = readJson("docs/planning/db05-migration-readiness-manifest.json");
const queue = readJson("docs/coordination/work-queue.json");
const phase = readJson("docs/coordination/phase-state.json");
const review = readJson("docs/planning/db05-chat06-source-semantic-review.json");
const decisions = readJson("docs/planning/db05-unresolved-semantic-decisions.json");
const blockers = [];
const detail = [];
function block(reason) { blockers.push(reason); }
if (phase.currentPhase !== "DATABASE") {
  block("Global phase changed: re-evaluate this DB-only gate before reuse.");
}
const task = queue.tasks.find((item) => item.id === "DB-008");
if (!task) block("DB-008 missing from shared queue.");
else if (!["IN_PROGRESS", "COMPLETED", "DONE_VERIFIED"].includes(task.status)) {
  block("DB-008 unexpected status: " + task.status);
}
if (manifest.artifacts.length !== 7) block("Expected seven staged DB05 drafts.");
const seen = new Set();
// A primary migration's recorded PASS cannot substitute for a companion's
// independently executed schema/negative proof. Require each subordinate
// guard to have an explicit manifest record, existing file and real status.
const subordinateDetail = [];
function requireSubordinateDb05Proof(owner, key, entry, expectedPath = null) {
  const path = expectedPath ?? entry?.path;
  if (!path || typeof path !== "string") {
    block("Missing subordinate path: " + owner + "." + key);
    return;
  }
  if (!existsSync(resolve(root, path))) {
    block("Missing subordinate SQL: " + owner + "." + key + " -> " + path);
  }
  if (!entry || entry.path !== path ||
      entry.registered !== true ||
      entry.postgresExecuted !== true ||
      entry.readyForProduction !== true) {
    block("Subordinate NOT acceptance-ready: " + owner + "." + key + " -> " + path);
  }
  subordinateDetail.push({
    owner, key, path,
    registered: entry?.registered === true,
    postgresExecuted: entry?.postgresExecuted === true,
    productionReady: entry?.readyForProduction === true,
  });
}
for (const item of manifest.artifacts) {
  if (seen.has(item.path)) block("Repeated draft path: " + item.path);
  seen.add(item.path);
  if (!existsSync(resolve(root, item.path))) block("Missing draft: " + item.path);
  if (!item.registered || !item.executedAgainstPostgres || !item.readyForProduction) {
    block("Draft NOT acceptance-ready: " + item.id);
  }
  for (const key of [
    "companionIntegrityDraft",
    "companionUpstreamDepartmentDraft",
    "companionSameCollegeDraft",
  ]) {
    if (item[key]) requireSubordinateDb05Proof(item.id, key, item[key]);
  }
  detail.push({
    draft: item.id,
    registered: item.registered,
    postgresExecuted: item.executedAgainstPostgres,
    productionReady: item.readyForProduction,
  });
}
// Companion SQL is just as security-critical as a primary numbered draft.
// A manifest must not pass merely because seven primary drafts were replayed
// while an ancestor, tenant, content owner or lesson-restore guard was omitted.
const companionDetail = [];
const companions = manifest.crossDomainCompanions || [];
if (companions.length === 0) block("DB05 companion registry missing.");
for (const item of companions) {
  if (!item.id || !item.path) {
    block("DB05 companion has missing id or path");
    continue;
  }
  if (seen.has(item.path)) block("Repeated companion path: " + item.path);
  seen.add(item.path);
  if (!existsSync(resolve(root, item.path))) block("Missing companion: " + item.path);
  if (!item.registered || !item.postgresExecuted || !item.readyForProduction) {
    block("Companion NOT acceptance-ready: " + item.id);
  }
  if (item.uniqueLessonCompanion) {
    // String path alone is NOT proof. Require a separately reviewed, explicit
    // uniqueLessonProof with matching path and all three PASS fields.
    requireSubordinateDb05Proof(
      item.id,
      "uniqueLessonProof",
      item.uniqueLessonProof,
      item.uniqueLessonCompanion,
    );
  }
  if (item.upstreamReparentCompanion) {
    requireSubordinateDb05Proof(
      item.id, "upstreamReparentCompanion", item.upstreamReparentCompanion,
    );
  }
  companionDetail.push({
    companion: item.id,
    registered: item.registered,
    postgresExecuted: item.postgresExecuted,
    productionReady: item.readyForProduction,
  });
}
for (const gate of manifest.gates) {
  if (gate.status !== "PASS") block("Required " + gate.id + ": " + gate.status);
}
const reviewed = review.fields || [];
if (reviewed.length !== 92) block("Expected 92 source fields; saw " + reviewed.length);
const unverified = reviewed.filter((row) =>
  row.semanticVerification !== "WORKFLOW_VERIFIED" ||
  row.runtimeDatabaseVerification !== "PASS"
);
if (unverified.length) block("DB05 source field acceptance open: " + unverified.length + "/92");
const openDecisions = decisions.items.filter((item) => item.disposition === "OPEN").length;
if (openDecisions) block("Unresolved DB05 source decisions: " + openDecisions);
const report = {
  taskId: "DB-008",
  currentPhase: phase.currentPhase,
  taskStatus: task?.status ?? null,
  ready: blockers.length === 0,
  reminder: "This is a read-only source/manifest consistency probe, not executed PostgreSQL/CI proof.",
  blockers,
  artifacts: detail,
  companions: companionDetail,
  subordinateCompanions: subordinateDetail,
};
if (process.argv.includes("--json")) {
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
} else {
  process.stdout.write(
    "DB05 migration readiness: " + (report.ready ? "SOURCE GATES CLEAR" : "BLOCKED") + "\n" +
    "Task " + (report.taskStatus ?? "UNKNOWN") + ", " + blockers.length + " blocker(s)\n" +
    blockers.map((reason) => "- " + reason).join("\n") + "\n"
  );
}
if (!report.ready) process.exitCode = 2;
