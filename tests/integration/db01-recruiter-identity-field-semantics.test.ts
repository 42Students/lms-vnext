import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {resolveRequestContext} from "@/modules/identity/context-service";
import {getRecruiterSelfProfile} from "@/modules/placements/recruiter-profile-service";
import {SEED_IDS} from "../../scripts/db-seed-data";

/** DB-004 recruiter identity: one real verified same-college grant permits
 * a canonical user profile. A private login number must not be presented
 * as the recruiter's public contact number, and archiving removes access.
 */
const url=process.env.TEST_DATABASE_URL;
if(!url||url!==process.env.DATABASE_URL)
 throw new Error("DB-004 recruiter fields need matching disposable PostgreSQL URLs");
const pool=new Pool({connectionString:url,max:2});
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
describe("DB-004 active recruiter identity and archival field semantics",()=>{
 it("joins canonical identity with verified grant, keeps login phone private and denies archived profile",async()=>{
  const uid=randomUUID(),userId=randomUUID(),companyId=randomUUID();
  const relationshipId=randomUUID(),grantId=randomUUID();
  const email="db004-recruiter-"+uid+"@example.test";
  const phone="+91"+uid.replaceAll("-","").replace(/[a-f]/g,"7").slice(0,10);
  const identityUid="db004-recruiter-"+uid;
  let insertedUser=false,insertedCompany=false,insertedProfile=false,insertedRelationship=false,insertedGrant=false;
  try{
   await pool.query(
    "insert into users(id,identity_uid,email,phone_e164,display_name,given_name,family_name,platform_status) values($1,$2,$3,$4,'Alia Khan','Alia','Khan','ACTIVE')",
    [userId,identityUid,email,phone]);insertedUser=true;
   await pool.query(
    "insert into placement_companies(id,name,created_by_user_id,status) values($1,$2,$3,'ACTIVE')",
    [companyId,"DB004 Recruiter Company "+uid,SEED_IDS.superAdminUser]);insertedCompany=true;
   await pool.query(
    "insert into placement_company_relationships(id,college_id,company_id,created_by_user_id,status) values($1,$2,$3,$4,'ACTIVE')",
    [relationshipId,SEED_IDS.collegeA,companyId,SEED_IDS.superAdminUser]);insertedRelationship=true;
   await pool.query(
    "insert into placement_recruiter_profiles(user_id,company_id,title,status,created_by_user_id) values($1,$2,'Hiring Partner','ACTIVE',$3)",
    [userId,companyId,SEED_IDS.superAdminUser]);insertedProfile=true;
   await pool.query(
    `insert into placement_recruiter_college_grants
      (id,recruiter_user_id,company_relationship_id,granted_by_user_id,
       status,verification_status,valid_until,capabilities)
      values($1,$2,$3,$4,'ACTIVE','VERIFIED',now()+interval '1 day',ARRAY['DRIVES']::text[])`,
    [grantId,userId,relationshipId,SEED_IDS.superAdminUser]);insertedGrant=true;
   const context=await resolveRequestContext({identityUid});
   expect(context.user.id).toBe(userId);
   expect(context.recruiter).toMatchObject({
    userId,companyId,grants:[expect.objectContaining({id:grantId,collegeId:SEED_IDS.collegeA})],
   });
   const self=await getRecruiterSelfProfile(context,SEED_IDS.collegeA);
   expect(self).toMatchObject({
    userId,canonicalFirstName:"Alia",canonicalLastName:"Khan",
    firstName:"Alia",lastName:"Khan",email,phoneE164:phone,
    user:{id:userId,firstName:"Alia",lastName:"Khan",contactMail:email,contactMobile:null},
    accountStatus:"ACTIVE",selectedCollegeId:SEED_IDS.collegeA,
   });
   const raw=await pool.query<{
    given_name:string;family_name:string;email:string;phone_e164:string;
    archived_at:Date|null;
   }>(`select u.given_name,u.family_name,u.email,u.phone_e164,p.archived_at
      from users u join placement_recruiter_profiles p on p.user_id=u.id
      where u.id=$1`,[userId]);
   expect(raw.rows[0]).toEqual({
    given_name:"Alia",family_name:"Khan",email,phone_e164:phone,archived_at:null,
   });
   await pool.query(
    "update placement_recruiter_profiles set status='SUSPENDED',suspended_at=clock_timestamp(),suspension_reason='DB004 suspension' where user_id=$1",
    [userId]);
   const suspended=await pool.query<{suspended_at:Date;suspension_reason:string}>(
    "select suspended_at,suspension_reason from placement_recruiter_profiles where user_id=$1",[userId]);
   expect(suspended.rows[0]?.suspended_at).toBeInstanceOf(Date);
   expect(suspended.rows[0]?.suspension_reason).toBe("DB004 suspension");
   await expect(getRecruiterSelfProfile(context,SEED_IDS.collegeA)).rejects.toBeDefined();
   expect((await resolveRequestContext({identityUid})).recruiter).toBeNull();
   await pool.query(
    "update placement_recruiter_profiles set status='ACTIVE',suspended_at=null,suspension_reason=null where user_id=$1",
    [userId]);
   expect((await resolveRequestContext({identityUid})).recruiter).not.toBeNull();
   await pool.query(
    "update placement_recruiter_profiles set status='ARCHIVED',archived_at=clock_timestamp() where user_id=$1",
    [userId]);
   const closed=await pool.query<{archived_at:Date}>(
    "select archived_at from placement_recruiter_profiles where user_id=$1",[userId]);
   expect(closed.rows[0]?.archived_at).toBeInstanceOf(Date);
   await expect(getRecruiterSelfProfile(context,SEED_IDS.collegeA)).rejects.toBeDefined();
   const after=await resolveRequestContext({identityUid});
   expect(after.recruiter).toBeNull();
  }finally{
   if(insertedGrant)await pool.query("delete from placement_recruiter_college_grants where id=$1",[grantId]);
   if(insertedProfile)await pool.query("delete from placement_recruiter_profiles where user_id=$1",[userId]);
   if(insertedRelationship)await pool.query("delete from placement_company_relationships where id=$1",[relationshipId]);
   if(insertedCompany)await pool.query("delete from placement_companies where id=$1",[companyId]);
   if(insertedUser)await pool.query("delete from users where id=$1",[userId]);
  }
 });
});
