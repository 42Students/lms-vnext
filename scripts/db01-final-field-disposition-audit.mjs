#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const LEDGER_PATH =
  "docs/planning/db01-chat05-final-field-disposition.json";
export const TRIAGE_PATH =
  "docs/planning/db01-chat02-312-field-source-triage.json";

const valid = (v) => typeof v === "string" && v.trim().length > 0;

export function auditDb01FinalDisposition(ledger, triage) {
  const errors = [];
  const rows = Array.isArray(ledger?.rows) ? ledger.rows : [];
  const source = Array.isArray(triage?.rows) ? triage.rows : [];
  const bySource = new Map(source.map((r) => [
    r.legacyTable + "." + r.legacyColumn,
    r,
  ]));
  const seen = new Set();
  const counts = {};
  let falseAcceptance = 0;
  let missingDisposition = 0;

  if (ledger?.task !== "DB-004" || ledger?.phase !== "DATABASE") {
    errors.push({ code: "WRONG_TASK_OR_PHASE" });
  }
  if (ledger?.status !== "FIELD_DISPOSITIONS_COMPLETE_RUNTIME_UNVERIFIED") {
    errors.push({ code: "FALSE_LEDGER_STATUS" });
  }
  if (source.length !== 312 || rows.length !== source.length) {
    errors.push({ code: "CARDINALITY_DRIFT", source: source.length, rows: rows.length });
  }

  for (const row of rows) {
    const key = row?.legacyField;
    if (!valid(key) || seen.has(key)) {
      errors.push({ code: "INVALID_OR_DUPLICATE_FIELD", key });
      continue;
    }
    seen.add(key);
    const src = bySource.get(key);
    if (!src) {
      errors.push({ code: "UNKNOWN_SOURCE_FIELD", key });
      continue;
    }
    if (
      row.sourceType !== src.sourceType ||
      row.sourceNullable !== src.sourceNullable ||
      row.sourceActiveness !== src.postV150Active ||
      row.sourceCategory !== src.category
    ) {
      errors.push({ code: "SOURCE_SHAPE_DRIFT", key });
    }
    if (!valid(row.decisionStatus) || !valid(row.ownerTask)) {
      missingDisposition++;
      errors.push({ code: "MISSING_EXPLICIT_DISPOSITION", key });
    }
    if (
      row.runtimeVerified !== false ||
      row.postgresVerified !== false ||
      row.providerVerified !== false
    ) {
      falseAcceptance++;
      errors.push({ code: "FALSE_RUNTIME_ACCEPTANCE", key });
    }
    counts[row.decisionStatus] = (counts[row.decisionStatus] ?? 0) + 1;
  }

  for (const key of bySource.keys()) {
    if (!seen.has(key)) errors.push({ code: "MISSING_SOURCE_FIELD", key });
  }

  for (const key of [
    "auth_handoff_token.access_token",
    "auth_handoff_token.refresh_token",
    "login_user.password",
    "user.password",
  ]) {
    const row = rows.find((r) => r.legacyField === key);
    if (!row || !/SECURITY_RETIRED|RETIRED_LOCAL_PASSWORD/.test(row.decisionStatus)) {
      errors.push({ code: "RAW_SECRET_PERSISTENCE_REGRESSION", key });
    }
    if (
      typeof row?.target === "string" &&
      !row.target.includes("EXTERNAL_IDENTITY_PROVIDER")
    ) {
      errors.push({ code: "RAW_SECRET_SQL_TARGET_REGRESSION", key });
    }
  }

  for (const key of [
    "department.dept_chair_id",
    "department.dept_vice_chair_id",
  ]) {
    const row = rows.find((r) => r.legacyField === key);
    if (row?.decisionStatus !== "RETIRED_FRONTEND_PRODUCT_FIELD") {
      errors.push({ code: "DEPARTMENT_LEADERSHIP_RETIREMENT_DRIFT", key });
    }
  }

  if (Number(ledger?.summary?.formerlyWithoutTargetProposal) !== 137) {
    errors.push({ code: "FORMERLY_MISSING_DENOMINATOR_DRIFT" });
  }
  if (ledger?.summary?.unresolvedDecisionRows !== 0) {
    errors.push({ code: "UNRESOLVED_DECISION_ROWS_REINTRODUCED" });
  }

  return {
    valid: errors.length === 0,
    verification: "SOURCE_FIELD_DISPOSITION_COMPLETE_RUNTIME_UNVERIFIED",
    summary: {
      sourceFields: source.length,
      dispositionRows: rows.length,
      explicitDecisionRows: rows.length - missingDisposition,
      falseAcceptanceRows: falseAcceptance,
      byDecisionStatus: counts,
      runtimeVerifiedFields: 0,
    },
    errors,
  };
}

export function auditCheckout(root = process.cwd()) {
  return auditDb01FinalDisposition(
    JSON.parse(readFileSync(resolve(root, LEDGER_PATH), "utf8")),
    JSON.parse(readFileSync(resolve(root, TRIAGE_PATH), "utf8")),
  );
}

if (process.argv[1] && import.meta.url === new URL("file://" + resolve(process.argv[1])).href) {
  try {
    const report = auditCheckout(process.argv[2] || process.cwd());
    console.log(JSON.stringify(report, null, 2));
    if (!report.valid) process.exitCode = 2;
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
