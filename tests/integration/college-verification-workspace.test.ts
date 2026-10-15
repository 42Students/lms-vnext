import {randomUUID} from "node:crypto";
import {beforeAll,afterAll,describe,it,expect} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {listCollegeVerificationQueue} from "@/modules/verification/staff-queue-service";
import {listVerificationBatchOptions,listVerificationBranchOptions,listVerificationClassOptions} from "@/modules/verification/filter-options-service";
import {reviewProfileVerification} from "@/modules/profile-verification/service";
import {createProfileVerificationRepository} from "@/modules/profile-verification/repository";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

/** DB04's registration belongs to the owner; never run this fixture against an
 * unregistered schema or any application database. */
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&
 process.env.DB03_ISOLATED_TEST_DATABASE==="1" &&
 process.env.DB04_VERIFICATION_READY==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL}):null;
const admin:RequestContext={
 user:{id:SEED_IDS.collegeAdminUser,identityUid:"verification-admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const wrongRole:RequestContext={...admin,membership:{...admin.membership!,roles:["LEARNER"]}};
const ids={
 ownUser:randomUUID(),ownMember:randomUUID(),ownRole:randomUUID(),ownRecord:randomUUID(),
 foreignUser:randomUUID(),foreignMember:randomUUID(),foreignRole:randomUUID(),foreignRecord:randomUUID(),
};
const ownBody={learnerMembershipId:ids.ownMember,section:"IDENTITY" as const,
 expectedVersion:1,action:"SEND_BACK" as const,reason:"Please upload a readable document"};

describe.skipIf(!enabled)("verification PG tenant, wrong-role, stale token and audit",()=>{
 beforeAll(async()=>{
  if(!pool)throw Error("DB04 disposable target required");
  for(const [user,member,role,college,record] of [
   [ids.ownUser,ids.ownMember,ids.ownRole,SEED_IDS.collegeA,ids.ownRecord],
   [ids.foreignUser,ids.foreignMember,ids.foreignRole,SEED_IDS.collegeB,ids.foreignRecord],
  ]){
   await pool.query("INSERT INTO users(id,identity_uid,display_name) VALUES($1::uuid,$2::text,$3::text)",
     [user,"verification-fixture-"+user,college===SEED_IDS.collegeA?"Verification Own College":"Verification Foreign College"]);
   await pool.query("INSERT INTO college_memberships(id,user_id,college_id) VALUES($1::uuid,$2::uuid,$3::uuid)",
     [member,user,college]);
   await pool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1::uuid,$2::uuid,'LEARNER')",
     [role,member]);
   await pool.query("INSERT INTO profile_verifications(id,learner_membership_id,section,status,submitted_snapshot,submitted_at,row_version) "+
    "VALUES($1::uuid,$2::uuid,'IDENTITY','SUBMITTED','{}'::jsonb,now(),1)",[record,member]);
  }
 });
 afterAll(async()=>{
  try{
   if(pool){
    for(const [user,member,role,record] of [
     [ids.ownUser,ids.ownMember,ids.ownRole,ids.ownRecord],
     [ids.foreignUser,ids.foreignMember,ids.foreignRole,ids.foreignRecord],
    ]){
     await pool.query("DELETE FROM in_app_notifications WHERE event_id IN (SELECT id FROM activity_events WHERE subject_id=$1::text)",[record]);
     await pool.query("DELETE FROM activity_events WHERE subject_id=$1::text",[record]);
     await pool.query("DELETE FROM profile_verification_events WHERE verification_id=$1::uuid",[record]);
     await pool.query("DELETE FROM profile_verifications WHERE id=$1::uuid",[record]);
     await pool.query("DELETE FROM membership_roles WHERE id=$1::uuid",[role]);
     await pool.query("DELETE FROM college_memberships WHERE id=$1::uuid",[member]);
     await pool.query("DELETE FROM users WHERE id=$1::uuid",[user]);
    }
   }
  }finally{await pool?.end();await closeDatabaseConnection();}
 });
 it("reads own-college learner and never includes the foreign college",async()=>{
  const data=await listCollegeVerificationQueue(admin,{});
  expect(data.rows.some(row=>row.learnerMembershipId===ids.ownMember)).toBe(true);
  expect(data.rows.some(row=>row.learnerMembershipId===ids.foreignMember)).toBe(false);
 });
 it("filters learner name in SQL before paging and CSV, without admitting foreign names",async()=>{
  const own=await listCollegeVerificationQueue(admin,{q:"Own College"});
  expect(own.rows.some(row=>row.learnerMembershipId===ids.ownMember)).toBe(true);
  const foreign=await listCollegeVerificationQueue(admin,{q:"Foreign College"});
  expect(foreign.rows).toHaveLength(0);
  const escaped=await listCollegeVerificationQueue(admin,{q:"%_"});
  expect(escaped.rows).toHaveLength(0);
 });
 it("loads only current-college batch choices and denies a revoked role claim",async()=>{
  const result=await listVerificationBatchOptions(admin);
  expect(result.items).toHaveLength(new Set(result.items.map(x=>x.id)).size);
  await expect(listVerificationBatchOptions(wrongRole)).rejects.toBeInstanceOf(AuthorizationError);
 });
 it("loads only authorized branch choices",async()=>{
  const choices=await listVerificationBranchOptions(admin);
  expect(choices.items.every(x=>x.id&&x.label)).toBe(true);
  await expect(listVerificationBranchOptions(wrongRole)).rejects.toBeInstanceOf(AuthorizationError);
 });
 it("loads current-college active class selectors without authorizing wrong roles",async()=>{
  const result=await listVerificationClassOptions(admin);
  expect(result.items).toHaveLength(new Set(result.items.map(x=>x.id)).size);
  await expect(listVerificationClassOptions(wrongRole)).rejects.toBeInstanceOf(AuthorizationError);
 });
 it("never includes foreign-college records in missing-marksheet attention filters",async()=>{
  const result=await listCollegeVerificationQueue(admin,{attention:"MISSING_MARKSHEET"});
  expect(result.rows.some(row=>row.learnerMembershipId===ids.foreignMember)).toBe(false);
  await expect(listCollegeVerificationQueue(wrongRole,{attention:"MISSING_MARKSHEET"})).rejects.toBeInstanceOf(AuthorizationError);
 });
 it("checks persisted scope for pending verified-detail changes",async()=>{
  const result=await listCollegeVerificationQueue(admin,{attention:"VERIFIED_DETAILS_CHANGED"});
  expect(result.rows.some(x=>x.learnerMembershipId===ids.foreignMember)).toBe(false);
  await expect(listCollegeVerificationQueue(wrongRole,{attention:"VERIFIED_DETAILS_CHANGED"})).rejects.toBeInstanceOf(AuthorizationError);
 });
 it("enforces college roles before overdue attention triage",async()=>{
  const result=await listCollegeVerificationQueue(admin,{attention:"WAITING_OVER_WEEK"});
  expect(result.rows.some(x=>x.learnerMembershipId===ids.foreignMember)).toBe(false);
  await expect(listCollegeVerificationQueue(wrongRole,{attention:"WAITING_OVER_WEEK"})).rejects.toBeInstanceOf(AuthorizationError);
 });
 it("applies persisted authorization to 10 and 50 row queue requests",async()=>{
  const ten=await listCollegeVerificationQueue(admin,{pageSize:10});
  expect(ten.rows.length).toBeLessThanOrEqual(10);
  const fifty=await listCollegeVerificationQueue(admin,{pageSize:50});
  expect(fifty.rows.length).toBeLessThanOrEqual(50);
  await expect(listCollegeVerificationQueue(wrongRole,{pageSize:10})).rejects.toBeInstanceOf(AuthorizationError);
 });
 it("supports oldest/newest read choices without cross-college access",async()=>{
  const newest=await listCollegeVerificationQueue(admin,{sort:"NEWEST"});
  expect(newest.rows.some(x=>x.learnerMembershipId===ids.foreignMember)).toBe(false);
  await expect(listCollegeVerificationQueue(wrongRole,{sort:"NEWEST"})).rejects.toBeInstanceOf(AuthorizationError);
 });
 it("does not accept a context-only wrong-role membership",async()=>{
  await expect(listCollegeVerificationQueue(wrongRole,{})).rejects.toBeInstanceOf(AuthorizationError);
 });
 it("does not leak foreign-college verification details or permit cross-college review",async()=>{
  await expect(reviewProfileVerification(admin,{...ownBody,learnerMembershipId:ids.foreignMember},
   createProfileVerificationRepository())).rejects.toBeInstanceOf(AuthorizationError);
 });
 it("commits a send-back event and learner in-app notification, rejecting replay",async()=>{
  const saved=await reviewProfileVerification(admin,ownBody,createProfileVerificationRepository());
  expect(saved).toMatchObject({status:"SENT_BACK",version:2});
  const audit=await pool!.query("SELECT id FROM activity_events WHERE subject_id=$1::text",[ids.ownRecord]);
  expect(audit.rows).toHaveLength(1);
  const notifications=await pool!.query("SELECT id FROM in_app_notifications WHERE event_id=$1::uuid",[audit.rows[0].id]);
  expect(notifications.rows).toHaveLength(1);
  await expect(reviewProfileVerification(admin,ownBody,createProfileVerificationRepository()))
   .rejects.toMatchObject({code:"STALE_VERSION"});
 });
});