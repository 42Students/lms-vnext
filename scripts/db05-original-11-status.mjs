#!/usr/bin/env node
/**
 * Chat 6 / DB-008: Source-reconciled status for the ORIGINAL eleven missing rows.
 *
 * This is a READ-ONLY ledger checker, not a migration, source consumer test,
 * PostgreSQL runner or assurance of feature/database parity.
 *
 *   node scripts/db05-original-11-status.mjs
 *   node scripts/db05-original-11-status.mjs --json
 *   node scripts/db05-original-11-status.mjs --strict
 *
 * --strict exits 2 while semantic/DB acceptance remains open or if the local
 * matrix becomes stale. The normal informative mode exits 0 on a sound ledger.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fromRepo = (path) => resolve(root, path);
const readJson = (path) => JSON.parse(readFileSync(fromRepo(path), "utf8"));
const matrix = readJson("docs/planning/db05-original-11-gaps-closure-matrix.json");
const ledger = readJson("docs/planning/db05-chat06-source-semantic-review.json");
const manifest = readJson("docs/planning/db05-migration-readiness-manifest.json");
const decisions = readJson("docs/planning/db05-unresolved-semantic-decisions.json");
const expectedOriginal = new Set([
  "classroom_messages.is_deleted",
  "classroom_messages.sender_name",
  "course.allowed_for_display",
  "course.created_by_org_id",
  "course.default_subscription_days",
  "course.formal_title",
  "course.parent_course_id",
  "learner_content_progress.is_deleted",
  "lesson_contents.course_name",
  "lesson_contents.points",
  "lesson_contents.deadline",
]);

const errors = [];
const seen = new Set();
const distribution = {};
const gateById = new Map(manifest.gates.map((gate) => [gate.id, gate]));
const ledgerById = new Map(ledger.fields.map((field) => [field.source, field]));
const decisionById = new Map(decisions.items.map((field) => [field.source, field]));
const items = [];

for (const field of matrix.fields) {
  const source = field.source;
  if (seen.has(source)) errors.push("Duplicate original gap row: " + source);
  seen.add(source);
  if (!expectedOriginal.has(source)) errors.push("Unexpected original gap: " + source);
  const current = ledgerById.get(source);
  if (!current) {
    errors.push("Original gap missing in DB05 source ledger: " + source);
    continue;
  }
  const classification = current.classification;
  distribution[classification] = (distribution[classification] ?? 0) + 1;
  if (field.sourceClassification !== classification) {
    errors.push("Source classification drift: " + source);
  }
  if (!field.mandatoryAcceptanceScenarios || field.mandatoryAcceptanceScenarios.length < 4) {
    errors.push("Insufficient acceptance scenarios: " + source);
  }
  if (field.candidateDraft && !existsSync(fromRepo(field.candidateDraft))) {
    errors.push("Missing drafted SQL: " + source + " -> " + field.candidateDraft);
  }
  if (field.criticalAcceptanceGate && !gateById.has(field.criticalAcceptanceGate)) {
    errors.push("Missing manifest gate: " + source + " -> " + field.criticalAcceptanceGate);
  }
  const decision = decisionById.get(source);
  const needsUnresolvedDecision =
    classification === "MISSING_OR_UNPROVEN" ||
    classification === "REMODELED_NEEDS_PROOF" ||
    source === "learner_content_progress.is_deleted";
  if (needsUnresolvedDecision && !decision) {
    errors.push("Missing mandatory semantic-decision row: " + source);
  }
  if (decision && field.decisionStatus === "OPEN" && decision.disposition !== "OPEN") {
    // A later approved verification/retirement must update this tracker and
    // provide its evidence on the same exact revision, never silently pass.
    errors.push("Decision changed without original-gap handoff: " + source);
  }
  const workflowVerified = current.semanticVerification === "WORKFLOW_VERIFIED";
  const postgresPassed = current.runtimeDatabaseVerification === "PASS";
  const manifestGatePassed =
    !!field.criticalAcceptanceGate &&
    gateById.get(field.criticalAcceptanceGate)?.status === "PASS";
  // Some source gaps need independent product decisions instead of a mapped
  // manifest gate. None can be closed by a guessed 0/1 source-match count.
  const dispositionVerified = field.decisionStatus === "DONE_VERIFIED" &&
    field.semanticVerified === true && field.postgresVerified === true;
  const verified = workflowVerified && postgresPassed &&
    dispositionVerified &&
    (field.criticalAcceptanceGate === null || manifestGatePassed);
  items.push({
    source,
    sourceClassification: classification,
    sourceReviewed: true,
    candidateDraft: field.candidateDraft,
    workflowVerified,
    postgresPassed,
    manifestGatePassed,
    decisionStatus: field.decisionStatus,
    acceptanceScenarioCount: field.mandatoryAcceptanceScenarios.length,
    verified,
  });
}
for (const source of expectedOriginal) {
  if (!seen.has(source)) errors.push("Original gap absent from matrix: " + source);
}
if (matrix.fields.length !== expectedOriginal.size) {
  errors.push("Original gap count changed from 11.");
}

const verified = items.filter((item) => item.verified).length;
const scenarios = items.reduce((sum, item) => sum + item.acceptanceScenarioCount, 0);
const report = {
  taskId: "DB-008",
  phase: "DATABASE",
  scope: "ORIGINAL_11_MISSING_FIELDS_ONLY",
  disclaimer: "SOURCE inventory reconciliation is not PostgreSQL or product parity; unregistered SQL drafts do not count as verified.",
  reconciledOriginal: expectedOriginal.size,
  presentInLedger: items.length,
  sourceClassificationCounts: distribution,
  acceptanceScenariosAuthored: scenarios,
  databaseVerified: verified,
  remainingDatabaseVerification: expectedOriginal.size - verified,
  readyForDbGate: errors.length === 0 && verified === expectedOriginal.size,
  ledgerErrors: errors,
  items,
};
const json = process.argv.includes("--json");
if (json) process.stdout.write(JSON.stringify(report, null, 2) + "\n");
else {
  process.stdout.write(
    "DB05 ORIGINAL 11 SOURCE GAPS: " +
    report.presentInLedger + "/11 reconciled, " +
    report.databaseVerified + "/11 database verified, " +
    report.acceptanceScenariosAuthored + " acceptance scenarios documented.\n" +
    "Classification: " + JSON.stringify(distribution) + "\n" +
    (errors.length ? errors.map((err) => "ERROR: " + err).join("\n") + "\n" : "") +
    "NOT a replacement for db05-migration-readiness or disposable PostgreSQL.\n"
  );
}
if (process.argv.includes("--strict") && !report.readyForDbGate) {
  process.exitCode = 2;
} else if (errors.length) {
  process.exitCode = 1;
}
