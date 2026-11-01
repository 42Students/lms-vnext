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
import {readTpoOutcomeLabels,readTpoOutcomeChoiceCatalog,saveTpoOutcomeLabels} from "@/modules/placements/tpo-outcome-label-settings-service";

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
const collegeAdmin:RequestContext={
 user:{id:SEED_IDS.collegeAdminUser,identityUid:"db019-admin-outcomes",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{
  id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"],
 },
};
const scopedSuperAdmin:RequestContext={
 user:{id:SEED_IDS.superAdminUser,identityUid:"db019-sa-outcomes",platformStatus:"ACTIVE",
  systemRoles:["SUPER_ADMIN"]},
 membership:null,
 adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA},
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
 it("atomically swaps custom label names, moves their outcome and preserves private detail",async()=>{
  // Test against a self-contained catalog, regardless of other test order.
  const old=await readTpoOutcomeLabels(tpo);
  const emptied=await saveTpoOutcomeLabels(tpo,{
   labels:[],expectedVersion:old.version,
  });
  const created=await saveTpoOutcomeLabels(tpo,{
   labels:[
    {label:"Career studio",outcome:"ENTREPRENEURSHIP"},
    {label:"Graduate school",outcome:"ENTREPRENEURSHIP"},
   ],
   expectedVersion:emptied.version,
  });
  const before=await getTpoAfterCollegeForRoster(tpo,[learnerId]);
  const selection=await setTpoAfterCollegeOutcome(tpo,{
   learnerMembershipId:learnerId,outcome:"ENTREPRENEURSHIP",
   outcomeLabel:"Career studio",outcomeDetail:"Private plan remains private",
   expectedVersion:before.entries[learnerId]?.expectedVersion??"none",
  });
  const swapped=await saveTpoOutcomeLabels(tpo,{
   labels:[
    {id:created.labels[0]!.id,label:"Graduate school",outcome:"ENTREPRENEURSHIP"},
    {id:created.labels[1]!.id,label:"Career studio",outcome:"ENTREPRENEURSHIP"},
   ],
   expectedVersion:created.version,
  });
  const row=await pool.query<{
   outcome:string;outcome_label:string|null;outcome_detail:string|null;updated_at:Date
  }>("SELECT outcome,outcome_label,outcome_detail,updated_at "+
   "FROM placement_tpo_after_college WHERE learner_membership_id=$1",[learnerId]);
  expect(row.rows[0]).toMatchObject({
   outcome:"ENTREPRENEURSHIP",outcome_label:"Graduate school",
   outcome_detail:"Private plan remains private",
  });
  expect(row.rows[0]!.updated_at.toISOString()).not.toBe(selection.version);
  // Old client writers must refresh their version after the cascade.
  await expect(setTpoAfterCollegeOutcome(tpo,{
   learnerMembershipId:learnerId,outcome:"ENTREPRENEURSHIP",
   expectedVersion:selection.version,
  })).rejects.toMatchObject({code:"AFTER_COLLEGE_STALE"});
  // A stale settings version with a new proposed label must reject
  // transactionally, leaving both the catalog and learner destination intact.
  await expect(saveTpoOutcomeLabels(tpo,{
   labels:[
    {id:swapped.labels[0]!.id,label:"Stale taxonomy write",outcome:"ENTREPRENEURSHIP"},
    {id:swapped.labels[1]!.id,label:"Career studio",outcome:"ENTREPRENEURSHIP"},
   ],
   expectedVersion:created.version,
  })).rejects.toMatchObject({code:"TPO_SETTINGS_STALE"});
  const afterRejected=await pool.query<{
   outcome:string;outcome_label:string|null;outcome_detail:string|null
  }>("SELECT outcome,outcome_label,outcome_detail "+
   "FROM placement_tpo_after_college WHERE learner_membership_id=$1",[learnerId]);
  expect(afterRejected.rows[0]).toEqual({
   outcome:"ENTREPRENEURSHIP",outcome_label:"Graduate school",
   outcome_detail:"Private plan remains private",
  });
  // Reclassify an existing label: the student destination follows the stable
  // label ID, not the old outcome, and the sensitive detail remains private.
  const moved=await saveTpoOutcomeLabels(tpo,{
   labels:[
    {id:swapped.labels[0]!.id,label:"Graduate school",outcome:"HIGHER_STUDIES"},
    {id:swapped.labels[1]!.id,label:"Career studio",outcome:"ENTREPRENEURSHIP"},
   ],
   expectedVersion:swapped.version,
  });
  const afterMove=await pool.query<{
   outcome:string;outcome_label:string|null;outcome_detail:string|null;updated_at:Date
  }>("SELECT outcome,outcome_label,outcome_detail,updated_at "+
   "FROM placement_tpo_after_college WHERE learner_membership_id=$1",[learnerId]);
  expect(afterMove.rows[0]).toMatchObject({
   outcome:"HIGHER_STUDIES",outcome_label:"Graduate school",
   outcome_detail:"Private plan remains private",
  });
  expect(afterMove.rows[0]!.updated_at.toISOString())
   .not.toBe(row.rows[0]!.updated_at.toISOString());
  // Removing a custom label clears only its tag, never the recorded outcome
  // or the learner's private information. Editing consent is out of scope.
  const removed=await saveTpoOutcomeLabels(tpo,{
   labels:[moved.labels[1]!],expectedVersion:moved.version,
  });
  const afterDelete=await pool.query<{
   outcome:string;outcome_label:string|null;outcome_detail:string|null
  }>("SELECT outcome,outcome_label,outcome_detail "+
   "FROM placement_tpo_after_college WHERE learner_membership_id=$1",[learnerId]);
  expect(afterDelete.rows[0]).toEqual({
   outcome:"HIGHER_STUDIES",outcome_label:null,
   outcome_detail:"Private plan remains private",
  });
  expect(removed.labels).toHaveLength(1);
 });
 it("refuses forged or duplicated custom-label identities and non-choice categories",async()=>{
  const current=await readTpoOutcomeLabels(tpo);
  const forged=randomUUID();
  await expect(saveTpoOutcomeLabels(tpo,{
   labels:[{id:forged,label:"Forged taxonomy entry",outcome:"HIGHER_STUDIES"}],
   expectedVersion:current.version,
  })).rejects.toMatchObject({code:"TPO_SETTINGS_INVALID_LABEL"});
  await expect(saveTpoOutcomeLabels(tpo,{
   labels:[
    {id:forged,label:"Same identity one",outcome:"HIGHER_STUDIES"},
    {id:forged,label:"Same identity two",outcome:"ENTREPRENEURSHIP"},
   ],
   expectedVersion:current.version,
  })).rejects.toThrow();
  await expect(saveTpoOutcomeLabels(tpo,{
   labels:[{label:"Unsupported seeking label",outcome:"LOOKING_FOR_JOB"}],
   expectedVersion:current.version,
  })).rejects.toThrow();
  await expect(saveTpoOutcomeLabels(tpo,{
   labels:[{label:"Unsupported undecided label",outcome:"NOT_DECIDED"}],
   expectedVersion:current.version,
  })).rejects.toThrow();
  const unchanged=await readTpoOutcomeLabels(tpo);
  expect(unchanged.labels).toEqual(current.labels);
  expect(unchanged.version).toBe(current.version);
 });
 it("normalizes internal label whitespace and refuses a duplicate normalized name",async()=>{
  const initial=await readTpoOutcomeLabels(tpo);
  const added=await saveTpoOutcomeLabels(tpo,{
   labels:[...initial.labels,{label:"Career   accelerator",outcome:"HIGHER_STUDIES"}],
   expectedVersion:initial.version,
  });
  expect(added.labels.at(-1)?.label).toBe("Career accelerator");
  try{
   await expect(saveTpoOutcomeLabels(tpo,{
    labels:[
     {label:"Another  destination",outcome:"HIGHER_STUDIES"},
     {label:"Another destination",outcome:"ENTREPRENEURSHIP"},
    ],
    expectedVersion:added.version,
   })).rejects.toThrow();
   expect((await readTpoOutcomeLabels(tpo)).labels).toEqual(added.labels);
  }finally{
   await saveTpoOutcomeLabels(tpo,{
    labels:initial.labels,expectedVersion:added.version,
   });
  }
 });
 it("permits persisted College Admin and acting Super Admin without forging TPO membership",async()=>{
  const start=await getTpoAfterCollegeForRoster(collegeAdmin,[learnerId]);
  const initial=start.entries[learnerId]!;
  const adminWrite=await setTpoAfterCollegeOutcome(collegeAdmin,{
   learnerMembershipId:learnerId,outcome:"COMPETITIVE_EXAMS",
   outcomeLabel:null,outcomeDetail:"Administrator review",
   expectedVersion:initial.expectedVersion,
  });
  expect(adminWrite.changed).toBe(true);
  const adminEvent=await pool.query<{actor_user_id:string;actor_membership_id:string|null}>(
   "SELECT actor_user_id,actor_membership_id FROM activity_events "+
   "WHERE event_type='placements.student.after_college_updated' "+
   "AND subject_id=$1 AND actor_user_id=$2 ORDER BY occurred_at DESC LIMIT 1",
   [learnerId,SEED_IDS.collegeAdminUser],
  );
  expect(adminEvent.rows[0]).toEqual({
   actor_user_id:SEED_IDS.collegeAdminUser,
   actor_membership_id:SEED_IDS.collegeAdminMembership,
  });
  const superWrite=await setTpoAfterCollegeOutcome(scopedSuperAdmin,{
   learnerMembershipId:learnerId,outcome:"HIGHER_STUDIES",
   expectedVersion:adminWrite.version,
  });
  expect(superWrite.changed).toBe(true);
  const superEvent=await pool.query<{actor_user_id:string;actor_membership_id:string|null}>(
   "SELECT actor_user_id,actor_membership_id FROM activity_events "+
   "WHERE event_type='placements.student.after_college_updated' "+
   "AND subject_id=$1 AND actor_user_id=$2 ORDER BY occurred_at DESC LIMIT 1",
   [learnerId,SEED_IDS.superAdminUser],
  );
  expect(superEvent.rows[0]).toEqual({
   actor_user_id:SEED_IDS.superAdminUser,actor_membership_id:null,
  });
  const superBulk=await bulkUpdateTpoAfterCollege(scopedSuperAdmin,{changes:[{
   membershipId:learnerId,outcome:"NOT_INTERESTED",
   expectedVersion:superWrite.version,
  }]});
  expect(superBulk.updated).toBe(1);
  const superBulkEvent=await pool.query<{actor_membership_id:string|null}>(
   "SELECT actor_membership_id FROM activity_events "+
   "WHERE event_type='placements.student.after_college_updated' "+
   "AND subject_id=$1 AND actor_user_id=$2 "+
   "AND metadata->>'mode'='BULK' ORDER BY occurred_at DESC LIMIT 1",
   [learnerId,SEED_IDS.superAdminUser],
  );
  expect(superBulkEvent.rows[0]?.actor_membership_id).toBeNull();
  const adminBulk=await bulkUpdateTpoAfterCollege(collegeAdmin,{changes:[{
   membershipId:learnerId,outcome:"NOT_DECIDED",
   expectedVersion:superBulk.results[0]!.version,
  }]});
  expect(adminBulk.updated).toBe(1);
 });
 it("returns the actual scoped college for acting Super Admin and refuses an unscoped catalog",async()=>{
  const catalog=await readTpoOutcomeChoiceCatalog(scopedSuperAdmin,"SCOPED");
  expect(catalog).toMatchObject({
   ready:true,scope:"SCOPED",collegeId:SEED_IDS.collegeA,
  });
  expect(catalog.choices.length).toBeGreaterThan(9);
  const unscoped={...scopedSuperAdmin,adminScope:null};
  await expect(readTpoOutcomeChoiceCatalog(unscoped,"SCOPED")).rejects.toThrow();
  const universal=await readTpoOutcomeChoiceCatalog(unscoped,"UNIVERSAL");
  expect(universal).toMatchObject({scope:"UNIVERSAL",collegeId:null});
  expect(universal.labels).toEqual([]);
 });
 it("keeps scoped Super Admin restricted to selected college",async()=>{
  const otherCollege={...scopedSuperAdmin,adminScope:{
   organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB,
  }};
  const start=await getTpoAfterCollegeForRoster(collegeAdmin,[learnerId]);
  await expect(setTpoAfterCollegeOutcome(otherCollege,{
   learnerMembershipId:learnerId,outcome:"HIGHER_STUDIES",
   expectedVersion:start.entries[learnerId]!.expectedVersion,
  })).rejects.toMatchObject({code:"AFTER_COLLEGE_NOT_FOUND"});
  await expect(bulkUpdateTpoAfterCollege(otherCollege,{changes:[{
   membershipId:learnerId,outcome:"HIGHER_STUDIES",
   expectedVersion:start.entries[learnerId]!.expectedVersion,
  }]})).rejects.toMatchObject({code:"AFTER_COLLEGE_NOT_FOUND"});
 });

});
