import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const migration=readFileSync("drizzle/0205_lane15_assignment_grade_events.sql","utf8");
const proposed=readFileSync("docs/planning/sql/db06-assessment-attendance-history-candidate.sql","utf8");
const staged=readFileSync("src/db/schema/db06-history-staged.ts","utf8");
const producer=readFileSync("src/modules/courses/assignment-submission-service.ts","utf8");
const contract=readFileSync("docs/planning/database-parity-db06-history-contract.md","utf8");
const witness=readFileSync("tests/integration/db06-grade-hide-negative-witness.test.ts","utf8");

test("DB035 cannot recreate existing registered 0205 grade ledger",()=>{
  assert.match(migration,/CREATE TABLE IF NOT EXISTS assignment_grade_events/);
  assert.match(migration,/HIDE_GRADE/);
  assert.match(proposed,/NOT A STANDALONE MIGRATION/);
  assert.match(proposed,/Never apply this file verbatim/);
  assert.match(contract,/in-place upgrade/);
});

test("DB035 HIDE_GRADE source contract preserves score feedback and original grader",()=>{
  assert.match(proposed,/CHECK \(action IN \('GRADE','REGRADE','HIDE_GRADE','PUBLISH_GRADE'\)\)/);
  const hide=proposed.split("(action = 'HIDE_GRADE'")[1]
    ?.split("CREATE UNIQUE INDEX assignment_grade_events_submission_version_uq")[0]??"";
  for(const column of ["previous_points","previous_feedback",
    "previous_graded_by_user_id","previous_graded_at"]){
    const other=column.replace("previous_","new_");
    assert.ok(hide.includes(column+" IS NOT DISTINCT FROM "+other),column);
  }
  assert.match(staged,/"action" in \('GRADE','REGRADE','HIDE_GRADE','PUBLISH_GRADE'\)/);
});

test("DB035 deferred classifier treats pure hide separately from regrade",()=>{
  assert.match(proposed,/OLD\.grade_published = true AND NEW\.grade_published = false/);
  assert.match(proposed,/OLD\.points_awarded IS NOT DISTINCT FROM NEW\.points_awarded/);
  assert.match(proposed,/OLD\.feedback IS NOT DISTINCT FROM NEW\.feedback/);
  assert.match(proposed,/THEN 'HIDE_GRADE'/);
  assert.match(proposed,/ELSE 'REGRADE'/);
  assert.match(proposed,/expected_action IN \('PUBLISH_GRADE','HIDE_GRADE'\)/);
  assert.match(producer,/hideOnly\?"HIDE_GRADE":current\.gradingStatus==="GRADED"\?"REGRADE":"GRADE"/);
});

test("DB035 negative witnesses are opt-in, disposable and rollback-only",()=>{
  assert.match(witness,/DB06_RUN_GRADE_HIDE_WITNESSES==="1"/);
  assert.match(witness,/DB06_DISPOSABLE_DB_CONFIRM==="YES"/);
  assert.match(witness,/TEST_DATABASE_URL/);
  assert.match(witness,/SET CONSTRAINTS ALL IMMEDIATE/);
  assert.match(witness,/ROLLBACK/);
  assert.match(witness,/\.code\)\.toBe\("23514"\)/);
});
