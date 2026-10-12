import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  auditDb01FinalDisposition,
} from "../scripts/db01-final-field-disposition-audit.mjs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const triage = read("docs/planning/db01-chat02-312-field-source-triage.json");
const dispositions = read("docs/planning/db01-chat05-final-field-disposition.json");
const consumers = read("docs/planning/db01-chat05-active-consumer-evidence.json");
const provider = read("docs/planning/db01-chat05-provider-persistence-decision.json");

test("DB004 source closure has no anonymous field decision gaps", () => {
  const report = auditDb01FinalDisposition(dispositions, triage);
  assert.equal(report.valid, true, JSON.stringify(report.errors));
  assert.equal(dispositions.summary.sourceFields, 312);
  assert.equal(dispositions.summary.explicitDispositionRows, 312);
  assert.equal(dispositions.summary.formerlyWithoutTargetProposal, 137);
  assert.equal(dispositions.summary.unresolvedDecisionRows, 0);
});

test("DB004 source closure accounts for all 70 previously evidence-less active fields", () => {
  assert.equal(consumers.summary.previousActiveRowsWithoutDirectEvidence, 70);
  assert.equal(consumers.summary.evidenceRows, 70);
  assert.equal(consumers.summary.unaccountedRows, 0);
  assert.equal(consumers.summary.byStatus.DIRECT_FAMILY_PRODUCER_CONSUMER_SOURCE_EVIDENCE, 69);
  assert.equal(consumers.summary.byStatus.CROSS_DOMAIN_HANDOFF_WITH_SOURCE_EVIDENCE, 1);
  const keys = new Set(consumers.rows.map((r) => r.legacyField));
  assert.equal(keys.size, 70);
  for (const row of consumers.rows) {
    assert.ok(row.legacyEvidence.length >= 2, row.legacyField);
    assert.ok(row.vnextEvidence.length >= 1, row.legacyField);
    assert.equal(row.runtimeVerified, false);
    assert.equal(row.postgresVerified, false);
  }
});

test("DB004 provider decision keeps one external identity authority", () => {
  assert.equal(
    provider.decision,
    "EXTERNAL_IDENTITY_AUTHORITY_WITH_MINIMAL_POSTGRES_SECURITY_SIDECARS",
  );
  assert.equal(provider.flows.length, 9);
  const ids = new Set(provider.flows.map((f) => f.id));
  for (const required of [
    "IDENTITY_DIRECTORY",
    "LOCAL_PASSWORDS",
    "SESSION_COOKIE",
    "PER_DEVICE_SESSION",
    "CROSS_HOST_HANDOFF",
    "PHONE_EMAIL_OTP",
    "EMAIL_VERIFICATION_TOKEN",
    "TOKEN_VERSION",
    "TENANT_AUTHORIZATION",
  ]) {
    assert.ok(ids.has(required), required);
  }
  assert.equal(provider.acceptance.sourceDecisionComplete, true);
  assert.equal(provider.acceptance.activeMigrationRegistered, false);
  assert.equal(provider.acceptance.disposablePostgresVerified, false);
  assert.equal(provider.acceptance.providerEndToEndVerified, false);
  assert.equal(provider.acceptance.doneVerified, false);
});

test("DB004 provider decision never promotes raw local credential persistence", () => {
  const password = provider.flows.find((f) => f.id === "LOCAL_PASSWORDS");
  const handoff = provider.flows.find((f) => f.id === "CROSS_HOST_HANDOFF");
  assert.equal(password.decision, "RETIRE_LOCAL_PASSWORD_AND_LOGIN_USER_TABLE");
  assert.match(handoff.decision, /RETIRE_RAW_ACCESS_REFRESH_TOKEN_COLUMNS/);
  assert.ok(
    provider.principles.some((p) =>
      p.includes("Never persist raw passwords"),
    ),
  );
});

test("DB004 source closure makes zero runtime acceptance claims", () => {
  for (const row of dispositions.rows) {
    assert.equal(row.runtimeVerified, false, row.legacyField);
    assert.equal(row.postgresVerified, false, row.legacyField);
    assert.equal(row.providerVerified, false, row.legacyField);
  }
  for (const flow of provider.flows) {
    assert.equal(flow.runtimeVerified, false, flow.id);
  }
});
