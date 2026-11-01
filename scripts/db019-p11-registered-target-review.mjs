#!/usr/bin/env node
// DB19-P11: protect the 55-field active source crosswalk against stale DB053
// proposals or fabricated runtime proof. This is source integrity only.
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";

const TABLES = Object.freeze({
  assignment_upload_receipt: 19,
  grade_audit_log: 9,
  student_assignment: 27,
});
const FROZEN = "21bad59d4dfaf2fa11fdeaf9353327ce105697d5";

export function auditP11RegisteredTargets({inventory,review,filesSchema,gradeSchema,submissionService}) {
  const errors = [];
  const fail=(code,id)=>errors.push({code,...(id?{id}:{})});
  if(inventory?.sourceSha!==FROZEN || review?.sourceSha!==FROZEN ||
     review?.legacyBackendSha!==FROZEN)fail("P11_FROZEN_ORACLE_DRIFT");
  const source = new Map(), reviewed = new Set();
  for(const [name,expected] of Object.entries(TABLES)){
    const table=(inventory.tables||[]).filter(t=>t.table===name);
    const result=(review.tables||[]).filter(t=>t.legacyTable===name);
    if(table.length!==1||result.length!==1||
      table[0]?.rows?.length!==expected||result[0]?.fields?.length!==expected){
      fail("P11_TABLE_OR_SOURCE_FIELD_COUNT_DRIFT",name);continue;
    }
    for(const f of table[0].rows||[]){
      const id=name+"."+f.legacyColumn;
      if(source.has(id))fail("P11_DUPLICATE_SOURCE_FIELD",id);
      source.set(id,f);
    }
    for(const f of result[0].fields||[]){
      const id=name+"."+f.legacyField;
      if(reviewed.has(id))fail("P11_DUPLICATE_REVIEW_FIELD",id);
      reviewed.add(id);
      const original=source.get(id);
      if(!original || original.sourceType!==f.sourceType ||
         typeof f.decision!=="string" || !f.decision ||
         typeof f.reason!=="string" || !f.reason ||
         typeof f.targetRef!=="string" || !f.targetRef ||
         f.runtimeVerified!==false)
        fail("P11_SOURCE_DECISION_OR_FALSE_RUNTIME_PROOF",id);
      if(/course_upload_receipts[.\s]/.test(f.targetRef))
        fail("P11_UNREGISTERED_DB053_TARGET",id);
      if(name==="assignment_upload_receipt" && f.legacyField!=="public_url" &&
        !/(assignment_submission_files|membership_roles)/.test(f.targetRef))
        fail("P11_REGISTERED_RECEIPT_TARGET_MISSING",id);
      if(name==="grade_audit_log" && (!f.targetRef.startsWith("assignment_grade_events.") ||
        !f.decision.startsWith("REGISTERED_DB045_")))
        fail("P11_REGISTERED_GRADE_EVENT_TARGET_MISSING",id);
    }
  }
  if(source.size!==55||reviewed.size!==55)
    fail("P11_55_FIELD_COVERAGE_MISSING");
  for(const id of source.keys())if(!reviewed.has(id))fail("P11_MISSING_SOURCE_FIELD",id);
  if(!filesSchema.includes('pgTable(\n  "assignment_submission_files"') ||
     !filesSchema.includes('uploadExpiresAt: timestamp("upload_expires_at"') ||
     !filesSchema.includes('submissionId: uuid("submission_id")') ||
     !filesSchema.includes('scanStatus: varchar("scan_status"') ||
     !gradeSchema.includes('pgTable(\n  "assignment_grade_events"') ||
     !gradeSchema.includes('submissionVersionAfter: integer("submission_version_after"'))
    fail("P11_TYPED_REGISTERED_TARGET_MISSING");
  if(!submissionService.includes("submitAssignmentWithFiles(context, assignmentId") ||
     !submissionService.includes("appendAssignmentGradeEvent(tx,context"))
    fail("P11_LIVE_PRODUCER_CUTOVER_MISSING");
  return {
    valid:errors.length===0,
    fields:source.size,
    sourceOnly:true,
    postgresqlVerified:false,
    acceptanceReady:false,
    errors,
  };
}
export function auditP11Checkout(root) {
  const read=p=>fs.readFileSync(path.join(root,p),"utf8");
  return auditP11RegisteredTargets({
    inventory:JSON.parse(read("docs/planning/db-pass4-columns-db06_assessments_and_attendance.json")),
    review:JSON.parse(read("docs/planning/database-parity-db06-field-reconciliation.json")),
    filesSchema:read("src/db/schema/storage-files.ts"),
    gradeSchema:read("src/db/schema/db06-history-staged.ts"),
    submissionService:read("src/modules/courses/assignment-submission-service.ts"),
  });
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const r=auditP11Checkout(path.resolve(process.argv[2]||"."));
  console.log(JSON.stringify(r,null,2));
  if(!r.valid)process.exitCode=2;
}
