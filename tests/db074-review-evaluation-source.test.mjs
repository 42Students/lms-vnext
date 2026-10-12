import { readFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import { test } from "node:test";

const read=(path)=>readFileSync(join(process.cwd(),path),"utf8");
const sql=read("docs/planning/sql/db07-review-evaluation-parent-fks-staging.sql");
const doc=read("docs/planning/db074-review-evaluation-integrity-contract.md");
const source=read("src/db/schema/projects.ts");

test("staging is not active migration",()=>{assert.match(sql,/SOURCE-STAGED ONLY; DO NOT APPLY AS A MIGRATION/);assert.match(doc,/not registered or DB verified/);});
test("source review row has independent project and submission keys",()=>{assert.match(source,/"project_submission_reviews"/);assert.match(source,/export const projectSubmissionReviews/);});
test("source evaluation row has independent project and submission keys",()=>{assert.match(source,/"project_evaluations"/);assert.match(source,/export const projectEvaluations/);});
test("review preflight checks project lineage",()=>assert.match(sql,/rev\.project_id <> sub\.project_id/));
test("evaluation preflight checks project lineage",()=>assert.match(sql,/ev\.project_id <> sub\.project_id/));
test("preflight guard checks both parent-child ancestry paths",()=>{const section=sql.split("DO $db074_review_evaluation_preflight$")[1];assert.ok(section);assert.match(section,/rev\.project_id <> sub\.project_id/);assert.match(section,/ev\.project_id <> sub\.project_id/);});
test("preflight rejects dirty data before adding foreign keys",()=>{assert.match(sql,/RAISE EXCEPTION 'DB074 review\/evaluation project mismatch/);assert.match(sql,/ERRCODE = '23514'/);assert.ok(sql.indexOf("ERRCODE = '23514'")<sql.indexOf("ADD CONSTRAINT project_submission_reviews_project_submission_fk"));});
test("project submissions expose exactly one composite unique target",()=>assert.match(sql,/CREATE UNIQUE INDEX IF NOT EXISTS project_submissions_project_id_id_uq\s+ON project_submissions\(project_id, id\)/i));
test("review same-project composite foreign key is restrictive",()=>assert.match(sql,/ALTER TABLE project_submission_reviews\s+ADD CONSTRAINT project_submission_reviews_project_submission_fk\s+FOREIGN KEY \(project_id, submission_id\)\s+REFERENCES project_submissions\(project_id, id\)\s+ON DELETE RESTRICT/i));
test("evaluation same-project composite foreign key is restrictive",()=>assert.match(sql,/ALTER TABLE project_evaluations\s+ADD CONSTRAINT project_evaluations_project_submission_fk\s+FOREIGN KEY \(project_id, submission_id\)\s+REFERENCES project_submissions\(project_id, id\)\s+ON DELETE RESTRICT/i));
test("no destructive mutation/invalid FKs in proposal",()=>{assert.doesNotMatch(sql,/^\s*(DROP|TRUNCATE|DELETE\s+FROM|UPDATE\s+project_)/im);assert.doesNotMatch(sql,/\bNOT VALID\b/i);assert.equal((sql.match(/ADD CONSTRAINT project_(?:submission_reviews|evaluations)_project_submission_fk/g)||[]).length,2);});
test("acceptance requires opt-in isolated PostgreSQL",()=>{assert.match(doc,/DB074_REVIEW_EVALUATION_ENFORCED=1/);assert.match(doc,/TEST_DATABASE_URL/);assert.match(doc,/not.*DONE_VERIFIED/i);});
