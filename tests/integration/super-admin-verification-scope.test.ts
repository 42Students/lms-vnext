import {randomUUID} from "node:crypto";
import {beforeAll,afterAll,describe,it,expect} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {closeDatabaseConnection} from "@/db/client";
import {listCollegeVerificationQueue} from "@/modules/verification/staff-queue-service";
import {getCollegeVerificationDetail} from "@/modules/verification/staff-review-detail-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1"&&process.env.DB04_VERIFICATION_READY==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL}):null;
const admin:RequestContext={
 user:{id:SEED_IDS.superAdminUser,identityUid:"admin-verification",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA},
};
const foreign={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}};
const ordinary={...admin,user:{...admin.user,systemRoles:[]}};
const rows=[{user:randomUUID(),member:randomUUID(),role:randomUUID(),record:randomUUID(),college:SEED_IDS.collegeA},
 {user:randomUUID(),member:randomUUID(),role:randomUUID(),record:randomUUID(),college:SEED_IDS.collegeB}];
describe.skipIf(!enabled)("Super Admin verification queue tenant-isolation (PG)",()=>{
 beforeAll(async()=>{
  if(!pool)throw Error("Disposable DB04 required");
  for(const row of rows){
   await pool.query("INSERT INTO users(id,identity_uid,display_name) VALUES($1::uuid,$2::text,$3::text)",[row.user,"sa-verif-"+row.user,"Scoped student"]);
   await pool.query("INSERT INTO college_memberships(id,user_id,college_id) VALUES($1::uuid,$2::uuid,$3::uuid)",[row.member,row.user,row.college]);
   await pool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1::uuid,$2::uuid,'LEARNER')",[row.role,row.member]);
   await pool.query("INSERT INTO profile_verifications(id,learner_membership_id,section,status,submitted_snapshot,submitted_at,row_version) VALUES($1::uuid,$2::uuid,'IDENTITY','SUBMITTED','{}'::jsonb,now(),1)",[row.record,row.member]);
  }
 });
 afterAll(async()=>{
  try{
   if(pool)for(const row of [...rows].reverse()){
    await pool.query("DELETE FROM profile_verification_events WHERE verification_id=$1::uuid",[row.record]);
    await pool.query("DELETE FROM profile_verifications WHERE id=$1::uuid",[row.record]);
    await pool.query("DELETE FROM membership_roles WHERE id=$1::uuid",[row.role]);
    await pool.query("DELETE FROM college_memberships WHERE id=$1::uuid",[row.member]);
    await pool.query("DELETE FROM users WHERE id=$1::uuid",[row.user]);
   }
  }finally{await pool?.end();await closeDatabaseConnection();}
 });
 it("returns only the selected college's queue and detail",async()=>{
  const own=await listCollegeVerificationQueue(admin,{},SEED_IDS.collegeA);
  expect(own.rows.some(x=>x.learnerMembershipId===rows[0].member)).toBe(true);
  expect(own.rows.some(x=>x.learnerMembershipId===rows[1].member)).toBe(false);
  expect((await getCollegeVerificationDetail(admin,rows[0].member,"IDENTITY",SEED_IDS.collegeA)).learnerMembershipId).toBe(rows[0].member);
  await expect(getCollegeVerificationDetail(admin,rows[1].member,"IDENTITY",SEED_IDS.collegeA)).rejects.toMatchObject({code:"NOT_ALLOWED"});
 });
 it("rejects foreign target, wrong role, and disabled identity",async()=>{
  await expect(listCollegeVerificationQueue(admin,{},SEED_IDS.collegeB)).rejects.toBeInstanceOf(AuthorizationError);
  await expect(listCollegeVerificationQueue(ordinary,{},SEED_IDS.collegeA)).rejects.toBeInstanceOf(AuthorizationError);
  await expect(listCollegeVerificationQueue({...foreign,user:{...admin.user,platformStatus:"DISABLED"}},{},SEED_IDS.collegeB)).rejects.toBeInstanceOf(AuthorizationError);
 });
});
