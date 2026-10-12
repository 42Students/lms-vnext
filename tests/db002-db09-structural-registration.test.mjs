import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const journal=JSON.parse(fs.readFileSync("drizzle/meta/_journal.json","utf8"));
const snapshot=JSON.parse(fs.readFileSync("drizzle/meta/0044_snapshot.json","utf8"));
const previous=JSON.parse(fs.readFileSync("drizzle/meta/0043_snapshot.json","utf8"));
const migration=fs.readFileSync("drizzle/0044_db09_policy_crm_structural.sql","utf8");
const policy=fs.readFileSync("src/db/schema/tpo-policy.ts","utf8");
const crm=fs.readFileSync("src/db/schema/tpo-crm.ts","utf8");

const expected={
  placement_college_rules:{columns:7,indexes:0,fks:1,checks:2},
  placement_company_visibility_settings:{columns:8,indexes:0,fks:1,checks:1},
  placement_tpo_leads:{columns:23,indexes:6,fks:4,checks:7},
  placement_tpo_lead_activities:{columns:9,indexes:1,fks:3,checks:2},
  placement_tpo_followups:{columns:8,indexes:2,fks:3,checks:1},
};

test("DB002 0044 is registered exactly once after 0043",()=>{
  const rows=journal.entries.filter((row)=>row.tag==="0044_db09_policy_crm_structural");
  assert.equal(rows.length,1);
  assert.equal(rows[0].idx,44);
  assert.equal(snapshot.prevId,previous.id);
  assert.notEqual(snapshot.id,previous.id);
});

test("DB002 0044 adds exactly the five canonical DB09 structural tables",()=>{
  const before=new Set(Object.values(previous.tables).map((table)=>table.name));
  const after=new Set(Object.values(snapshot.tables).map((table)=>table.name));
  const added=[...after].filter((name)=>!before.has(name)).sort();
  assert.deepEqual(added,Object.keys(expected).sort());
  assert.equal(before.size,90);
  assert.equal(after.size,95);
});

test("DB002 0044 table cardinalities match current canonical Drizzle definitions",()=>{
  for(const [name,counts] of Object.entries(expected)){
    const table=snapshot.tables["public."+name];
    assert.ok(table,"missing "+name);
    assert.equal(Object.keys(table.columns??{}).length,counts.columns,name+" columns");
    assert.equal(Object.keys(table.indexes??{}).length,counts.indexes,name+" indexes");
    assert.equal(Object.keys(table.foreignKeys??{}).length,counts.fks,name+" fks");
    assert.equal(Object.keys(table.checkConstraints??{}).length,counts.checks,name+" checks");
  }
});

test("DB002 0044 preserves canonical policy defaults and bigint versions",()=>{
  for(const name of ["placement_college_rules","placement_company_visibility_settings"]){
    const table=snapshot.tables["public."+name];
    assert.equal(table.columns.version.type,"bigint");
    assert.equal(table.columns.version.default,0);
    assert.equal(table.columns.college_id.primaryKey,true);
    assert.equal(table.foreignKeys[
      name+"_college_id_colleges_id_fk"
    ]?.onDelete,"restrict");
  }
  assert.equal(snapshot.tables["public.placement_college_rules"].columns.counts_as_placed_at.default,"'OFFER_RELEASED'");
  assert.equal(snapshot.tables["public.placement_company_visibility_settings"].columns.show_tenth_twelfth.default,true);
});

test("DB002 CRM snapshot preserves scoped parent identity and partial uniqueness",()=>{
  const leads=snapshot.tables["public.placement_tpo_leads"];
  const activity=snapshot.tables["public.placement_tpo_lead_activities"];
  const followups=snapshot.tables["public.placement_tpo_followups"];
  assert.deepEqual(
    activity.foreignKeys.placement_tpo_lead_activities_scoped_fk.columnsFrom,
    ["college_id","lead_id"],
  );
  assert.deepEqual(
    activity.foreignKeys.placement_tpo_lead_activities_scoped_fk.columnsTo,
    ["college_id","id"],
  );
  assert.deepEqual(
    followups.foreignKeys.placement_tpo_followups_scoped_fk.columnsFrom,
    ["college_id","lead_id"],
  );
  assert.equal(leads.indexes.placement_tpo_leads_college_id_id_uq.isUnique,true);
  assert.match(leads.indexes.placement_tpo_leads_college_email_uq.where,/email_norm.*is not null/);
  assert.match(leads.indexes.placement_tpo_leads_invite_hash_uq.where,/invite_token_hash.*is not null/);
});

test("DB002 migration contains structural DDL only, leaving stronger DB09 triggers to DB017",()=>{
  for(const name of Object.keys(expected)){
    assert.match(migration,new RegExp('CREATE TABLE "'+name+'"'));
  }
  assert.doesNotMatch(migration,/CREATE FUNCTION db09_/);
  assert.doesNotMatch(migration,/CREATE TRIGGER db09_/);
  assert.match(migration,/Strong(er|er DB09).*DB-017|DB-017[\s\S]*NOT claimed/i);
});

test("DB002 source files still contain every registered canonical table exactly once",()=>{
  for(const symbol of ["placementCollegeRules","placementCompanyVisibilitySettings"]){
    assert.equal(policy.split("export const "+symbol+" = pgTable").length-1,1,symbol);
  }
  for(const symbol of ["placementTpoLeads","placementTpoLeadActivities","placementTpoFollowups"]){
    assert.equal(crm.split("export const "+symbol+" = pgTable").length-1,1,symbol);
  }
});
