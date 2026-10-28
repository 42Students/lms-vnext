import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { closeDatabaseConnection } from "@/db/client";
import {
 resolveRequestContext,listMembershipChoices,
} from "@/modules/identity/context-service";
import {
 getOwnIdentityProfile,updateOwnIdentityName,
} from "@/modules/people/identity-profile-service";
import {drizzleLoginRepository} from "@/modules/auth/login-repository";

/** DB-004 normalization witness: one person, distinct independently revocable
 * learner/faculty college memberships. Never derive role authority from an
 * old numeric account type or an arbitrary user-submitted collegeId.
 */
const url=process.env.TEST_DATABASE_URL;
if(!url||process.env.DATABASE_URL!==url)
 throw new Error("DB004 learner/faculty field witness needs an isolated test DB");
const pool=new Pool({connectionString:url,max:2});
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
describe("DB-004 learner/faculty source fields normalized to a canonical identity",()=>{
 it("keeps person/contact/name shared while role, college, and suspension stay separate",async()=>{
  const userId=randomUUID(),identityUid="db004-two-role-"+userId;
  const learnerMembershipId=randomUUID(),facultyMembershipId=randomUUID();
  const email="db004-dual-"+userId+"@example.test";
  const phone="+91"+userId.replaceAll("-","").replaceAll(/[a-f]/g,"5").slice(0,10);
  try{
   await pool.query(
    "insert into users(id,identity_uid,email,phone_e164,display_name,platform_status) values($1,$2,$3,$4,'Before Edit','ACTIVE')",
    [userId,identityUid,email,phone]);
   for(const [memberId,collegeId,role] of [
    [learnerMembershipId,SEED_IDS.collegeA,"LEARNER"],
    [facultyMembershipId,SEED_IDS.collegeB,"FACULTY"],
   ]){
    await pool.query(
     "insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
     [memberId,userId,collegeId]);
    await pool.query("insert into membership_roles(membership_id,role) values($1,$2)",
     [memberId,role]);
   }
   // Legacy role.created_at resolves to a persisted membership-role grant,
   // never a detached global role-definition timestamp.
   const roleReceipts=await pool.query<{role:string;created_at:Date}>(
    "select role,created_at from membership_roles where membership_id=any($1::uuid[])",
    [[learnerMembershipId,facultyMembershipId]]);
   expect(roleReceipts.rows).toHaveLength(2);
   expect(new Set(roleReceipts.rows.map(row=>row.role))).toEqual(new Set(["LEARNER","FACULTY"]));
   expect(roleReceipts.rows.every(row=>row.created_at instanceof Date)).toBe(true);
   const choices=await listMembershipChoices(identityUid);
   expect(choices).toEqual(expect.arrayContaining([
    expect.objectContaining({id:learnerMembershipId,collegeId:SEED_IDS.collegeA,
      roles:["LEARNER"],status:"ACTIVE"}),
    expect.objectContaining({id:facultyMembershipId,collegeId:SEED_IDS.collegeB,
      roles:["FACULTY"],status:"ACTIVE"}),
   ]));
   const learner=await resolveRequestContext({
    identityUid,activeMembershipId:learnerMembershipId,activeRole:"LEARNER",
   });
   const faculty=await resolveRequestContext({
    identityUid,activeMembershipId:facultyMembershipId,activeRole:"FACULTY",
   });
   expect(learner.membership).toMatchObject({
    collegeId:SEED_IDS.collegeA,roles:["LEARNER"],status:"ACTIVE",
   });
   expect(faculty.membership).toMatchObject({
    collegeId:SEED_IDS.collegeB,roles:["FACULTY"],status:"ACTIVE",
   });
   expect(learner.user.id).toBe(faculty.user.id);
   expect(await drizzleLoginRepository.findUserByEmail(email)).toMatchObject({
    id:userId,email,phoneE164:phone,
   });
   expect(await drizzleLoginRepository.findUserByPhone(phone)).toMatchObject({id:userId});
   const changed=await updateOwnIdentityName(learner,{
    givenName:"Anita",familyName:"Rao",
   },1);
   expect(changed).toMatchObject({
    givenName:"Anita",familyName:"Rao",displayName:"Anita Rao",version:2,
   });
   expect(await getOwnIdentityProfile(faculty)).toMatchObject({
    givenName:"Anita",familyName:"Rao",displayName:"Anita Rao",version:2,
   });
   const persisted=await pool.query<{
    given_name:string;family_name:string;email:string;phone_e164:string;
   }>("select given_name,family_name,email,phone_e164 from users where id=$1",[userId]);
   expect(persisted.rows[0]).toEqual({
    given_name:"Anita",family_name:"Rao",email,phone_e164:phone,
   });
   // A faculty suspension cannot take away active learner access or
   // invalidate the shared canonical profile of the same person.
   await pool.query(
    `update college_memberships
       set status='SUSPENDED',suspended_at=clock_timestamp(),
           suspension_reason='faculty access revoked'
     where id=$1`,[facultyMembershipId]);
   const facultyState=await pool.query<{college_id:string;suspended_at:Date;suspension_reason:string}>(
    "select college_id,suspended_at,suspension_reason from college_memberships where id=$1",
    [facultyMembershipId]);
   expect(facultyState.rows[0]).toMatchObject({
    college_id:SEED_IDS.collegeB,suspension_reason:"faculty access revoked",
   });
   expect(facultyState.rows[0]?.suspended_at).toBeInstanceOf(Date);
   await expect(resolveRequestContext({
    identityUid,activeMembershipId:facultyMembershipId,
   })).rejects.toMatchObject({code:"MEMBERSHIP_NOT_ACTIVE"});
   await expect(resolveRequestContext({
    identityUid,activeMembershipId:learnerMembershipId,
   })).resolves.toMatchObject({membership:{collegeId:SEED_IDS.collegeA,roles:["LEARNER"]}});
   await pool.query(
    `update college_memberships set status='ACTIVE',suspended_at=null,
      suspension_reason=null where id=$1`,[facultyMembershipId]);
   await pool.query(
    `update college_memberships
       set status='SUSPENDED',suspended_at=clock_timestamp(),
           suspension_reason='learner access revoked' where id=$1`,
    [learnerMembershipId]);
   const learnerState=await pool.query<{college_id:string;suspended_at:Date;suspension_reason:string}>(
    "select college_id,suspended_at,suspension_reason from college_memberships where id=$1",
    [learnerMembershipId]);
   expect(learnerState.rows[0]).toMatchObject({
    college_id:SEED_IDS.collegeA,suspension_reason:"learner access revoked",
   });
   expect(learnerState.rows[0]?.suspended_at).toBeInstanceOf(Date);
   await expect(resolveRequestContext({
    identityUid,activeMembershipId:learnerMembershipId,
   })).rejects.toMatchObject({code:"MEMBERSHIP_NOT_ACTIVE"});
   await expect(resolveRequestContext({
    identityUid,activeMembershipId:facultyMembershipId,
   })).resolves.toMatchObject({membership:{collegeId:SEED_IDS.collegeB,roles:["FACULTY"]}});
  }finally{
   await pool.query("delete from activity_events where actor_user_id=$1",[userId]);
   await pool.query("delete from membership_roles where membership_id=any($1::uuid[])",
    [[learnerMembershipId,facultyMembershipId]]);
   await pool.query("delete from college_memberships where id=any($1::uuid[])",
    [[learnerMembershipId,facultyMembershipId]]);
   await pool.query("delete from users where id=$1",[userId]);
  }
 });
});
