import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const staged = fs.readFileSync(
  "src/db/schema/course-upload-receipts-staged.ts",
  "utf8",
);
const sql = fs.readFileSync(
  "docs/planning/sql/db06-assignment-upload-receipt-hardening-candidate.sql",
  "utf8",
);
const contract = fs.readFileSync(
  "docs/planning/database-parity-db06-assignment-upload-receipt-contract.md",
  "utf8",
);
const barrel = fs.readFileSync(
  "src/db/schema/index.ts",
  "utf8",
);
const journal = JSON.parse(
  fs.readFileSync("drizzle/meta/_journal.json", "utf8"),
);
const readiness = fs.readFileSync(
  "src/modules/courses/assignment-file-readiness.ts",
  "utf8",
);
const fileService = fs.readFileSync(
  "src/modules/courses/assignment-file-service.ts",
  "utf8",
);
const submissionService = fs.readFileSync(
  "src/modules/courses/assignment-submission-service.ts",
  "utf8",
);
const privateStorage = fs.readFileSync(
  "src/modules/storage/private-object-storage.ts",
  "utf8",
);
const db16Overlay = fs.readFileSync(
  "docs/planning/sql/db16-private-object-receipt-overlay-candidate.sql",
  "utf8",
);

test("DB053 private assignment upload schema remains source-only and fail-closed", () => {
  assert.match(
    staged,
    /DB-053 \/ DB06 SOURCE-ONLY staged private upload receipts\/files/,
  );
  assert.doesNotMatch(
    barrel,
    /course-upload-receipts-staged/,
  );
  assert.equal(
    journal.entries.some((entry) =>
      /course.*upload.*receipt|assignment.*upload.*receipt/i.test(entry.tag),
    ),
    false,
  );
  // Storage redesign (migration 0080): the old DB06 receipt flag is obsolete;
  // runtime enablement now requires the private R2 bucket configuration.
  assert.doesNotMatch(readiness, /DB06_ASSIGNMENT_FILES_READY/);
  assert.match(readiness, /R2_PRIVATE_BUCKET/);
  assert.match(
    fs.readFileSync("src/app/api/courses/assignments/[assignmentId]/file-upload/route.ts", "utf8"),
    /DB06_ASSIGNMENT_FILES_MIGRATIONS_PENDING/,
  );
});

test("DB053 receipt persists exact delivery and full private-object lifecycle evidence", () => {
  for (const token of [
    'deliveryId: uuid("delivery_id")',
    'scanStatus: varchar("scan_status"',
    'scanAttestedBy: varchar("scan_attested_by"',
    'scanAttestedAt: timestamp("scan_attested_at"',
    'revokedAt: timestamp("revoked_at"',
    'revokedByUserId: uuid("revoked_by_user_id")',
    'revocationReason: varchar("revocation_reason"',
    'retentionUntil: timestamp("retention_until"',
    'deletionRequestedAt: timestamp("deletion_requested_at"',
    'deletedAt: timestamp("deleted_at"',
  ]) {
    assert.ok(staged.includes(token), token);
  }
  assert.match(
    staged,
    /lms-vnext-privileged-scanner/,
  );
  assert.match(
    staged,
    /attestedGeneration} ~ \\'\^\[0-9\]\+\$\\'/,
  );
});

test("DB053 receipt object key token filename expiry and retention are fail-closed", () => {
  for (const name of [
    "course_upload_receipts_object_scope_ck",
    "course_upload_receipts_token_hash_ck",
    "course_upload_receipts_original_name_ck",
    "course_upload_receipts_declared_content_type_ck",
    "course_upload_receipts_declared_size_ck",
    "course_upload_receipts_expiry_ck",
    "course_upload_receipts_scan_attestation_ck",
    "course_upload_receipts_consumed_ck",
    "course_upload_receipts_revocation_ck",
    "course_upload_receipts_retention_ck",
    "course_upload_receipts_deletion_ck",
  ]) {
    assert.ok(staged.includes(name), name);
  }
  assert.match(
    staged,
    /retentionUntil} >= \$\{table\.consumedAt\}/,
  );
  assert.match(
    staged,
    /deletionRequestedAt} >= \$\{table\.retentionUntil\}/,
  );
});

test("DB053 supports ordered multi-file submissions instead of one file per submission", () => {
  assert.match(
    staged,
    /id: uuid\("id"\)\.defaultRandom\(\)\.primaryKey\(\)/,
  );
  assert.match(
    staged,
    /assignmentSubmissionId: uuid\("assignment_submission_id"\)\.notNull\(\)/,
  );
  assert.match(
    staged,
    /sequence: integer\("sequence"\)\.notNull\(\)/,
  );
  assert.match(
    staged,
    /assignment_submission_files_submission_sequence_uq/,
  );
  assert.match(
    staged,
    /course_upload_receipts_submission_idx/,
  );
  assert.doesNotMatch(
    staged,
    /course_upload_receipts_submission_uq/,
  );
  assert.match(
    contract,
    /submission_assets[\s\S]{0,80}\*\*list\*\*/i,
  );
  assert.match(
    contract,
    /multiple distinct receipts may bind to one submission/i,
  );
});

test("DB053 file evidence has an exact consumed-attestation composite FK", () => {
  assert.match(
    staged,
    /course_upload_receipts_consumed_attestation_uq/,
  );
  assert.match(
    staged,
    /assignment_submission_files_consumed_attestation_fk/,
  );
  for (const token of [
    "table.uploadReceiptId",
    "table.assignmentSubmissionId",
    "table.objectKey",
    "table.objectGeneration",
    "table.mimeType",
    "table.sizeBytes",
    "table.sha256Hex",
    "courseUploadReceipts.consumedBySubmissionId",
    "courseUploadReceipts.attestedGeneration",
    "courseUploadReceipts.actualContentType",
    "courseUploadReceipts.actualSizeBytes",
    "table.originalName",
    "courseUploadReceipts.originalName",
  ]) {
    assert.ok(staged.includes(token), token);
  }
});

test("DB053 SQL reuses registered learner roster integrity and binds exact delivery", () => {
  assert.match(
    sql,
    /PERFORM db06_guard_learner_delivery\([\s\S]*NEW\.delivery_id[\s\S]*NEW\.owner_membership_id/,
  );
  assert.match(
    sql,
    /submission_delivery IS DISTINCT FROM NEW\.delivery_id/,
  );
  assert.match(
    sql,
    /assignment upload receipt delivery mismatch/,
  );
  assert.match(
    sql,
    /receipt granted for delivery A cannot be consumed in delivery B/,
  );
});

test("DB053 SQL mirrors the active assignment file MIME allowlist", () => {
  for (const mime of [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
    "application/rtf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/zip",
  ]) {
    assert.ok(sql.includes(`'${mime}'`), mime);
  }
  assert.match(
    sql,
    /assignment upload receipt MIME type is not allowed/,
  );
});

test("DB053 receipt lifecycle is one-way and immutable where identity matters", () => {
  for (const token of [
    "upload receipt grant/object identity is immutable",
    "upload receipt scan result is immutable",
    "upload receipt object attestation is immutable",
    "revoked upload receipt cannot be restored",
    "upload receipt retention cannot move backwards",
    "upload receipt deletion request is immutable",
    "upload receipt deletion completion is immutable",
    "consumed upload receipt cannot be reassigned",
  ]) {
    assert.ok(sql.includes(token), token);
  }
});

test("DB053 consumption validates exact submission owner audience attestation and retention", () => {
  for (const token of [
    "submission_type <> 'FILE'",
    "submission_assignment IS DISTINCT FROM NEW.assignment_id",
    "submission_delivery IS DISTINCT FROM NEW.delivery_id",
    "submission_membership IS DISTINCT FROM NEW.owner_membership_id",
    "submission_college IS DISTINCT FROM NEW.college_id",
    "NEW.actual_content_type IS DISTINCT FROM NEW.declared_content_type",
    "NEW.actual_size_bytes IS DISTINCT FROM NEW.declared_size_bytes",
    "NEW.scan_attested_by <> 'lms-vnext-privileged-scanner'",
    "NEW.retention_until IS NULL",
  ]) {
    assert.ok(sql.includes(token), token);
  }
});

test("DB053 receipt and immutable file evidence reject destructive mutation", () => {
  for (const trigger of [
    "db06_assignment_submission_files_no_update_delete",
    "db06_assignment_submission_files_no_truncate",
    "db06_course_upload_receipts_no_delete",
    "db06_course_upload_receipts_no_truncate",
  ]) {
    assert.match(
      sql,
      new RegExp(`CREATE TRIGGER ${trigger}`),
    );
  }
  assert.match(
    sql,
    /assignment private-file evidence is immutable/,
  );
});

test("DB053 explicitly records current producer/read cutover gaps instead of enabling runtime", () => {
  const fileInsert = submissionService.indexOf(
    ".insert(assignmentSubmissionFiles)",
  );
  const receiptUpdate = submissionService.indexOf(
    ".update(courseUploadReceipts)",
  );
  assert.ok(fileInsert >= 0);
  // The receipt claim is conditional and precedes its immutable file evidence
  // in the same transaction. A failed claim cannot create a file row.
  assert.ok(receiptUpdate >= 0);
  assert.ok(fileInsert > receiptUpdate);
  assert.match(submissionService.slice(receiptUpdate,fileInsert),
    /if \(!claimed\)[\s\S]*ASSIGNMENT_UPLOAD_RECEIPT_INVALID/);

  assert.doesNotMatch(
    privateStorage,
    /scanAttestedAt/,
  );
  assert.match(
    contract,
    /insert submission[\s\S]*consume[\s\S]*receipt[\s\S]*insert[\s\S]*file/i,
  );
  assert.match(
    contract,
    /Do not use Date\.now\(\).*fake scanner attestation time/i,
  );
  assert.match(
    contract,
    /read path must join\/read course_upload_receipts/i,
  );
});

test("DB053 documents DB16 overlap rather than double-promoting its DB06 ALTERs", () => {
  assert.match(
    db16Overlay,
    /DB06 assignment\/course upload receipts/,
  );
  assert.match(
    contract,
    /supersedes only the DB06 course-upload-receipt portion/i,
  );
  assert.match(
    sql,
    /supersedes only the DB06 course_upload_receipts section/i,
  );
});


test("DB053 consumed evidence remains valid after later revocation", () => {
  const consumedStart = staged.indexOf(
    'check("course_upload_receipts_consumed_ck"',
  );
  const consumedEnd = staged.indexOf(
    'check("course_upload_receipts_revocation_ck"',
    consumedStart,
  );
  assert.ok(consumedStart >= 0);
  assert.ok(consumedEnd > consumedStart);
  const consumed = staged.slice(consumedStart, consumedEnd);

  assert.doesNotMatch(consumed, /revoked} = false/);
  assert.doesNotMatch(consumed, /revokedAt} is null/);
  assert.match(
    consumed,
    /consumedAt} >= \$\{table\.scanAttestedAt\}/,
  );
  assert.match(
    consumed,
    /consumedAt} <= \$\{table\.expiresAt\}/,
  );
  assert.match(
    contract,
    /Post-consumption revocation is valid/,
  );
});

test("DB053 terminal scan outcome keeps immutable scanner evidence", () => {
  assert.match(
    staged,
    /scanStatus} = \\'PENDING\\'[\s\S]*scanAttestedBy} is null[\s\S]*scanStatus} in \(\\'CLEAN\\',\\'REJECTED\\'\)[\s\S]*lms-vnext-privileged-scanner/,
  );
  assert.match(
    sql,
    /upload receipt scan attestation evidence is immutable/,
  );
  assert.match(
    sql,
    /new upload receipt must start pending and unused/,
  );
});

test("DB053 revocation authority is owner-before-consume or persisted admin", () => {
  assert.match(
    sql,
    /NEW\.revoked_by_user_id = owner_user[\s\S]*OLD\.consumed_at IS NULL/,
  );
  assert.match(
    sql,
    /sr\.role = 'SUPER_ADMIN'/,
  );
  assert.match(
    sql,
    /mr\.role = 'COLLEGE_ADMIN'/,
  );
  assert.match(
    sql,
    /revoker lacks owner\/admin authority/,
  );
  assert.match(
    sql,
    /revocation evidence is immutable/,
  );
  assert.match(
    sql,
    /deletion requires prior revocation/,
  );
  assert.match(
    contract,
    /does not invent FACULTY revocation authority/,
  );
});

test("DB053 deferred completeness closes dangling FILE and consumed-receipt states", () => {
  for (const trigger of [
    "db06_assignment_submission_file_set_required",
    "db06_consumed_receipt_file_row_required",
  ]) {
    assert.match(
      sql,
      new RegExp(`CREATE CONSTRAINT TRIGGER ${trigger}`),
    );
  }
  assert.match(
    sql,
    /DEFERRABLE INITIALLY DEFERRED/,
  );
  assert.match(
    sql,
    /FILE submission requires at least one immutable file row/,
  );
  assert.match(
    sql,
    /consumed assignment receipt requires immutable file row/,
  );
  assert.match(
    contract,
    /Deferred relational completeness/,
  );
});

test("DB053 read revocation remains an explicit runtime activation blocker", () => {
  assert.match(
    contract,
    /createAssignmentFileReadGrant[\s\S]*does not re-check the linked receipt lifecycle/,
  );
  assert.match(
    sql,
    /createAssignmentFileReadGrant must join the receipt and refuse signed reads/,
  );
  assert.doesNotMatch(readiness, /DB06_ASSIGNMENT_FILES_READY/);
  assert.match(readiness, /R2_PRIVATE_BUCKET/);

  const readGrantStart = fileService.indexOf(
    "export async function createAssignmentFileReadGrant",
  );
  assert.ok(readGrantStart >= 0);
  const readGrant = fileService.slice(readGrantStart);
  assert.match(readGrant, /assignmentSubmissionFiles/);
  assert.doesNotMatch(readGrant, /courseUploadReceipts/);
});


test("DB053 deferred completeness prevents dangling FILE submissions and consumed receipts", () => {
  for (const trigger of [
    "db06_assignment_submission_file_set_required",
    "db06_consumed_receipt_file_row_required",
  ]) {
    assert.match(
      sql,
      new RegExp(`CREATE CONSTRAINT TRIGGER ${trigger}`),
    );
  }
  assert.ok(
    (sql.match(/DEFERRABLE INITIALLY DEFERRED/g) ?? []).length >= 2,
  );
  assert.match(
    sql,
    /FILE submission requires at least one immutable file row/,
  );
  assert.match(
    sql,
    /consumed assignment receipt requires immutable file row/,
  );
});

test("DB053 terminal scan evidence and revocation authority remain auditable", () => {
  assert.match(
    staged,
    /scanStatus} in \(\\'CLEAN\\',\\'REJECTED\\'\)[\s\S]*lms-vnext-privileged-scanner/,
  );
  assert.match(
    sql,
    /scan attestation evidence is immutable/,
  );
  assert.match(
    sql,
    /consumed upload receipt revocation requires COLLEGE_ADMIN or SUPER_ADMIN/,
  );
  assert.match(
    sql,
    /upload receipt revocation evidence is immutable/,
  );
  assert.match(
    contract,
    /consumed receipt may be revoked only by an active same-college COLLEGE_ADMIN or persisted active SUPER_ADMIN/i,
  );
});

test("DB053 receipt-to-file composite attestation pins original filename too", () => {
  const uniqueStart = staged.indexOf(
    "course_upload_receipts_consumed_attestation_uq",
  );
  const fkStart = staged.indexOf(
    "assignment_submission_files_consumed_attestation_fk",
  );
  assert.ok(uniqueStart >= 0);
  assert.ok(fkStart >= 0);
  assert.match(
    staged.slice(uniqueStart, uniqueStart + 600),
    /table\.originalName/,
  );
  assert.match(
    staged.slice(fkStart, fkStart + 1400),
    /table\.originalName[\s\S]*courseUploadReceipts\.originalName/,
  );
});
