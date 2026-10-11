import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(join(root, relative));
const json = (relative) => JSON.parse(read(relative).toString("utf8"));
const mapping = json("docs/planning/db01-chat02-auth-78-field-proposal-crosswalk.json");
const queue = json("docs/planning/db01-chat02-no-target-disposition-queue.json");
const rows = mapping.rows;
const byId = new Map(rows.map((row) => [row.sourceField, row]));
const gitBlob = (bytes) => createHash("sha1")
  .update(Buffer.from(`blob ${bytes.length}\0`))
  .update(bytes).digest("hex");

test("DB01 78 source mapping pins exact no-target queue Git blob", () => {
  assert.equal(gitBlob(read(mapping.sourceQueue)), mapping.sourceQueueGitBlob);
});
test("source field set equals DB01-owned 78 source no-target entries", () => {
  const expected = queue.rows.filter((row) => row.responsibleDomain === "DB01")
    .map((row) => row.legacyField).sort();
  assert.equal(expected.length, 78);
  assert.deepEqual([...byId.keys()].sort(), expected);
});
test("every DB01 source field appears once and stays unverified", () => {
  assert.equal(rows.length, 78);
  assert.equal(byId.size, 78);
  assert.ok(rows.every((row) => row.status === "SOURCE_REVIEW_ONLY" &&
    !row.providerAccepted && !row.postgresVerified));
});
test("proposed status categories are disjoint and exhaust all rows", () => {
  const expected = {
    STAGED_UNREGISTERED_TARGET_CANDIDATE: 55,
    OPEN_REDESIGN_OR_RETIREMENT_PROOF: 19,
    NORMALIZED_TARGET_CONSUMER_PROOF: 4,
  };
  const actual = {};
  for (const row of rows) {
    actual[row.proposedDisposition] =
      (actual[row.proposedDisposition] || 0) + 1;
  }
  assert.deepEqual(actual, expected);
  assert.deepEqual(actual, mapping.summary.byDisposition);
});
test("all ten legacy DB01 source tables remain represented", () => {
  assert.deepEqual(Object.keys(mapping.summary.byTable).sort(), [
    "auth_handoff_token", "college", "faculty_acct_verification",
    "learner_acct_verification", "mobile_login_attempt",
    "refresh_token_blocklist", "role", "tenant_domain", "user",
    "user_session",
  ]);
});
test("passwords and raw bearer tokens have no app DB target", () => {
  for (const field of [
    "user.password",
    "auth_handoff_token.access_token",
    "auth_handoff_token.refresh_token",
  ]) {
    const row = byId.get(field);
    assert.equal(row?.candidateTarget, null, field);
    assert.equal(row?.credentialOrContactSensitive, true, field);
  }
});
test("OTP challenges use keyed MAC candidates, never plaintext columns", () => {
  const expectations = {
    "mobile_login_attempt.otp": "identity_auth_attempts.sms_code_mac",
    "mobile_login_attempt.email_otp": "identity_auth_attempts.email_code_mac",
    "faculty_acct_verification.otp": "identity_auth_attempts.sms_code_mac",
    "learner_acct_verification.otp": "identity_auth_attempts.sms_code_mac",
  };
  for (const [source, target] of Object.entries(expectations)) {
    assert.equal(byId.get(source)?.candidateTarget, target);
    assert.equal(byId.get(source)?.credentialOrContactSensitive, true);
  }
});
test("device JTI is represented by keyed digest only", () => {
  for (const key of ["user_session.jti", "refresh_token_blocklist.jti"]) {
    assert.equal(byId.get(key)?.candidateTarget,
      "identity_device_sessions.credential_digest");
  }
});
test("cooldown/resend budget remain explicitly incomplete", () => {
  for (const kind of ["faculty", "learner"]) {
    const block = byId.get(`${kind}_acct_verification.blocked_till_ts`);
    assert.equal(block?.candidateTarget, null);
    assert.match(block?.reviewNote ?? "", /rate-limiting equivalence is unproved/);
    const budget = byId.get(`${kind}_acct_verification.max_resend_attempts`);
    assert.match(budget?.reviewNote ?? "", /no durable configurable resend ceiling/);
  }
});
test("legacy organization id is derived from canonical college owner", () => {
  assert.equal(byId.get("mobile_login_attempt.organization_id")?.candidateTarget,
    "colleges.organization_id");
  assert.match(byId.get("mobile_login_attempt.organization_id")?.reviewNote ?? "",
    /not client supplied/);
});
test("deletion history is staged rather than counted as live", () => {
  const domain = byId.get("tenant_domain.is_deleted");
  assert.equal(domain?.candidateTarget, "tenant_domains.deleted_at");
  assert.equal(domain?.proposedDisposition, "STAGED_UNREGISTERED_TARGET_CANDIDATE");
  assert.equal(mapping.summary.migrationAccepted, 0);
});
test("legacy user handle is not automatically a provider UID", () => {
  const user = byId.get("user.unique_id");
  assert.equal(user?.proposedDisposition, "NORMALIZED_TARGET_CONSUMER_PROOF");
  assert.match(user?.reviewNote ?? "", /not automatically equivalent/);
});
test("all unresolved decisions are listed explicitly with security exceptions", () => {
  const open = rows.filter((row) =>
    row.proposedDisposition === "OPEN_REDESIGN_OR_RETIREMENT_PROOF");
  assert.equal(open.length, 19);
  assert.deepEqual(mapping.summary.openDecisionSourceRows,
    open.map((row) => row.sourceField));
  assert.deepEqual(mapping.summary.openHighSecurityDecisionRows,
    open.filter((row) => row.priority === "P0_SECURITY_OR_AUTH_LIFECYCLE")
      .map((row) => row.sourceField));
  assert.ok(mapping.summary.openHighSecurityDecisionRows.includes(
    "user.password"));
});

test("no mapping silently declares PostgreSQL or provider verification", () => {
  assert.equal(mapping.summary.postgresVerified, 0);
  assert.equal(mapping.summary.providerConfirmed, 0);
  assert.ok(rows.every((row) => !row.postgresVerified && !row.providerAccepted));
});
test("staged target references have corresponding source declarations", () => {
  const sql = read("docs/planning/sql/db01-tenant-domain-tombstone-staging.sql").toString("utf8");
  const source = {
    identity_auth_attempts: read("src/db/schema/db01-auth-attempts.staged.ts").toString("utf8"),
    identity_auth_handoffs: read("src/db/schema/db01-auth-handoffs.staged.ts").toString("utf8"),
    identity_device_sessions: read("src/db/schema/db01-device-sessions.staged.ts").toString("utf8"),
  };
  for (const row of rows) {
    const target = row.candidateTarget;
    if (!target) continue;
    const [table, column] = target.split(".");
    if (source[table]) {
      assert.ok(source[table].includes(`("${column}"`),
        `staged target column missing: ${row.sourceField} -> ${target}`);
    } else if (table === "tenant_domains" && column === "deleted_at") {
      assert.match(sql, /ADD COLUMN deleted_at timestamptz/);
    }
  }
});
