import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  auditDb01FinalDisposition,
} from "../scripts/db01-final-field-disposition-audit.mjs";

const ledger = JSON.parse(
  readFileSync(
    "docs/planning/db01-chat05-final-field-disposition.json",
    "utf8",
  ),
);
const triage = JSON.parse(
  readFileSync(
    "docs/planning/db01-chat02-312-field-source-triage.json",
    "utf8",
  ),
);

const clone = (v) => JSON.parse(JSON.stringify(v));

test("DB004 final field disposition covers all 312 source fields", () => {
  const report = auditDb01FinalDisposition(ledger, triage);
  assert.equal(report.valid, true, JSON.stringify(report.errors));
  assert.equal(report.summary.sourceFields, 312);
  assert.equal(report.summary.dispositionRows, 312);
  assert.equal(report.summary.explicitDecisionRows, 312);
  assert.equal(report.summary.falseAcceptanceRows, 0);
});

test("DB004 former 137 target gaps now have explicit dispositions, not runtime acceptance", () => {
  assert.equal(ledger.summary.formerlyWithoutTargetProposal, 137);
  assert.equal(ledger.summary.unresolvedDecisionRows, 0);
  assert.equal(ledger.summary.runtimeVerifiedFields, 0);
  assert.equal(ledger.summary.postgresVerifiedFields, 0);
  assert.equal(ledger.summary.providerVerifiedFields, 0);
  assert.equal(
    ledger.rows.filter((r) => r.runtimeVerified).length,
    0,
  );
});

test("DB004 raw legacy credentials never regain a SQL persistence target", () => {
  for (const field of [
    "auth_handoff_token.access_token",
    "auth_handoff_token.refresh_token",
    "login_user.password",
    "user.password",
  ]) {
    const row = ledger.rows.find((r) => r.legacyField === field);
    assert.ok(row, field);
    assert.match(
      row.decisionStatus,
      /SECURITY_RETIRED|RETIRED_LOCAL_PASSWORD/,
    );
    if (typeof row.target === "string") {
      assert.match(row.target, /EXTERNAL_IDENTITY_PROVIDER/);
    }
  }
});

test("DB004 mutation: false PostgreSQL acceptance is rejected", () => {
  const bad = clone(ledger);
  bad.rows[0].postgresVerified = true;
  const report = auditDb01FinalDisposition(bad, triage);
  assert.equal(report.valid, false);
  assert.ok(
    report.errors.some((e) => e.code === "FALSE_RUNTIME_ACCEPTANCE"),
  );
});

test("DB004 mutation: deleting a disposition row is rejected", () => {
  const bad = clone(ledger);
  bad.rows.pop();
  const report = auditDb01FinalDisposition(bad, triage);
  assert.equal(report.valid, false);
  assert.ok(report.errors.some((e) => e.code === "CARDINALITY_DRIFT"));
  assert.ok(report.errors.some((e) => e.code === "MISSING_SOURCE_FIELD"));
});

test("DB004 mutation: source-shape drift is rejected", () => {
  const bad = clone(ledger);
  bad.rows[0].sourceType = "surprise_type";
  const report = auditDb01FinalDisposition(bad, triage);
  assert.equal(report.valid, false);
  assert.ok(report.errors.some((e) => e.code === "SOURCE_SHAPE_DRIFT"));
});

test("DB004 mutation: raw handoff access token cannot become a SQL target", () => {
  const bad = clone(ledger);
  const row = bad.rows.find(
    (r) => r.legacyField === "auth_handoff_token.access_token",
  );
  row.decisionStatus = "PROPOSED_TARGET_UNVERIFIED";
  row.target = "identity_auth_handoffs.access_token";
  const report = auditDb01FinalDisposition(bad, triage);
  assert.equal(report.valid, false);
  assert.ok(
    report.errors.some(
      (e) => e.code === "RAW_SECRET_PERSISTENCE_REGRESSION",
    ),
  );
});

test("DB004 mutation: department leadership retirement cannot silently regress", () => {
  const bad = clone(ledger);
  bad.rows.find(
    (r) => r.legacyField === "department.dept_chair_id",
  ).decisionStatus = "PROPOSED_TARGET_UNVERIFIED";
  const report = auditDb01FinalDisposition(bad, triage);
  assert.equal(report.valid, false);
  assert.ok(
    report.errors.some(
      (e) => e.code === "DEPARTMENT_LEADERSHIP_RETIREMENT_DRIFT",
    ),
  );
});

test("DB004 mutation: unresolved denominator cannot be reintroduced", () => {
  const bad = clone(ledger);
  bad.summary.unresolvedDecisionRows = 1;
  const report = auditDb01FinalDisposition(bad, triage);
  assert.equal(report.valid, false);
  assert.ok(
    report.errors.some(
      (e) => e.code === "UNRESOLVED_DECISION_ROWS_REINTRODUCED",
    ),
  );
});
