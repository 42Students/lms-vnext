import {randomUUID} from "node:crypto";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {withdrawOwnPendingVerification} from "@/modules/profile-verification/service";
import {createProfileVerificationRepository} from "@/modules/profile-verification/repository";
import {VerificationStateError} from "@/modules/profile-verification/domain";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=Boolean(process.env.TEST_DATABASE_URL) &&
 process.env.DB03_ISOLATED_TEST_DATABASE==="1" &&
 process.env.DB04_VERIFICATION_READY==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL}):null;
const ids={user:randomUUID(),member:randomUUID(),role:randomUUID(),record:randomUUID()};
const context:RequestContext={
 user:{id:ids.user,identityUid:"withdraw-fixture",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:ids.member,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]},
};

describe.skipIf(!enabled)("DB04 migration 0081 withdrawn event and optimistic restore",()=>{
 beforeAll(async()=>{
  if(!pool)throw Error("Disposable DB04 test target is required");
  await pool.query("insert into users(id,identity_uid,display_name) values($1::uuid,$2::text,$3::text)",
   [ids.user,"withdraw-fixture-"+ids.user,"Withdrawal fixture"]);
  await pool.query("insert into college_memberships(id,user_id,college_id) values($1::uuid,$2::uuid,$3::uuid)",
   [ids.member,ids.user,SEED_IDS.collegeA]);
  await pool.query("insert into membership_roles(id,membership_id,role) values($1::uuid,$2::uuid,'LEARNER')",
   [ids.role,ids.member]);
  await pool.query(`insert into profile_verifications
   (id,learner_membership_id,section,status,submitted_snapshot,verified_snapshot,
    submitted_at,verified_at,row_version)
   values($1::uuid,$2::uuid,'IDENTITY','UPDATE_PENDING',$3::jsonb,$4::jsonb,
    now(),now()-interval '1 day',2)`,
   [ids.record,ids.member,JSON.stringify({identity:"pending"}),JSON.stringify({identity:"accepted"})]);
 });
 afterAll(async()=>{
  try{
   if(pool){
    await pool.query("delete from profile_verification_events where verification_id=$1::uuid",[ids.record]);
    await pool.query("delete from profile_verifications where id=$1::uuid",[ids.record]);
    await pool.query("delete from membership_roles where id=$1::uuid",[ids.role]);
    await pool.query("delete from college_memberships where id=$1::uuid",[ids.member]);
    await pool.query("delete from users where id=$1::uuid",[ids.user]);
   }
  }finally{await pool?.end();await closeDatabaseConnection();}
 });
 it("withdraws only own pending revision, preserves approved content and commits one event",async()=>{
  const result=await withdrawOwnPendingVerification(context,"IDENTITY",2,
   createProfileVerificationRepository());
  expect(result.status).toBe("VERIFIED");
  expect(result.submittedSnapshot).toEqual({identity:"accepted"});
  expect(result.verifiedSnapshot).toEqual({identity:"accepted"});
  expect(result.version).toBe(3);
  const persisted=await pool!.query(
   "select status,submitted_snapshot,verified_snapshot,row_version from profile_verifications where id=$1::uuid",
   [ids.record]);
  expect(persisted.rows[0]).toMatchObject({
   status:"VERIFIED",submitted_snapshot:{identity:"accepted"},
   verified_snapshot:{identity:"accepted"},row_version:3,
  });
  const events=await pool!.query(
   "select action,actor_kind,actor_user_id,prior_version,next_version from profile_verification_events where verification_id=$1::uuid",
   [ids.record]);
  expect(events.rows).toHaveLength(1);
  expect(events.rows[0]).toMatchObject({
   action:"WITHDRAWN",actor_kind:"LEARNER",actor_user_id:ids.user,
   prior_version:2,next_version:3,
  });
 });
 it("rejects a stale repeat without writing another event",async()=>{
  await expect(withdrawOwnPendingVerification(context,"IDENTITY",2,
   createProfileVerificationRepository())).rejects.toMatchObject({
    code:"STALE_VERSION",
  } satisfies Partial<VerificationStateError>);
  const result=await pool!.query(
   "select count(*)::integer as total from profile_verification_events where verification_id=$1::uuid",
   [ids.record]);
  expect(result.rows[0].total).toBe(1);
 });
});
