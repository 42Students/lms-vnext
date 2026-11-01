import {randomUUID} from "node:crypto";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {setTpoAfterCollegeOutcome} from "@/modules/placements/tpo-after-college-write-service";
import {getTpoAfterCollegeForRoster} from "@/modules/placements/tpo-after-college-roster-service";
import {bulkUpdateTpoAfterCollege} from "@/modules/placements/tpo-after-college-bulk-service";
import {readTpoOutcomeLabels,saveTpoOutcomeLabels} from "@/modules/placements/tpo-outcome-label-settings-service";

const databaseUrl=process.env.TEST_DATABASE_URL;
if(!databaseUrl)throw new Error("DB019 requires explicitly isolated TEST_DATABASE_URL");
assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=new Pool({connectionString:databaseUrl,max:2});
const roleId=randomUUID();
const tpo:RequestContext={
 user:{id:SEED_IDS.facultyUser,identityUid:"db019-outcomes",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{
  id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"],
 },
};
const learnerId=SEED_IDS.learnerCollegeAMembership;
let originalSettingsPresent=false,originalOutcomeLabels:unknown=null;
describe("DB019 registered PG17 after-college outcome fidelity",()=>{
 beforeAll(async()=>{
  const previous=await pool.query<{outcome_labels:unknown}>(
   "SELECT outcome_labels FROM placement_tpo_college_settings WHERE college_id=$1",
   [SEED_IDS.collegeA]);
  originalSettingsPresent=previous.rows.length>0;
  originalOutcomeLabels=previous.rows[0]?.outcome_labels??null;
  await pool.query(
   "INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'TPO') "+
   "ON CONFLICT(membership_id,role) DO NOTHING",
   [roleId,SEED_IDS.facultyCollegeAMembership],
  );
  await pool.query(
   "INSERT INTO placement_tpo_college_settings(college_id,outcome_labels) "+
   "VALUES($1,$2::jsonb) ON CONFLICT(college_id) DO UPDATE SET outcome_labels=EXCLUDED.outcome_labels",
   [SEED_IDS.collegeA,JSON.stringify([{id:randomUUID(),label:"Family business",outcome:"ENTREPRENEURSHIP"}])],
  );
  await pool.query("DELETE FROM placement_tpo_after_college WHERE learner_membership_id=$1",[learnerId]);
 });
 afterAll(async()=>{
  await pool.query("DELETE FROM placement_tpo_after_college WHERE learner_membership_id=$1",[learnerId]);
  await pool.query("DELETE FROM membership_roles WHERE id=$1",[roleId]);
  // Restore only the settings column this fixture owns, never discard the
  // college's other settings. PG fixture data must not pollute later suites.
  if(originalSettingsPresent)await pool.query(
   "UPDATE placement_tpo_college_settings SET outcome_labels=$2::jsonb WHERE college_id=$1",
   [SEED_IDS.collegeA,originalOutcomeLabels===null?null:JSON.stringify(originalOutcomeLabels)]);
  else await pool.query(
   "DELETE FROM placement_tpo_college_settings WHERE college_id=$1",[SEED_IDS.collegeA]);
  await pool.end();await closeDatabaseConnection();
 });
 it("persists current detail and restricts read to the authorized college roster",async()=>{
  const first=await setTpoAfterCollegeOutcome(tpo,{
   learnerMembershipId:learnerId,outcome:"ENTREPRENEURSHIP",
   outcomeLabel:"Family business",outcomeDetail:"Private destination detail",
   expectedVersion:"none",
  });
  expect(first.changed).toBe(true);
  const row=await pool.query<{outcome:string;outcome_label:string|null;outcome_detail:string|null}>(
   "SELECT outcome,outcome_label,outcome_detail FROM placement_tpo_after_college WHERE learner_membership_id=$1",
   [learnerId],
  );
  expect(row.rows).toEqual([{outcome:"ENTREPRENEURSHIP",outcome_label:"Family business",
   outcome_detail:"Private destination detail"}]);
  const scoped=await getTpoAfterCollegeForRoster(tpo,[learnerId]);
  expect(scoped.entries[learnerId]).toMatchObject({
   outcome:"ENTREPRENEURSHIP",outcomeLabel:"Family business",
   outcomeDetail:"Private destination detail",
  });
  const audit=await pool.query<{payload:string}>(
   "SELECT metadata::text AS payload FROM activity_events "+
   "WHERE event_type='placements.student.after_college_updated' "+
   "AND subject_id=$1 ORDER BY occurred_at DESC LIMIT 1",[learnerId],
  );
  expect(audit.rows[0]?.payload).not.toContain("Private destination detail");
  // Missing keys from the existing status-only editor preserve custom fields.
  const repeated=await setTpoAfterCollegeOutcome(tpo,{
   learnerMembershipId:learnerId,outcome:"ENTREPRENEURSHIP",
   expectedVersion:first.version,
  });
  expect(repeated).toMatchObject({changed:false,version:first.version});
  await expect(setTpoAfterCollegeOutcome(tpo,{
   learnerMembershipId:learnerId,outcome:"HIGHER_STUDIES",expectedVersion:"none",
  })).rejects.toMatchObject({code:"AFTER_COLLEGE_STALE"});
  await expect(setTpoAfterCollegeOutcome(tpo,{
   learnerMembershipId:learnerId,outcome:"ENTREPRENEURSHIP",
   outcomeLabel:"Not this college label",expectedVersion:first.version,
  })).rejects.toMatchObject({code:"AFTER_COLLEGE_INVALID_LABEL"});
  // The legacy settings writer propagates rename and removal transactionally.
  // The selected custom label follows the college catalog, while private
  // destination detail is preserved until the actual outcome changes.
  const catalog=await readTpoOutcomeLabels(tpo);
  const savedCatalog=await saveTpoOutcomeLabels(tpo,{
   labels:[{id:catalog.labels[0]!.id,label:"Family enterprise",outcome:"ENTREPRENEURSHIP"}],
   expectedVersion:catalog.version,
  });
  const renamed=await pool.query<{outcome_label:string|null;outcome_detail:string|null;updated_at:Date}>(
   "SELECT outcome_label,outcome_detail,updated_at FROM placement_tpo_after_college "+
   "WHERE learner_membership_id=$1",[learnerId]);
  expect(renamed.rows[0]).toMatchObject({
   outcome_label:"Family enterprise",outcome_detail:"Private destination detail",
  });
  await saveTpoOutcomeLabels(tpo,{labels:[],expectedVersion:savedCatalog.version});
  const afterRemoval=await pool.query<{outcome_label:string|null;outcome_detail:string|null;updated_at:Date}>(
   "SELECT outcome_label,outcome_detail,updated_at FROM placement_tpo_after_college "+
   "WHERE learner_membership_id=$1",[learnerId]);
  expect(afterRemoval.rows[0]).toMatchObject({
   outcome_label:null,outcome_detail:"Private destination detail",
  });
  const switched=await bulkUpdateTpoAfterCollege(tpo,{changes:[{
   membershipId:learnerId,outcome:"HIGHER_STUDIES",
   expectedVersion:afterRemoval.rows[0]!.updated_at.toISOString(),
  }]});
  expect(switched.updated).toBe(1);
  const reset=await pool.query<{outcome_label:string|null;outcome_detail:string|null}>(
   "SELECT outcome_label,outcome_detail FROM placement_tpo_after_college WHERE learner_membership_id=$1",
   [learnerId],
  );
  expect(reset.rows).toEqual([{outcome_label:null,outcome_detail:null}]);
  await expect(pool.query(
   "UPDATE placement_tpo_after_college SET outcome_detail=$1 WHERE learner_membership_id=$2",
   ["X".repeat(201),learnerId],
  )).rejects.toMatchObject({code:"22001"});
 });
});
