import { readFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import { test } from "node:test";

const read=(p)=>readFileSync(join(process.cwd(),p),"utf8");
const sql=read("docs/planning/sql/db07-meeting-linked-ancestry-staging.sql");
const doc=read("docs/planning/db075-meeting-ancestry-integrity-contract.md");
const source=read("src/db/schema/projects.ts");

test("migration remains staged for Chat1",()=>{assert.match(sql,/DRAFT ONLY. NOT IN DRIZZLE JOURNAL/);assert.match(doc,/UNREGISTERED, PG NOT RUN/);});
test("source has nullable sprint/task links and project ownership",()=>{assert.match(source,/"project_meetings"/);assert.match(source,/"linked_sprint_id"/);assert.match(source,/"linked_task_id"/);});
test("preflight rejects foreign project sprint link",()=>assert.match(sql,/m\.project_id <> s\.project_id/));
test("preflight rejects foreign project task link",()=>assert.match(sql,/m\.project_id <> t\.project_id/));
test("preflight rejects task in mismatched sprint when both links exist",()=>{assert.match(sql,/m\.linked_sprint_id IS NOT NULL/);assert.match(sql,/m\.linked_sprint_id <> t\.sprint_id/);});
test("failclosed preflight guards with 23514 before ADD CONSTRAINT",()=>{assert.match(sql,/DO \$db075_meeting_link_preflight\$/);assert.match(sql,/ERRCODE = '23514'/);assert.ok(sql.indexOf("ERRCODE = '23514'")<sql.indexOf("ADD CONSTRAINT project_meetings_project_sprint_fk"));});
test("unique targets cover project scoped sprint/task and sprint scoped task",()=>{
for (const [table,cols] of [["sprints","project_id, id"],["tasks","project_id, id"],["tasks","sprint_id, id"]]){
const name=`project_${table}_${cols.split(", ")[0]}_id_uq`;
assert.match(sql,new RegExp("CREATE UNIQUE INDEX IF NOT EXISTS "+name+"\\s+ON project_"+table+"\\("+cols+"\\)","i"));
}
});
test("optional sprint link may not cross project",()=>assert.match(sql,/ALTER TABLE project_meetings\s+ADD CONSTRAINT project_meetings_project_sprint_fk\s+FOREIGN KEY \(project_id, linked_sprint_id\)\s+REFERENCES project_sprints\(project_id, id\)\s+ON DELETE RESTRICT/i));
test("optional task link may not cross project",()=>assert.match(sql,/ALTER TABLE project_meetings\s+ADD CONSTRAINT project_meetings_project_task_fk\s+FOREIGN KEY \(project_id, linked_task_id\)\s+REFERENCES project_tasks\(project_id, id\)\s+ON DELETE RESTRICT/i));
test("task belongs to linked sprint when both are present",()=>assert.match(sql,/ALTER TABLE project_meetings\s+ADD CONSTRAINT project_meetings_linked_sprint_task_fk\s+FOREIGN KEY \(linked_sprint_id, linked_task_id\)\s+REFERENCES project_tasks\(sprint_id, id\)\s+ON DELETE RESTRICT/i));
test("nullable task-only and sprint-only meetings remain valid",()=>{assert.match(sql,/MATCH SIMPLE intentionally skips/);assert.match(doc,/Task only/);assert.match(doc,/Sprint only/);});
test("never mutate data or imply PostgreSQL executed",()=>{assert.doesNotMatch(sql,/^\s*(DROP|TRUNCATE|DELETE\s+FROM|UPDATE\s+project_)/im);assert.doesNotMatch(sql,/\bNOT VALID\b/i);assert.match(doc,/DB075_MEETING_ANCESTRY_ENFORCED=1/);assert.match(doc,/Source-staged is not DB verified/);});
