import { readFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import { test } from "node:test";
const read = (p) => readFileSync(join(process.cwd(),p),"utf8");
const sql=read("docs/planning/sql/db07-project-lineage-fks-staging.sql");
const doc=read("docs/planning/db073-project-lineage-integrity-contract.md");
const schema=read("src/db/schema/projects.ts");
test("draft not registered as a migration",()=>{assert.match(sql,/DRAFT ONLY; NOT A REGISTERED MIGRATION/);assert.match(doc,/Chat 1 owns/);});
test("all four parent and child tables registered",()=>{for(const t of ["project_releases","project_sprints","project_tasks","project_task_submissions"]) assert.ok(schema.includes('"'+t+'"'),t)});
test("preflight inspects release/sprint mismatch",()=>assert.ok(sql.includes("s.project_id <> r.project_id")));
test("preflight inspects sprint/task mismatch",()=>assert.ok(sql.includes("t.project_id <> s.project_id")));
test("preflight inspects task/submission mismatch",()=>assert.ok(sql.includes("sub.project_id <> t.project_id")));
test("preflight aborts with 23514 before constraints",()=>{assert.match(sql,/DO \$db073_project_lineage_preflight\$/);assert.match(sql,/RAISE EXCEPTION 'DB073 project lineage mismatch/);assert.match(sql,/ERRCODE = '23514'/);});
for(const t of ["releases","sprints","tasks"]){
 test(t+" exposes unique (project_id,id) target",()=>assert.match(sql,new RegExp("CREATE UNIQUE INDEX IF NOT EXISTS project_"+t+"_project_id_id_uq\\s+ON project_"+t+"\\(project_id, id\\)","i")));
}
for(const [child,parent,key,name] of [
 ["sprints","releases","release_id","project_sprints_project_release_fk"],
 ["tasks","sprints","sprint_id","project_tasks_project_sprint_fk"],
 ["task_submissions","tasks","task_id","project_task_submissions_project_task_fk"]]){
 test(child+" composite parent prevents project mismatch",()=>assert.match(sql,new RegExp("ALTER TABLE project_"+child+"\\s+ADD CONSTRAINT "+name+"\\s+FOREIGN KEY \\(project_id, "+key+"\\)\\s+REFERENCES project_"+parent+"\\(project_id, id\\) ON DELETE RESTRICT","i")));
}
test("no destructive mutation, NOT VALID, or constraint drop",()=>{assert.doesNotMatch(sql,/^\s*(DROP|TRUNCATE|DELETE\s+FROM|UPDATE\s+project_)/im);assert.doesNotMatch(sql,/\bNOT VALID\b/i);});
test("test target is explicit and actual execution pending",()=>{assert.match(doc,/DB073_PROJECT_LINEAGE_ENFORCED=1/);assert.match(doc,/TEST_DATABASE_URL/);assert.match(doc,/NOT EXECUTED merely by authorship/);});
