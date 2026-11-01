import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {auditP11Checkout,auditP11RegisteredTargets} from
  "../scripts/db019-p11-registered-target-review.mjs";

const read=p=>readFileSync(p,"utf8");
const original={
  inventory:JSON.parse(read("docs/planning/db-pass4-columns-db06_assessments_and_attendance.json")),
  review:JSON.parse(read("docs/planning/database-parity-db06-field-reconciliation.json")),
  filesSchema:read("src/db/schema/storage-files.ts"),
  gradeSchema:read("src/db/schema/db06-history-staged.ts"),
  submissionService:read("src/modules/courses/assignment-submission-service.ts"),
};
const run=delta=>auditP11RegisteredTargets({...original,...delta});
const has=(result,code)=>result.errors.some(e=>e.code===code);

test("P11 exact 55 source fields refer to registered DB016/045 targets, not DB053 staging",()=>{
  const result=auditP11Checkout(".");
  assert.deepEqual(result.errors,[]);
  assert.equal(result.fields,55);
  assert.equal(result.valid,true);
  assert.equal(result.sourceOnly,true);
  assert.equal(result.postgresqlVerified,false);
  assert.equal(result.acceptanceReady,false);
});
test("P11 rejects staged receipt target promoted into live source review",()=>{
  const review=structuredClone(original.review);
  review.tables.find(t=>t.legacyTable==="assignment_upload_receipt")
    .fields.find(f=>f.legacyField==="storage_key")
    .targetRef="course_upload_receipts.object_key";
  assert.ok(has(run({review}),"P11_UNREGISTERED_DB053_TARGET"));
});
test("P11 rejects an unregistered grade-history gap that erases current DB045 producer",()=>{
  const review=structuredClone(original.review);
  review.tables.find(t=>t.legacyTable==="grade_audit_log")
    .fields.find(f=>f.legacyField==="action").decision="TARGET_GAP_REQUIRED";
  assert.ok(has(run({review}),"P11_REGISTERED_GRADE_EVENT_TARGET_MISSING"));
});
test("P11 rejects invented runtime attestation and changed frozen source identity",()=>{
  const review=structuredClone(original.review);
  review.tables.find(t=>t.legacyTable==="student_assignment")
    .fields.find(f=>f.legacyField==="points_obtained").runtimeVerified=true;
  assert.ok(has(run({review}),"P11_SOURCE_DECISION_OR_FALSE_RUNTIME_PROOF"));
  const inventory=structuredClone(original.inventory);
  inventory.sourceSha="0".repeat(40);
  assert.ok(has(run({inventory}),"P11_FROZEN_ORACLE_DRIFT"));
});
test("P11 refuses dropped and duplicated field dispositions",()=>{
  const review=structuredClone(original.review);
  const table=review.tables.find(t=>t.legacyTable==="assignment_upload_receipt");
  table.fields[0].legacyField=table.fields[1].legacyField;
  assert.ok(has(run({review}),"P11_DUPLICATE_REVIEW_FIELD"));
  assert.ok(has(run({review}),"P11_MISSING_SOURCE_FIELD"));
});
test("P11 refuses disappearance of registered physical tables and the live producer",()=>{
  assert.ok(has(run({filesSchema:original.filesSchema.replace('"assignment_submission_files"','"staged_only"')}),"P11_TYPED_REGISTERED_TARGET_MISSING"));
  assert.ok(has(run({submissionService:original.submissionService.replace("submitAssignmentWithFiles(context, assignmentId","unregisteredStagedCall(context, assignmentId")}),"P11_LIVE_PRODUCER_CUTOVER_MISSING"));
});
