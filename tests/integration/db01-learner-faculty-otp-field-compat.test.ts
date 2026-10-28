import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {drizzleLoginRepository} from "@/modules/auth/login-repository";
import {SEED_IDS} from "../../scripts/db-seed-data";

/** DB-004 verified replacement for learner/faculty account-verification
 * common fields. The current product uses one human OTP then resolves
 * role/college from persisted memberships; it deliberately does NOT mint
 * independent reusable role-specific OTP credentials.
 *
 * The migration identity_id and learner roll-number mappings require
 * additional approval and are NOT certified by these shared-field cases.
 */
const url=process.env.TEST_DATABASE_URL;
if(!url||url!==process.env.DATABASE_URL)
 throw new Error("DB004 role OTP needs matching disposable registered PG");
const pool=new Pool({connectionString:url,max:2});
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
describe("DB-004 learner/faculty legacy account challenge common-field replacement",()=>{
 for(const role of ["LEARNER","FACULTY"] as const){
  it(role+" has keyed contact and OTP, shared retry/resend budget, expiry and single-use verified timestamps",async()=>{
   const userId=randomUUID(),membershipId=randomUUID(),attemptId=randomUUID();
   const contactMac=randomUUID().replaceAll("-","").padEnd(64,"a");
   const otpMac="b".repeat(64),emailMac="c".repeat(64);
   try{
    await pool.query(
     "insert into users(id,identity_uid,platform_status) values($1,$2,'ACTIVE')",
     [userId,"db004-"+role+"-challenge-"+userId]);
    await pool.query(
     "insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
     [membershipId,userId,SEED_IDS.collegeA]);
    await pool.query(
     "insert into membership_roles(membership_id,role) values($1,$2)",
     [membershipId,role]);
    expect(await drizzleLoginRepository.createAttempt({
     id:attemptId,userId,collegeId:SEED_IDS.collegeA,
     contactFingerprint:contactMac,smsCodeMac:otpMac,
     emailCodeMac:null,ipTag:"role-"+userId.slice(0,8),
     rateLimit:{windowMinutes:10,perContactAndAddress:5,perContact:8,perAddress:20},
    })).toBe(true);
    const initial=await pool.query<{
     id:string;user_id:string;college_id:string;contact_fingerprint:string;
     sms_code_mac:string;created_at:Date;expires_at:Date;used_at:Date|null;
     verified_at:Date|null;verification_attempts:number;resend_attempts:number;
     target_role:string;membership_id:string|null;
    }>("select * from identity_auth_attempts where id=$1",[attemptId]);
    expect(initial.rows[0]).toMatchObject({
     id:attemptId,user_id:userId,college_id:SEED_IDS.collegeA,
     contact_fingerprint:contactMac,sms_code_mac:otpMac,used_at:null,
     verified_at:null,verification_attempts:0,resend_attempts:0,
     target_role:"LOGIN",membership_id:null,
    });
    expect(initial.rows[0]?.created_at).toBeInstanceOf(Date);
    expect(initial.rows[0]?.expires_at).toBeInstanceOf(Date);
    expect(initial.rows[0]!.expires_at.getTime()-initial.rows[0]!.created_at.getTime())
     .toBeLessThanOrEqual(300000);
    expect(await drizzleLoginRepository.setEmailCode(attemptId,emailMac,0)).toBe(true);
    expect(await drizzleLoginRepository.reserveVerification(attemptId)).toBe(true);
    const counted=await pool.query<{
     verification_attempts:number;resend_attempts:number;email_code_mac:string;
     email_code_sent_at:Date;email_code_expires_at:Date;
    }>("select * from identity_auth_attempts where id=$1",[attemptId]);
    expect(counted.rows[0]).toMatchObject({
     verification_attempts:1,resend_attempts:1,email_code_mac:emailMac,
    });
    expect(counted.rows[0]?.email_code_sent_at).toBeInstanceOf(Date);
    expect(counted.rows[0]?.email_code_expires_at).toBeInstanceOf(Date);
    expect(await drizzleLoginRepository.consumeAttempt(attemptId,userId,{
      digest:randomUUID().replaceAll("-","").padEnd(64,"0"),maxAgeSeconds:3600,
    })).toBe(true);
    const consumed=await pool.query<{
     verified_at:Date;used_at:Date;sms_code_mac:string|null;
     email_code_mac:string|null;verification_attempts:number;
    }>("select * from identity_auth_attempts where id=$1",[attemptId]);
    expect(consumed.rows[0]?.used_at).toBeInstanceOf(Date);
    expect(consumed.rows[0]?.verified_at).toBeInstanceOf(Date);
    expect(consumed.rows[0]?.sms_code_mac).toBeNull();
    expect(consumed.rows[0]?.email_code_mac).toBeNull();
    expect(consumed.rows[0]?.verification_attempts).toBe(1);
    expect(await drizzleLoginRepository.consumeAttempt(attemptId,userId)).toBe(false);
   }finally{
    await pool.query("delete from identity_device_sessions where user_id=$1",[userId]);
    await pool.query("delete from identity_auth_attempts where user_id=$1",[userId]);
    await pool.query("delete from membership_roles where membership_id=$1",[membershipId]);
    await pool.query("delete from college_memberships where id=$1",[membershipId]);
    await pool.query("delete from users where id=$1",[userId]);
   }
  });
 }
 it("cannot consume a college challenge through a different role or suspended membership",async()=>{
  const userId=randomUUID(),learnerId=randomUUID(),facultyId=randomUUID();
  const learnerAttempt=randomUUID(),facultyAttempt=randomUUID();
  const identityUid="db004-otp-scope-"+userId;
  const mac="a".repeat(64);
  try{
   await pool.query("insert into users(id,identity_uid,platform_status) values($1,$2,'ACTIVE')",
    [userId,identityUid]);
   await pool.query(
    "insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
    [learnerId,userId,SEED_IDS.collegeA]);
   await pool.query(
    "insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
    [facultyId,userId,SEED_IDS.collegeB]);
   await pool.query("insert into membership_roles(membership_id,role) values($1,'LEARNER')",
    [learnerId]);
   await pool.query("insert into membership_roles(membership_id,role) values($1,'FACULTY')",
    [facultyId]);
   for(const [id,collegeId,contact] of [
    [learnerAttempt,SEED_IDS.collegeA,"b".repeat(64)],
    [facultyAttempt,SEED_IDS.collegeB,"c".repeat(64)],
   ]){
    expect(await drizzleLoginRepository.createAttempt({
     id,userId,collegeId,contactFingerprint:contact,smsCodeMac:mac,
     emailCodeMac:null,ipTag:"db004-role-scope",
     rateLimit:{windowMinutes:10,perContactAndAddress:5,perContact:8,perAddress:20},
    })).toBe(true);
   }
   const owner=await pool.query<{user_id:string;college_id:string;
    membership_id:string|null;target_role:string}>(
    "select user_id,college_id,membership_id,target_role from identity_auth_attempts where id=$1",
    [learnerAttempt]);
   // LOGIN is a single human challenge; role-specific authorization is
   // resolved from persisted memberships, never from the challenge itself.
   expect(owner.rows[0]).toEqual({
    user_id:userId,college_id:SEED_IDS.collegeA,membership_id:null,target_role:"LOGIN",
   });
   // The registered composite FK prevents attaching a different-college
   // role to the attempt, even with a valid UUID belonging to the same user.
   await expect(pool.query(
    "update identity_auth_attempts set membership_id=$1 where id=$2",
    [facultyId,learnerAttempt])).rejects.toThrow();
   await pool.query("delete from membership_roles where membership_id=$1",[learnerId]);
   // The faculty grant in college B cannot authorize a learner-host login
   // in college A; a failed consume must not burn the single-use challenge.
   expect(await drizzleLoginRepository.consumeAttempt(learnerAttempt,userId)).toBe(false);
   const rejected=await pool.query<{used_at:Date|null}>(
    "select used_at from identity_auth_attempts where id=$1",[learnerAttempt]);
   expect(rejected.rows[0]?.used_at).toBeNull();
   await pool.query("insert into membership_roles(membership_id,role) values($1,'LEARNER')",
    [learnerId]);
   expect(await drizzleLoginRepository.consumeAttempt(learnerAttempt,userId)).toBe(true);
   await pool.query(
    "update college_memberships set status='SUSPENDED',suspended_at=clock_timestamp() where id=$1",
    [facultyId]);
   expect(await drizzleLoginRepository.consumeAttempt(facultyAttempt,userId)).toBe(false);
   await pool.query(
    "update college_memberships set status='ACTIVE',suspended_at=null where id=$1",
    [facultyId]);
   expect(await drizzleLoginRepository.consumeAttempt(facultyAttempt,userId)).toBe(true);
  }finally{
   await pool.query("delete from identity_device_sessions where user_id=$1",[userId]);
   await pool.query("delete from identity_auth_attempts where user_id=$1",[userId]);
   await pool.query("delete from membership_roles where membership_id=any($1::uuid[])",
    [[learnerId,facultyId]]);
   await pool.query("delete from college_memberships where id=any($1::uuid[])",
    [[learnerId,facultyId]]);
   await pool.query("delete from users where id=$1",[userId]);
  }
 });

 it("does not turn role-specific, blocked or superseded proofs into login sessions",async()=>{
  const userId=randomUUID(),membershipId=randomUUID(),attemptId=randomUUID();
  try{
   await pool.query("insert into users(id,identity_uid,platform_status) values($1,$2,'ACTIVE')",
    [userId,"db004-role-credential-"+userId]);
   await pool.query(
    "insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
    [membershipId,userId,SEED_IDS.collegeA]);
   await pool.query("insert into membership_roles(membership_id,role) values($1,'FACULTY')",
    [membershipId]);
   expect(await drizzleLoginRepository.createAttempt({
    id:attemptId,userId,collegeId:SEED_IDS.collegeA,
    contactFingerprint:"d".repeat(64),smsCodeMac:"e".repeat(64),
    emailCodeMac:null,ipTag:"db004-proof",
    rateLimit:{windowMinutes:10,perContactAndAddress:5,perContact:8,perAddress:20},
   })).toBe(true);
   await pool.query(
    "update identity_auth_attempts set target_role='FACULTY',membership_id=$1 where id=$2",
    [membershipId,attemptId]);
   expect(await drizzleLoginRepository.consumeAttempt(attemptId,userId)).toBe(false);
   await pool.query(
    "update identity_auth_attempts set target_role='LOGIN' where id=$1",[attemptId]);
   expect(await drizzleLoginRepository.consumeAttempt(attemptId,userId)).toBe(false);
   await pool.query(
    "update identity_auth_attempts set membership_id=null, blocked_until=now()+interval '1 minute' where id=$1",
    [attemptId]);
   expect(await drizzleLoginRepository.consumeAttempt(attemptId,userId)).toBe(false);
   await pool.query(
    "update identity_auth_attempts set blocked_until=null, superseded_at=clock_timestamp() where id=$1",
    [attemptId]);
   expect(await drizzleLoginRepository.consumeAttempt(attemptId,userId)).toBe(false);
   await pool.query(
    "update identity_auth_attempts set superseded_at=null where id=$1",[attemptId]);
   expect(await drizzleLoginRepository.consumeAttempt(attemptId,userId)).toBe(true);
   expect(await drizzleLoginRepository.consumeAttempt(attemptId,userId)).toBe(false);
  }finally{
   await pool.query("delete from identity_device_sessions where user_id=$1",[userId]);
   await pool.query("delete from identity_auth_attempts where user_id=$1",[userId]);
   await pool.query("delete from membership_roles where membership_id=$1",[membershipId]);
   await pool.query("delete from college_memberships where id=$1",[membershipId]);
   await pool.query("delete from users where id=$1",[userId]);
  }
 });

});
