import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const ledger=JSON.parse(fs.readFileSync(path.join(root,"docs/planning/db01-chat03-db02-academic-peer-review.json"),"utf8"));
const staged=fs.readFileSync(path.join(root,"src/db/schema/db02-learner-import-batches.staged.ts"),"utf8");
const sql=fs.readFileSync(path.join(root,"docs/planning/sql/db02-learner-import-batches-candidate.sql"),"utf8");

test("all six DB004 academic handoff rows are dispositioned",()=>{
  assert.equal(ledger.rows.length,6);
  assert.equal(ledger.counts.reviewed,6);
  assert.equal(ledger.counts.explicitDisposition,6);
  assert.equal(ledger.counts.unresolved,0);
});

test("legacy flat academic scope is normalized",()=>{
  assert.match(ledger.rows.find(x=>x.legacyField==="learner.class_id").proposedTarget,/section_enrollments/);
  assert.match(ledger.rows.find(x=>x.legacyField==="learner.program_id").proposedTarget,/learner_program_enrollments/);
  assert.match(ledger.rows.find(x=>x.legacyField==="learner.department").proposedTarget,/programs\.department_id/);
  assert.match(ledger.rows.find(x=>x.legacyField==="faculty.dept_id").proposedTarget,/primary_department_id/);
});

test("bulk import target preserves lineage without mass-delete semantics",()=>{
  const row=ledger.rows.find(x=>x.legacyField==="learner.bulk_import_batch_id");
  assert.match(row.proposedTarget,/learner_import_batch_members/);
  assert.match(row.note,/DISABLES generic batch undo|deliberately throws/i);
  assert.match(staged,/learner_import_batches/);
  assert.match(staged,/learner_import_batch_members/);
  assert.match(sql,/ON DELETE RESTRICT/g);
  assert.doesNotMatch(sql,/ON DELETE CASCADE/i);
  assert.doesNotMatch(sql,/DELETE FROM college_memberships/i);
});

test("import lineage enforces same-college member ownership",()=>{
  assert.match(staged,/learner_import_batch_members_membership_fk/);
  assert.match(sql,/FOREIGN KEY \(membership_id,college_id\)/);
  assert.match(sql,/REFERENCES college_memberships\(id,college_id\)/);
});
