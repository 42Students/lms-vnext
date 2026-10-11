import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const load = p => readFileSync(resolve(root, p));
const json = p => JSON.parse(load(p).toString("utf8"));
const blobSha = buf => createHash("sha1").update(Buffer.from("blob " + buf.byteLength + "\0")).update(buf).digest("hex");
const file = json("docs/planning/db01-auth-security-p0-field-crosswalk.json");
const queue = json(file.source.noTargetQueue);
const triage = json(file.source.sourceTriage);
const expected = queue.rows.filter(r => r.priority === "P0_SECURITY_OR_AUTH_LIFECYCLE");
const fields = file.rows.map(r => r.legacyField);
const expectedFields = expected.map(r => r.legacyField);
const owner = new Map(expected.map(r => [r.legacyField, r.responsibleDomain]));
const src = new Map(triage.rows.map(r => [r.legacyTable + "." + r.legacyColumn, r]));

test("DB01 P0 crosswalk pins exact source blobs", () => {
  assert.equal(blobSha(load(file.source.noTargetQueue)), file.source.queueBlobSha);
  assert.equal(blobSha(load(file.source.sourceTriage)), file.source.triageBlobSha);
});
test("all 38 highest-priority active no-target security fields included once", () => {
  assert.equal(expected.length, 38);
  assert.deepEqual(fields, expectedFields);
  assert.equal(new Set(fields).size, 38);
  assert.equal(file.counts.rows, 38);
});
test("P0 rows preserve correct DB01/DB04/DB09 ownership", () => {
  for (const row of file.rows) assert.equal(row.ownerDomain, owner.get(row.legacyField));
  assert.deepEqual(file.counts.byDomain, { DB01: 33, DB04: 2, DB09: 3 });
});
test("crosswalk is neither migration nor runtime/provider approval", () => {
  for (const row of file.rows) {
    assert.equal(row.approvedRetirement, false);
    assert.equal(row.registeredMigration, false);
    assert.equal(row.runtimeSemanticVerified, false);
    assert.equal(row.providerVerified, false);
    assert.equal(row.review.requiresRuntimeEvidence, true);
    assert.equal(row.status, "POLICY_CROSSWALK_DRAFT_NOT_ACCEPTED");
  }
  assert.equal(file.counts.runtimeVerified, 0);
  assert.equal(file.counts.registeredMigrations, 0);
  assert.equal(file.counts.providerVerified, 0);
  assert.equal(file.counts.approvedRetirements, 0);
});
test("raw legacy bearer tokens and passwords must not persist in normalized design", () => {
  for (const f of ["auth_handoff_token.access_token","auth_handoff_token.refresh_token","user.password"]) {
    const row = file.rows.find(r => r.legacyField === f);
    assert.ok(row, f);
    assert.equal(row.review.policy, "SECURITY_RETIREMENT_PROPOSED");
    assert.equal(row.review.candidate, null);
    assert.equal(row.review.mustNotStoreRaw, true);
    assert.equal(row.approvedRetirement, false);
  }
});
test("raw six-digit legacy codes map only to keyed or explicitly undecided provider proof", () => {
  for (const f of ["mobile_login_attempt.otp","mobile_login_attempt.email_otp","faculty_acct_verification.otp","learner_acct_verification.otp"]) {
    const r = file.rows.find(row => row.legacyField === f);
    assert.ok(r && r.review.mustNotStoreRaw, f);
    assert.ok(r.review.candidate === null || /\.([a-z_]*code_mac)$/.test(r.review.candidate), f);
  }
});
test("provider revocation cannot silently be interpreted as current platform status", () => {
  for (const f of ["faculty.token_version","learner.token_version","recruiter.token_version","refresh_token_blocklist.jti"]) {
    const r = file.rows.find(row => row.legacyField === f);
    assert.ok(r, f);
    assert.match(r.review.policy, /REVIEW|PENDING/);
    assert.equal(r.runtimeSemanticVerified, false);
  }
});
test("account-verification workflow never conflated with login verification", () => {
  const xs = file.rows.filter(r => /^(faculty|learner)_acct_verification\./.test(r.legacyField));
  assert.equal(xs.length, 12);
  assert.ok(xs.every(r => r.review.policy === "SEPARATE_ACCOUNT_VERIFICATION_PROVIDER_DECISION"));
});
test("recruiter grant expiration/capabilities handoff to DB09", () => {
  for (const f of ["recruiter_college_access.valid_until","recruiter_college_access_capability.capability"]) {
    const row = file.rows.find(r => r.legacyField === f);
    assert.equal(row.ownerDomain, "DB09");
    assert.equal(row.registeredMigration, false);
  }
});
test("active hostname tombstone is staged rather than declared applied", () => {
  const row = file.rows.find(r => r.legacyField === "tenant_domain.is_deleted");
  assert.equal(row.review.candidate, "tenant_domains.deleted_at");
  assert.equal(row.registeredMigration, false);
});
test("field source evidence remains traceable to pinned source triage", () => {
  for (const row of file.rows) {
    const s = src.get(row.legacyField);
    assert.ok(s);
    assert.equal(s.postV150Active, row.sourceStatus);
    assert.equal(row.currentSourceEvidenceGap, row.sourcePaths.length === 0, row.legacyField);
  }
});
test("three historical-DDL-only fields remain flagged for named producer/consumer proof", () => {
  assert.equal(file.counts.currentSourceEvidenceGaps, 3);
  assert.deepEqual(file.currentSourceEvidenceGapFields, [
    "role.is_deleted",
    "tenant_domain.is_deleted",
    "user.password",
  ]);
  for (const f of file.currentSourceEvidenceGapFields) {
    const row = file.rows.find(r => r.legacyField === f);
    assert.ok(row.currentSourceEvidenceGap);
    assert.equal(row.runtimeSemanticVerified, false);
  }
});
test("all crosswalk policy decisions have explicit reasoning and a handoff artifact", () => {
  for (const r of file.rows) {
    assert.ok(r.review.explanation.length >= 60, r.legacyField);
    assert.ok(r.review.evidenceArtifact.startsWith("docs/planning/"), r.legacyField);
    assert.ok(r.review.policy && r.review.policy.length >= 12);
  }
});
