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
  assert.equal(journal.entries.at(-1).tag,"0037_db03_groups_electives");
  assert.equal(journal.entries.at(-1).idx,37);
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
  assert.match(master,/IMPLEMENTING — six tables/);
  assert.match(handoff,/group-backed course content/i);
});

test("DB03 persists historical removed membership and does not mutate primary section assignments", () => {
  assert.ok(s37.tables["public.lms_group_members"].columns.state);
  assert.ok(s37.tables["public.lms_group_member_events"].columns.to_state);
  assert.doesNotMatch(sql,/ALTER TABLE "section_enrollments"/i);
});
