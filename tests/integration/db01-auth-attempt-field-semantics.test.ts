import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";
import type { LoginRepository } from "@/modules/auth/login-service";

/** DB-004: a real first-party login attempt witnesses the legacy mobile_login_attempt
 * replacement field behavior. This never imports plaintext OTPs or grants a
 * session without verified, single-use challenge consumption.
 */
const url=process.env.TEST_DATABASE_URL;
if(!url||url!==process.env.DATABASE_URL)
 throw new Error("DB-004 attempt fields require a matching disposable test PostgreSQL URL");
const pool=new Pool({connectionString:url,max:2});
let repository:LoginRepository;
let closeDb:()=>Promise<void>;
beforeAll(async()=>{
 repository=(await import("@/modules/auth/login-repository")).drizzleLoginRepository;
 closeDb=(await import("@/db/client")).closeDatabaseConnection;
});
afterAll(async()=>{
 await pool.end();
 await closeDb();
});
async function withAttempt(run:(input:{userId:string;attemptId:string;
 contactMac:string;smsMac:string;emailMac:string})=>Promise<void>){
 const userId=randomUUID(),attemptId=randomUUID(),membershipId=randomUUID();
 const contactMac=randomUUID().replaceAll("-","").padEnd(64,"a");
 const smsMac="b".repeat(64),emailMac="c".repeat(64);
 try{
  await pool.query("insert into users(id,identity_uid,platform_status) values($1,$2,'ACTIVE')",
   [userId,"db004-attempt-"+userId]);
  // This is a college-scoped login: its holder must actually have an
  // active membership and at least one persisted role before OTP consume.
  await pool.query(
   "insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
   [membershipId,userId,SEED_IDS.collegeA]);
  await pool.query(
   "insert into membership_roles(membership_id,role) values($1,'LEARNER')",[membershipId]);
  expect(await repository.createAttempt({
   id:attemptId,userId,collegeId:SEED_IDS.collegeA,
   contactFingerprint:contactMac,smsCodeMac:smsMac,
   emailCodeMac:null,ipTag:"test-"+userId.slice(0,8),
   rateLimit:{windowMinutes:10,perContactAndAddress:5,perContact:8,perAddress:20},
  })).toBe(true);
  await run({userId,attemptId,contactMac,smsMac,emailMac});
 }finally{
  await pool.query("delete from identity_device_sessions where user_id=$1",[userId]);
  await pool.query("delete from identity_auth_attempts where user_id=$1",[userId]);
  await pool.query("delete from membership_roles where membership_id=$1",[membershipId]);
  await pool.query("delete from college_memberships where id=$1",[membershipId]);
  await pool.query("delete from users where id=$1",[userId]);
 }
}
describe("DB-004 legacy mobile-login attempt normalized field lifecycle",()=>{
 it("persists all live challenge ownership, timing and hashed-channel fields; no raw contact or OTP",async()=>{
  await withAttempt(async({userId,attemptId,contactMac,smsMac,emailMac})=>{
   const initial=await pool.query<{
    id:string;user_id:string;college_id:string;target_role:string;
    contact_fingerprint:string;sms_code_mac:string;
    email_code_mac:string|null;email_code_expires_at:Date|null;
    email_code_sent_at:Date|null;created_at:Date;expires_at:Date;
    verification_attempts:number;used_at:Date|null;
   }>("select * from identity_auth_attempts where id=$1",[attemptId]);
   const row=initial.rows[0]!;
   expect(row).toMatchObject({
    id:attemptId,user_id:userId,college_id:SEED_IDS.collegeA,
    target_role:"LOGIN",contact_fingerprint:contactMac,
    sms_code_mac:smsMac,email_code_mac:null,email_code_expires_at:null,
    email_code_sent_at:null,verification_attempts:0,used_at:null,
   });
   expect(row.created_at).toBeInstanceOf(Date);
   expect(row.expires_at.getTime()-row.created_at.getTime()).toBeGreaterThan(0);
   expect(row.expires_at.getTime()-row.created_at.getTime()).toBeLessThanOrEqual(300_000);
   const parent=await pool.query<{organization_id:string}>(
    "select organization_id from colleges where id=$1",[row.college_id]);
   expect(parent.rows[0]?.organization_id).toBe(SEED_IDS.organization);
   expect(await repository.setEmailCode(attemptId,emailMac,0)).toBe(true);
   const emailed=await pool.query<{
    email_code_mac:string;email_code_sent_at:Date;
    email_code_expires_at:Date;resend_attempts:number;
   }>("select * from identity_auth_attempts where id=$1",[attemptId]);
   expect(emailed.rows[0]?.email_code_mac).toBe(emailMac);
   expect(emailed.rows[0]?.email_code_sent_at).toBeInstanceOf(Date);
   expect(emailed.rows[0]?.email_code_expires_at).toBeInstanceOf(Date);
   expect(emailed.rows[0]!.email_code_expires_at.getTime())
    .toBeLessThanOrEqual(row.expires_at.getTime());
   expect(emailed.rows[0]?.resend_attempts).toBe(1);
   expect(await repository.reserveVerification(attemptId)).toBe(true);
   const reserved=await pool.query<{verification_attempts:number}>(
    "select verification_attempts from identity_auth_attempts where id=$1",[attemptId]);
   expect(reserved.rows[0]?.verification_attempts).toBe(1);
   expect(await repository.consumeAttempt(attemptId,userId)).toBe(true);
   const consumed=await pool.query<{
    used_at:Date;verified_at:Date;sms_code_mac:string|null;
    email_code_mac:string|null;email_code_expires_at:Date|null;
   }>("select * from identity_auth_attempts where id=$1",[attemptId]);
   expect(consumed.rows[0]?.verified_at).toBeInstanceOf(Date);
   expect(consumed.rows[0]?.used_at).toBeInstanceOf(Date);
   expect(consumed.rows[0]?.sms_code_mac).toBeNull();
   expect(consumed.rows[0]?.email_code_mac).toBeNull();
   expect(consumed.rows[0]?.email_code_expires_at).toBeNull();
   expect(await repository.consumeAttempt(attemptId,userId)).toBe(false);
  });
 });
});
