import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const code=readFileSync("tests/integration/db06-assessment-parent-scope.test.ts","utf8");

test("DB005 cleanup never removes curriculum term before cohort with progression state",()=>{
 const cleanup=code.slice(code.indexOf("async function cleanup(){"),code.indexOf("\nbeforeEach(",code.indexOf("async function cleanup(){")));
 const children=cleanup.indexOf('["sections","sections"]'),cohorts=cleanup.indexOf('["cohorts","cohorts"]'),terms=cleanup.indexOf('["program_terms","terms"]');
 assert.ok(children>=0 && cohorts>children && terms>cohorts);
});
test("DB005 native elective fixtures never mutate published CORE offering identity",()=>{
 assert.match(code,/offeringType==="CORE"\?termCourse:null/);
 assert.match(code,/const electiveScenario=/);
 assert.match(code,/A=await graph\(.+electiveScenario\?"ELECTIVE":"CORE"\)/);
 assert.match(code,/SELECT type,program_term_course_id FROM course_offerings/);
 assert.doesNotMatch(code,/UPDATE course_offerings SET type='ELECTIVE'/);
});

test("calendar PG test checks both early and late SQLSTATE 23514 violations",()=>{
 const calendar=readFileSync("tests/db02-registered-parent-periods-pg.test.mjs","utf8");
 assert.match(calendar,/e\.code==="23514"/);
 assert.match(calendar,/reason instanceof RegExp/);
 assert.match(calendar,/closed academic period\|another college or is closed/);
});
