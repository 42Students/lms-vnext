import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {auditDb06Triggers, migrations} from "../scripts/db06-registered-trigger-check.mjs";

const fixtures=Object.fromEntries(migrations.map(p=>[p,fs.readFileSync(p,"utf8")]));
const snapshot=JSON.parse(fs.readFileSync("drizzle/meta/0042_snapshot.json","utf8"));
const journal=JSON.parse(fs.readFileSync("drizzle/meta/_journal.json","utf8"));
const source41=migrations[0],source42=migrations[1];
const run=(files=fixtures,snap=snapshot,log=journal)=>auditDb06Triggers(files,snap,log);

test("registered 0041/0042 source catalog is internally consistent",()=>{
  const result=run();
  assert.equal(result.status,"SOURCE_PASS_NOT_PG",result.errors.join("\n"));
  assert.equal(result.errors.length,0);
  assert.equal(result.registrationChecked,2);
  assert.equal(result.triggerCount,11);
  assert.ok(result.functionCount>=10);
  assert.match(result.warnings.join("\n"),/max_points correctly guarded/);
});

test("missing registered migration entry fails closed",()=>{
  const j={...journal,entries:journal.entries.filter(e=>e.tag!=="0042_db06_assessment_scope_hardening")};
  assert.match(run(fixtures,snapshot,j).errors.join("\n"),/Journal missing: 0042/);
});

test("missing second migration file fails closed",()=>{
  const f={...fixtures};delete f[source42];
  assert.match(run(f).errors.join("\n"),/Missing SQL: drizzle\/0042/);
});

test("missing hardening trigger replacement fails closed",()=>{
  const f={...fixtures,[source42]:fixtures[source42].replace(
    /CREATE TRIGGER db06_course_assignment_parent_guard\b/,
    "CREATE TRIGGER deleted_course_assignment_guard"
  )};
  const report=run(f);
  assert.ok(report.errors.some(e=>/Expected hardening replacement: db06_course_assignment_parent_guard/.test(e)));
});

test("unknown NEW/OLD field in a trigger function fails closed",()=>{
  const f={...fixtures,[source42]:fixtures[source42].replace(
    /CREATE OR REPLACE FUNCTION db06_guard_assessment_definition\(\)/,
    "CREATE OR REPLACE FUNCTION db06_guard_assessment_definition()"
  ).replace(
    /SELECT o\.id INTO lesson_offering/,
    "PERFORM NEW.nonexistent_private_grade_field;\n  SELECT o.id INTO lesson_offering"
  )};
  assert.match(run(f).errors.join("\n"),/nonexistent_private_grade_field/);
});

test("unknown UPDATE OF column fails closed",()=>{
  const f={...fixtures,[source42]:fixtures[source42].replace(
    /UPDATE OF lesson_id, delivery_id, max_points ON course_assignments/,
    "UPDATE OF lesson_id, delivery_id, nonexistent_write_column ON course_assignments"
  )};
  assert.match(run(f).errors.join("\n"),/nonexistent UPDATE OF nonexistent_write_column/);
});

test("duplicate CREATE without drop is rejected",()=>{
  const f={...fixtures,[source42]:fixtures[source42].replace(
    /DROP TRIGGER db06_course_assignment_parent_guard ON course_assignments;/,
    "-- deliberately removed DROP"
  )};
  assert.match(run(f).errors.join("\n"),/duplicated without DROP/);
});

test("an undefined trigger function is rejected",()=>{
  const f={...fixtures,[source41]:fixtures[source41].replace(
    /EXECUTE FUNCTION db06_guard_quiz_answer_parent\(\)/,
    "EXECUTE FUNCTION db06_unknown_quiz_answer_parent()"
  )};
  assert.match(run(f).errors.join("\n"),/function missing db06_unknown_quiz_answer_parent/);
});

test("source audit must never label itself runtime or PostgreSQL verified",()=>{
  const r=run();
  assert.doesNotMatch(r.status,/PG_VERIFIED|DONE_VERIFIED|RUNTIME_PASS/);
  assert.match(r.status,/NOT_PG/);
});
