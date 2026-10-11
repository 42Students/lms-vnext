import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const filename = (p) => join(root, p);
const bytes = (p) => readFileSync(filename(p));
const json = (p) => JSON.parse(bytes(p).toString("utf8"));
const queuePath = "docs/planning/db01-chat02-no-target-disposition-queue.json";
const queue = json(queuePath);
const presence = json("docs/planning/db01-chat02-snapshot-column-presence.json");
const source = json("docs/planning/db01-chat02-312-field-source-triage.json");

function gitBlobSha(buffer) {
  const header = Buffer.from(`blob ${buffer.byteLength}\0`);
  return createHash("sha1").update(header).update(buffer).digest("hex");
}

const activeStatuses = new Set([
  "ACTIVE_WORKFLOW_CONFIRMED",
  "ACTIVE_PERSISTENCE_LIFECYCLE_CONFIRMED",
]);
const expected = presence.rows.filter(
  (row) =>
    row.structuralStatus === "NO_TARGET_PROPOSED" &&
    activeStatuses.has(row.sourceActiveStatus),
);
const fields = queue.rows.map((row) => row.legacyField);
const expectedFields = expected.map((row) => row.legacyField);

test("DB01 no-target queue pins exact source artifacts with Git blob SHA", () => {
  assert.equal(
    gitBlobSha(bytes(queue.source.presenceLedger)), queue.source.presenceBlob,
  );
  assert.equal(
    gitBlobSha(bytes(queue.source.activenessLedger)), queue.source.activenessBlob,
  );
  assert.equal(source.summary.sourceTriageRows, 312);
});

test("DB01 no-target queue has exactly 173 active/lifecycle fields", () => {
  assert.equal(queue.rows.length, 173);
  assert.equal(queue.summary.noTargetActiveFields, 173);
  assert.equal(queue.summary.activeOrLifecycleSourceFields, 288);
  assert.equal(queue.summary.sourceCandidates, 312);
});

test("DB01 no-target queue matches source ledgers without omissions or additions", () => {
  assert.deepEqual([...fields].sort(), [...expectedFields].sort());
  assert.equal(new Set(fields).size, fields.length);
});

test("DB01 queue IDs preserve stable unique ordinal order", () => {
  queue.rows.forEach((row, index) => {
    assert.equal(row.queueId, `DB01-MISSING-${String(index + 1).padStart(3, "0")}`);
  });
});

test("every no-target field remains explicitly OPEN, never falsely verified", () => {
  for (const row of queue.rows) {
    assert.equal(row.status, "OPEN_SOURCE_ONLY", row.legacyField);
    assert.equal(row.currentRegisteredPresence, "NO_TARGET_PROPOSED");
    assert.equal(row.verifiedInVnext, false);
    assert.ok(activeStatuses.has(row.sourceActiveness));
  }
  assert.equal(queue.summary.implementationVerified, 0);
  assert.equal(queue.summary.postgresVerified, 0);
  assert.equal(queue.summary.providerVerified, 0);
});

test("DB04 learner and faculty fields have an explicit cross-domain handoff", () => {
  const fields = queue.rows.filter((r) => r.responsibleDomain === "DB04");
  assert.equal(fields.length, 76);
  assert.ok(fields.every((r) =>
    r.legacyField.startsWith("learner.") ||
    r.legacyField.startsWith("faculty.")
  ));
});

test("DB09 recruiter fields have an explicit shared DATABASE handoff", () => {
  const fields = queue.rows.filter((r) => r.responsibleDomain === "DB09");
  assert.equal(fields.length, 19);
  assert.ok(fields.every((r) => r.legacyField.startsWith("recruiter")));
});

test("DB01 auth/tenancy remaining fields are all assigned for a decision", () => {
  const fields = queue.rows.filter((r) => r.responsibleDomain === "DB01");
  assert.equal(fields.length, 78);
  assert.ok(fields.every((r) => r.decisionType.length > 0));
});

test("source queue summary counts match independently recalculated counts", () => {
  const byDomain = {};
  const byPriority = {};
  for (const row of queue.rows) {
    byDomain[row.responsibleDomain] =
      (byDomain[row.responsibleDomain] || 0) + 1;
    byPriority[row.priority] = (byPriority[row.priority] || 0) + 1;
  }
  assert.deepEqual(byDomain, queue.summary.byDomain);
  assert.deepEqual(byPriority, queue.summary.byPriority);
  assert.equal(Object.values(byDomain).reduce((a, b) => a + b, 0), 173);
});

test("raw bearer and OTP columns receive security priority, not naive mapping", () => {
  for (const id of [
    "auth_handoff_token.token", "auth_handoff_token.access_token",
    "auth_handoff_token.refresh_token", "mobile_login_attempt.otp",
    "mobile_login_attempt.email_otp", "user.password",
    "refresh_token_blocklist.jti",
  ]) {
    const item = queue.rows.find((r) => r.legacyField === id);
    assert.ok(item, id);
    assert.equal(item.priority, "P0_SECURITY_OR_AUTH_LIFECYCLE", id);
    assert.equal(item.currentRegisteredPresence, "NO_TARGET_PROPOSED", id);
  }
});

test("expired recruiter grant and deleted domain gaps stay high priority", () => {
  for (const id of ["recruiter_college_access.valid_until", "tenant_domain.is_deleted"]) {
    const item = queue.rows.find((r) => r.legacyField === id);
    assert.ok(item, id);
    assert.equal(item.priority, "P0_SECURITY_OR_AUTH_LIFECYCLE", id);
  }
});

test("queue cannot be mistaken for a global database phase certification", () => {
  assert.equal(queue.phase, "DATABASE");
  assert.equal(queue.status, "SOURCE_ONLY_NEEDS_DECISIONS_NOT_VERIFIED");
  assert.ok(queue.interpretation.some((line) => line.includes("not automatically")));
  assert.equal(queue.summary.postgresVerified, 0);
});
