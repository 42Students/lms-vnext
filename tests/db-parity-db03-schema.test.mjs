import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const load = p => JSON.parse(fs.readFileSync(p, "utf8"));
const s36 = load("drizzle/meta/0036_snapshot.json");
const s37 = load("drizzle/meta/0037_snapshot.json");
const journal = load("drizzle/meta/_journal.json");
const sql = fs.readFileSync("drizzle/0037_db03_groups_electives.sql", "utf8");
const names = ["lms_groups","lms_group_members","lms_group_member_events","lms_group_rules","elective_slots","elective_offerings"];
test("DB03 migration is registered and snapshot follows 0036", () => {
  assert.equal(s37.prevId, s36.id);
  assert.equal(Object.keys(s37.tables).length, Object.keys(s36.tables).length+6);
  assert.equal(journal.entries.find(entry=>entry.idx===37)?.tag,"0037_db03_groups_electives");
  assert.equal(journal.entries.find(entry=>entry.tag==="0037_db03_groups_electives")?.idx,37);
  for (const name of names) {
    assert.ok(s37.tables["public."+name]);
    assert.match(sql,new RegExp('CREATE TABLE "'+name+'"'));
  }
});
test("DB03 snapshot tracks all authored columns, FKs, checks and indexes", () => {
  const t = names.map(n=>s37.tables["public."+n]);
  assert.equal(t.reduce((n,x)=>n+Object.keys(x.columns).length,0),78);
  assert.equal(t.reduce((n,x)=>n+Object.keys(x.foreignKeys).length,0),15);
  assert.equal(t.reduce((n,x)=>n+Object.keys(x.indexes).length,0),15);
  assert.equal(t.reduce((n,x)=>n+Object.keys(x.checkConstraints).length,0),27);
  for(const row of t){
    assert.ok(row.columns.id.primaryKey);
    for(const [name,ck] of Object.entries(row.checkConstraints))
      assert.ok(sql.includes('CONSTRAINT "'+name+'" CHECK ('+ck.value+')'));
    for(const indexName of Object.keys(row.indexes))
      assert.ok(sql.includes('INDEX "'+indexName+'"'));
    for(const key of Object.keys(row.foreignKeys))
      assert.ok(sql.includes('CONSTRAINT "'+key+'"'));
  }
  assert.ok(s37.tables["public.elective_offerings"].indexes.elective_offerings_slot_active_course_uq.where);
  assert.ok(s37.tables["public.lms_groups"].checkConstraints.lms_groups_count_ck);
  assert.match(sql, /CREATE TRIGGER db03_group_member_events_no_mutation/);
  assert.match(sql, /BEFORE UPDATE OR DELETE ON "lms_group_member_events"/);
});
test("DB03 status stays explicitly unverified until production and disposable DB checks", () => {
  const handoff = fs.readFileSync("docs/planning/database-parity-db03-implementation.md", "utf8");
  const master = fs.readFileSync("docs/planning/database-parity-master.md", "utf8");
  assert.match(handoff,/NOT DATABASE-VERIFIED|NOT EXECUTED|NOT YET VERIFIED/i);
  assert.match(master,/DB03|Groups.*Electives/i);
  assert.match(handoff,/group-backed course content/i);
});

test("DB03 persists historical removed membership and does not mutate primary section assignments", () => {
  assert.ok(s37.tables["public.lms_group_members"].columns.state);
  assert.ok(s37.tables["public.lms_group_member_events"].columns.to_state);
  assert.doesNotMatch(sql,/ALTER TABLE "section_enrollments"/i);
});

test("DB03 migration 0038 preserves project TEAM group link semantics", () => {
  const next = load("drizzle/meta/0038_snapshot.json");
  const sql38 = fs.readFileSync("drizzle/0038_project_team_group.sql", "utf8");
  assert.equal(next.prevId, s37.id);
  assert.equal(journal.entries.find(entry=>entry.idx===38)?.tag, "0038_project_team_group");
  assert.equal(journal.entries.find(entry=>entry.tag==="0038_project_team_group")?.idx, 38);
  const project = next.tables["public.project_instances"];
  assert.equal(project.columns.team_group_id.notNull, false);
  assert.ok(project.foreignKeys.project_instances_team_group_id_lms_groups_id_fk);
  assert.equal(project.indexes.project_instances_team_group_uq.isUnique, true);
  assert.match(sql38, /ADD COLUMN "team_group_id" uuid/);
});

test("DB03 cross-parent tenant guards are registered in migration 0039", () => {
  const s38=load("drizzle/meta/0038_snapshot.json");
  const s39=load("drizzle/meta/0039_snapshot.json");
  const sql39=fs.readFileSync("drizzle/0039_db03_scope_triggers.sql","utf8");
  assert.equal(s39.prevId,s38.id);
  assert.equal(journal.entries.at(-1).tag,"0039_db03_scope_triggers");
  for(const trigger of ["db03_member_tenant_guard","db03_elective_slot_scope_guard",
    "db03_elective_offering_scope_guard","db03_project_team_scope_guard"])
    assert.ok(sql39.includes("CREATE TRIGGER "+trigger));
});

test("DB03 slot ranges stay synchronized through migrations 0037-0039", () => {
  for (const idx of [37,38,39]) {
    const snapshot=load("drizzle/meta/"+String(idx).padStart(4,"0")+"_snapshot.json");
    const c=snapshot.tables["public.elective_slots"].checkConstraints;
    assert.match(c.elective_slots_semester_ck.value,/BETWEEN 1 AND 12/);
    assert.match(c.elective_slots_picks_ck.value,/credits" BETWEEN 0 AND 30/);
  }
});
