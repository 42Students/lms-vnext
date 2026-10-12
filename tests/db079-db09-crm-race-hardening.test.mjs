import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const journal=JSON.parse(fs.readFileSync("drizzle/meta/_journal.json","utf8"));
const previous=JSON.parse(fs.readFileSync("drizzle/meta/0047_snapshot.json","utf8"));
const snapshot=JSON.parse(fs.readFileSync("drizzle/meta/0048_snapshot.json","utf8"));
const sql=fs.readFileSync("drizzle/0048_db09_crm_principal_race_hardening.sql","utf8");

test("DB079 is a forward-only 0048 migration after existing 0046/0047",()=>{
  const entry=journal.entries.find((row)=>row.idx===48);
  assert.ok(entry);
  assert.equal(entry.tag,"0048_db09_crm_principal_race_hardening");
  assert.equal(journal.entries.filter((row)=>row.tag===entry.tag).length,1);
  assert.equal(snapshot.prevId,previous.id);
  assert.notEqual(snapshot.id,previous.id);
});

test("DB079 is trigger-only and leaves Drizzle table shape unchanged",()=>{
  const strip=({id,prevId,...rest})=>rest;
  assert.deepEqual(strip(snapshot),strip(previous));
  assert.doesNotMatch(sql,/\bCREATE\s+TABLE\b/i);
  assert.doesNotMatch(sql,/\bALTER\s+TABLE\b/i);
  assert.doesNotMatch(sql,/\bDROP\s+TABLE\b/i);
});

test("DB079 refuses existing poisoned CRM principal rows before guard replacement",()=>{
  assert.match(sql,/DO \$db09_crm_race_preflight\$/);
  for(const message of [
    "invalid lead owner principal",
    "invalid lead company relationship",
    "joined recruiter lacks valid same-company grant",
    "invalid follow-up owner principal",
    "invalid lead activity actor principal",
  ]) assert.ok(sql.includes(message),message);
  assert.doesNotMatch(sql,/\bUPDATE\s+placement_tpo_/i);
  assert.doesNotMatch(sql,/\bDELETE\s+FROM\s+placement_tpo_/i);
});

test("DB079 locks accepted lead owner, relationship and recruiter grant principals",()=>{
  assert.match(
    sql,
    /db09_assert_lead_scoped_links[\s\S]*FOR SHARE OF m, mr, u/,
  );
  assert.match(
    sql,
    /placement_company_relationships r[\s\S]*FOR SHARE OF r/,
  );
  assert.match(
    sql,
    /placement_recruiter_college_grants g[\s\S]*FOR SHARE OF p, co, u, g, r/,
  );
});

test("DB079 locks follow-up and activity actor principals",()=>{
  assert.match(
    sql,
    /db09_assert_followup_owner_scope[\s\S]*FOR SHARE OF m, mr, u/,
  );
  assert.match(
    sql,
    /db09_assert_activity_actor_scope[\s\S]*FOR SHARE OF m, mr, u/,
  );
  assert.match(sql,/m\.status = 'ACTIVE'/);
  assert.match(sql,/u\.platform_status = 'ACTIVE'/);
  assert.match(sql,/mr\.role IN \('FACULTY','COLLEGE_ADMIN','TPO'\)/);
});

test("DB079 closes append-only lead-activity TRUNCATE bypass",()=>{
  assert.match(
    sql,
    /CREATE TRIGGER db09_lead_activity_no_truncate[\s\S]*BEFORE TRUNCATE ON placement_tpo_lead_activities[\s\S]*db09_reject_lead_activity_rewrite/,
  );
});

test("DB079 replaces 0045 guard functions instead of duplicate trigger names",()=>{
  for(const fn of [
    "db09_assert_lead_scoped_links",
    "db09_assert_followup_owner_scope",
    "db09_assert_activity_actor_scope",
  ]) assert.match(sql,new RegExp("CREATE OR REPLACE FUNCTION "+fn));
  assert.doesNotMatch(sql,/CREATE TRIGGER db09_lead_scoped_links_guard/);
  assert.doesNotMatch(sql,/CREATE TRIGGER db09_followup_owner_scope_guard/);
  assert.doesNotMatch(sql,/CREATE TRIGGER db09_lead_activity_actor_scope_guard/);
});
