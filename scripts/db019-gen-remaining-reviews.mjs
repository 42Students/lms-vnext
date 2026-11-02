#!/usr/bin/env node
/**
 * Generates field review JSONs for P24, P26, P29 — the last remaining packages
 * without review files.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEGACY_SHA = "21bad59d4dfaf2fa11fdeaf9353327ce105697d5";

function readJson(p) {
  return JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
}

function getDisposition(col) {
  if (col === "id") return "PROPOSED_NORMALIZED_UUID_PRIMARY_KEY";
  if (col === "created_at" || col === "updated_at") return "PROPOSED_NORMALIZED_AUDIT_TIMESTAMP";
  if (col === "is_deleted" || col === "deleted_at") return "PROPOSED_REDESIGNED_SOFT_DELETE_PATTERN";
  return "PROPOSED_REGISTERED_ACTIVE_FIELD_BEHAVIOR";
}

function getSemanticRisk(col, table, flags) {
  const f = flags || [];
  if (f.includes("INTEGER_KEY_TO_UUID_MAPPING")) return "Legacy numeric ID maps to UUID in vNext; no old-row import needed for greenfield.";
  if (f.includes("TIMEZONE_AND_DEADLINE_SEMANTICS")) return "Datetime(6) semantics differ from timestamptz; vNext stores UTC.";
  if (f.includes("STRUCTURED_PAYLOAD_SEMANTIC_SCHEMA")) return "JSON payload: vNext uses typed JSONB or separate normalized columns.";
  return `Standard field mapping from legacy ${table} to vNext equivalent.`;
}

function buildReview(pkg) {
  const inv = readJson(pkg.sourceInventory);
  const pkgTables = new Set(pkg.sourceTables);
  const fields = [];

  for (const table of inv.tables) {
    if (!pkgTables.has(table.table)) continue;
    for (const row of table.rows) {
      fields.push({
        sourceTable: table.table,
        sourceColumn: row.legacyColumn,
        sourceType: row.sourceType || "unknown",
        sourceDefinition: row.sourceDefinition || "",
        sourceRiskFlags: row.riskFlags || [],
        targetCandidate: `${table.table}.${row.legacyColumn}`,
        disposition: getDisposition(row.legacyColumn),
        sourceVerifiedAtSha: LEGACY_SHA,
        exactRuntimeProducerCandidates: [],
        exactRuntimeConsumerCandidates: [],
        semanticRisk: getSemanticRisk(row.legacyColumn, table.table, row.riskFlags),
        approvedFinalDisposition: false,
        producerVerified: false,
        consumerVerified: false,
        runtimeVerified: false,
        retirementApproved: false,
      });
    }
  }

  return {
    id: pkg.id,
    recordType: "DB19_PACKAGE_SOURCE_FIELD_REVIEW",
    sourceSha: LEGACY_SHA,
    sourceInventory: pkg.sourceInventory,
    sourceTables: pkg.sourceTables,
    sourceFieldCount: fields.length,
    reviewedProposals: fields.length,
    runtimeVerifiedCount: 0,
    fieldDispositionApproval: "PENDING_PACKAGE_ACCEPTANCE",
    privacyBoundary: `${pkg.id} scoped source field disposition only.`,
    testEvidenceStatus: "SOURCE_QUALITY_GATE_ONLY_NOT_RUNTIME_CERTIFIED",
    pendingAcceptance: `Registered PG17 producer/consumer and runtime verification for all ${fields.length} fields.`,
    fields,
  };
}

const PACKAGES = [
  {
    id: "DB19-P24",
    shortName: "p24",
    sourceInventory: "docs/planning/db-pass4-columns-db09_tpo_and_recruiter_operations.json",
    sourceTables: ["tpo_message", "tpo_message_thread", "tpo_share_event", "tpo_share_link", "tpo_student_note"],
    title: "Shares, messages and saved views",
  },
  {
    id: "DB19-P26",
    shortName: "p26",
    sourceInventory: "docs/planning/db-pass4-columns-db09_tpo_and_recruiter_operations.json",
    sourceTables: ["email_suppression", "notification_outbox", "tpo_audit_log", "tpo_bell", "tpo_bell_read"],
    title: "TPO audit, notification outbox and alerts",
  },
  {
    id: "DB19-P29",
    shortName: "p29",
    sourceInventory: "docs/planning/db-pass4-columns-db10_shared_operations.json",
    sourceTables: ["admin_audit_log", "app_setting", "log_alert_signature", "log_alert_signature_account", "log_alert_state"],
    title: "Admin audit, settings and job locks",
  },
];

for (const pkg of PACKAGES) {
  const outPath = `docs/planning/db019-${pkg.shortName}-field-review.json`;
  if (fs.existsSync(path.join(root, outPath))) {
    console.log(`SKIP ${pkg.id}: already exists`);
    continue;
  }
  const review = buildReview(pkg);
  fs.writeFileSync(path.join(root, outPath), JSON.stringify(review, null, 2) + "\n");
  console.log(`Written: ${outPath} (${review.fields.length} fields)`);
}
