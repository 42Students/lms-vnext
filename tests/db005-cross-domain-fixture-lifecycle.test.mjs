import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const code=readFileSync("tests/integration/db06-assessment-parent-scope.test.ts","utf8");

test("DB005 cleanup never removes curriculum term before cohort with progression state",()=>{
 const cleanup=code.slice(code.indexOf("async function cleanup(){"),code.indexOf("\nbeforeEach(",code.indexOf("async function cleanup(){")));
 const children=cleanup.indexOf('["sections","sections"]'),cohorts=cleanup.indexOf('["cohorts","cohorts"]'),terms=cleanup.indexOf('["program_terms","terms"]');
 assert.ok(children>=0 && cohorts>children && terms>cohorts);
});
test("DB005 elective fixture retains historical CORE row but removes active CORE FK",()=>{
 assert.match(code,/UPDATE course_offerings SET type='ELECTIVE', program_term_course_id=NULL WHERE id=\$1/);
 assert.match(code,/INSERT INTO program_term_courses/);
});
test("calendar PG test checks both early and late SQLSTATE 23514 violations",()=>{
 const calendar=readFileSync("tests/db02-registered-parent-periods-pg.test.mjs","utf8");
 assert.match(calendar,/e\.code==="23514"/);
 assert.match(calendar,/reason instanceof RegExp/);
 assert.match(calendar,/closed academic period\|another college or is closed/);
});
