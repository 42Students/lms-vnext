import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const staged = fs.readFileSync(
  "src/db/schema/db04-profile-education-images.staged.ts",
  "utf8",
);
const schemaIndex = fs.readFileSync("src/db/schema/index.ts", "utf8");
const stagedSql = fs.readFileSync(
  "docs/planning/db04-proposed-migration.sql",
  "utf8",
);
const verificationSchema = fs.readFileSync(
  "src/db/schema/profile-verification.ts",
  "utf8",
);

test("DB-007 normalized education and image models are explicitly registered", () => {
  assert.match(staged, /REGISTERED/);
  assert.match(schemaIndex, /db04-profile-education-images\.staged/);
});

test("DB04 education staging preserves active qualification semantics", () => {
  assert.match(staged, /learner_profile_education_entries/);
  assert.match(staged, /isCurrentlyPursuing/);
  assert.match(staged, /isRecentEducation/);
  assert.match(staged, /'CGPA','GPA','Percentage','Grade'/);
  assert.match(staged, /learner_profile_education_recent_uq/);
  assert.match(staged, /learner_profile_education_pursuing_ck/);
});

test("DB04 education evidence and profile images bind receipts to the same owner", () => {
  assert.match(staged, /learner_profile_education_documents_receipt_fk/);
  assert.match(staged, /learner_profile_images_receipt_fk/);
  assert.match(
    staged,
    /profilePrivateDocumentReceipts\.owningMembershipId/,
  );
  assert.match(staged, /profilePrivateDocumentReceipts\.purpose/);
  assert.match(staged, /receiptPurpose.*PROFILE_IMAGE/s);
});

test("DB04 premerge SQL stages receipt parent keys required by composite FKs", () => {
  assert.match(stagedSql, /profile_private_doc_id_owner_uq/);
  assert.match(stagedSql, /profile_private_doc_id_owner_purpose_uq/);
  assert.match(stagedSql, /learner_profile_education_documents_receipt_fk/);
  assert.match(stagedSql, /learner_profile_images_receipt_fk/);
});


test("DB04 staged receipt schema exposes the composite parent identities", () => {
  assert.match(verificationSchema, /profile_private_doc_id_owner_uq/);
  assert.match(verificationSchema, /profile_private_doc_id_owner_purpose_uq/);
  assert.match(verificationSchema, /profile_private_doc_object_key_ck/);
  assert.match(verificationSchema, /private\/\[A-Za-z0-9_\/-\]\+/);
  assert.match(verificationSchema, /profile_private_doc_generation_ck/);
  assert.match(verificationSchema, /\^\[0-9\]\+\$/);
  assert.match(verificationSchema, /profile_private_doc_sha256_ck/);
  assert.match(verificationSchema, /\{64\}/);
});
