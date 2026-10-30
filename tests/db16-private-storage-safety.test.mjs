import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const text = p => fs.readFileSync(path.join(root, p), "utf8");

const schemaBarrel = text("src/db/schema/index.ts");
const verifiedProfileSchema = text("src/db/schema/profile-verification.ts");
const learnerProfileService = text("src/modules/people/profile-service.ts");
const learnerProfileRepo = text("src/modules/people/profile-repository.ts");
const verificationDomain = text("src/modules/profile-verification/domain.ts");
const privateStorage = text("src/modules/storage/private-object-storage.ts");
const assignmentFiles = text("src/modules/courses/assignment-file-service.ts");
const projectValidation = text("src/modules/projects/validation.ts");
const overlay = text("docs/planning/sql/db16-private-object-receipt-overlay-candidate.sql");
const reconciliation = text("docs/planning/database-parity-db16-private-storage-safety.md");

test("DB16 keeps raw national identity persistence fail-closed", () => {
  assert.match(learnerProfileService, /PRIVATE_IDENTITY_STORAGE_NOT_READY/);
  assert.match(learnerProfileRepo, /PRIVATE_IDENTITY_STORAGE_NOT_READY/);
  assert.match(verificationDomain, /UNSAFE_SNAPSHOT/);
  assert.match(verificationDomain, /aadhaarNumber\|panNumber\|identityNumber/);
});

test("registered DB04 verification remains distinct from unregistered DB06 assignment receipts", () => {
  assert.match(schemaBarrel, /export \* from "\.\/profile-verification"/);
  assert.match(verifiedProfileSchema, /profilePrivateDocumentReceipts = pgTable/);
  assert.match(verifiedProfileSchema, /privateObjectKey: text\("private_object_key"\)/);
  assert.doesNotMatch(schemaBarrel, /course-upload-receipts-staged/);
  assert.match(assignmentFiles, /DB06_ASSIGNMENT_FILES_MIGRATIONS_PENDING/);
});

test("shared private storage is tenant/member scoped and fail-closed on public access", () => {
  // R2 uses a validated five-segment key; it has no GCS UBLA/PAP fields.
  assert.match(privateStorage, /\["private", input\.collegeId, input\.ownerMembershipId, input\.namespace, objectId\]\.join\("\/"\)/);
  assert.match(privateStorage, /function assertScopedKey/);
  assert.match(privateStorage, /parts\[1\] !== expected\.collegeId/);
  assert.match(privateStorage, /parts\[2\] !== expected\.ownerMembershipId/);
  assert.match(privateStorage, /getPrivateR2Config/);
  assert.match(privateStorage, /PRIVATE_STORAGE_OBJECT_NOT_ATTESTED/);
  assert.match(privateStorage, /lms-vnext-privileged-scanner/);
  assert.match(privateStorage, /"malware-scan-status"\] !== "CLEAN"/);
  assert.match(privateStorage, /sha256/);
  assert.match(privateStorage, /generation/);
});

test("project persisted URLs remain explicit external HTTP(S) links", () => {
  assert.match(projectValidation, /Project resource URL must use http or https/);
  assert.match(projectValidation, /Task submission URL must use http or https/);
  assert.match(projectValidation, /sourceUrl: optionalHttpUrlSchema/);
  assert.match(reconciliation, /EXTERNAL LINK ONLY TODAY/);
});

test("DB16 overlay records auditable revocation and retention instead of a boolean-only state", () => {
  assert.match(overlay, /revoked_by_user_id/);
  assert.match(overlay, /revocation_reason/);
  assert.match(overlay, /retention_until/);
  assert.match(overlay, /scan_attested_by/);
  assert.match(overlay, /scan_attested_at/);
  assert.match(overlay, /deletion_requested_at/);
  assert.match(overlay, /object identity is immutable/);
});

test("DB16 refuses to invent membership ownership for bug reporter screenshots", () => {
  assert.match(overlay, /reporter-access/);
  assert.match(overlay, /refuses[\s\S]{0,120}to fabricate college\/member ownership/);
  assert.match(reconciliation, /NEED ISSUE\/REPORTER PRIVATE OWNER CONTRACT/);
});

test("DB16 does not claim encryption configuration verification from schema alone", () => {
  assert.match(reconciliation, /do not mark [“"]encryption controls verified[”"]/i);
  assert.match(reconciliation, /CMEK/);
  assert.match(overlay, /Schema cannot prove the bucket\/database encryption configuration/);
});
