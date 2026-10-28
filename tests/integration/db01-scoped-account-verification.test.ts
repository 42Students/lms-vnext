import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {
 issueScopedAccountProof,redeemScopedAccountProof,
 type ScopedAccountProofRequest,
} from "@/modules/identity/scoped-account-verification-service";
import {drizzleLoginRepository} from "@/modules/auth/login-repository";
import {SEED_IDS} from "../../scripts/db-seed-data";

const url=process.env.TEST_DATABASE_URL;
if(!url||url!==process.env.DATABASE_URL)
 throw new Error("DB004 scoped role verification requires registered disposable PostgreSQL");
const pool=new Pool({connectionString:url,max:3});
const oldSecret=process.env.AUTH_ROLE_PROOF_SECRET;
process.env.AUTH_ROLE_PROOF_SECRET="db004-scoped-role-proof-"+randomUUID();
afterAll(async()=>{
 if(oldSecret===undefined)delete process.env.AUTH_ROLE_PROOF_SECRET;
 else process.env.AUTH_ROLE_PROOF_SECRET=oldSecret;
 await pool.end();await closeDatabaseConnection();
});
async function withRole(role:"LEARNER"|"FACULTY",run:(actor:{
 userId:string;memberId:string;rollNumber:string;contact:string;
})=>Promise<void>){
 const userId=randomUUID(),memberId=randomUUID(),rollNumber="R-"+userId.slice(0,8);
 const contact="db004-role-"+userId+"@example.test";
 try{
  await pool.query(
   "insert into users(id,identity_uid,email,phone_e164,platform_status) values($1,$2,$3,$4,'ACTIVE')",
   [userId,"db004-role-proof-"+userId,contact,"+91"+userId.replaceAll("-","").replace(/[a-f]/g,"5").slice(0,10)]);
  await pool.query(
   "insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
   [memberId,userId,SEED_IDS.collegeA]);
  await pool.query("insert into membership_roles(membership_id,role) values($1,$2)",
   [memberId,role]);
  if(role==="LEARNER"){
   await pool.query(
    "insert into learner_profiles(membership_id,roll_number,legacy_learner_id) values($1,$2,$3)",
    [memberId,rollNumber,Math.floor(Math.random()*800000)+100000]);
  }else{
   await pool.query(
    "insert into faculty_profiles(membership_id,legacy_faculty_id) values($1,$2)",
    [memberId,Math.floor(Math.random()*800000)+100000]);
  }
  await run({userId,memberId,rollNumber,contact});
 }finally{
  await pool.query("delete from identity_device_sessions where user_id=$1",[userId]);
  await pool.query("delete from identity_auth_attempts where user_id=$1",[userId]);
  await pool.query("delete from learner_profiles where membership_id=$1",[memberId]);
  await pool.query("delete from faculty_profiles where membership_id=$1",[memberId]);
  await pool.query("delete from membership_roles where membership_id=$1",[memberId]);
  await pool.query("delete from college_memberships where id=$1",[memberId]);
  await pool.query("delete from users where id=$1",[userId]);
 }
}
async function issue(input:ScopedAccountProofRequest){
 let code="",to="";
 const result=await issueScopedAccountProof(input,async target=>{
  code=target.code;to=target.to;
 });
 return {...result,code,to};
}
describe("DB-004 scoped role proof is not a login credential",()=>{
 for(const role of ["LEARNER","FACULTY"] as const){
  it(role+" verifies canonical membership only, never creates a device session",async()=>{
   await withRole(role,async actor=>{
    const input={
     userId:actor.userId,membershipId:actor.memberId,role,channel:"EMAIL" as const,
     ...(role==="LEARNER"?{expectedRollNumber:actor.rollNumber}:{}),
    };
    const issued=await issue(input);
    expect(issued.to).toBe(actor.contact);
    const stored=await pool.query<{
     membership_id:string;user_id:string;target_role:string;college_id:string;
     sms_code_mac:string|null;email_code_mac:string;contact_fingerprint:string;
    }>("select * from identity_auth_attempts where id=$1",[issued.challengeId]);
    expect(stored.rows[0]).toMatchObject({
     membership_id:actor.memberId,user_id:actor.userId,college_id:SEED_IDS.collegeA,
     target_role:role+"_PROOF",sms_code_mac:null,
    });
    expect(stored.rows[0]?.email_code_mac).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(stored.rows[0])).not.toContain(issued.code);
    // This challenge is forbidden in LOGIN even with a matching identity.
    expect(await drizzleLoginRepository.consumeAttempt(issued.challengeId,actor.userId))
     .toBe(false);
    const claim={challengeId:issued.challengeId,code:issued.code,
     userId:actor.userId,membershipId:actor.memberId,role};
    expect(await redeemScopedAccountProof({...claim,membershipId:randomUUID()}))
     .toBe(false);
    const winners=await Promise.all([
     redeemScopedAccountProof(claim),redeemScopedAccountProof(claim),
    ]);
    expect(winners.sort()).toEqual([false,true]);
    expect(await redeemScopedAccountProof(claim)).toBe(false);
    const sessions=await pool.query<{id:string}>(
     "select id from identity_device_sessions where user_id=$1",[actor.userId]);
    expect(sessions.rows).toHaveLength(0);
    const consumed=await pool.query<{
     used_at:Date|null;verified_at:Date|null;email_code_mac:string|null;
    }>("select used_at,verified_at,email_code_mac from identity_auth_attempts where id=$1",
     [issued.challengeId]);
    expect(consumed.rows[0]?.used_at).toBeInstanceOf(Date);
    expect(consumed.rows[0]?.verified_at).toBeInstanceOf(Date);
    expect(consumed.rows[0]?.email_code_mac).toBeNull();
   });
  });
 }
 it("never treats a learner roll as authentication, and checks real profile ownership",async()=>{
  await withRole("LEARNER",async actor=>{
   await expect(issue({
    userId:actor.userId,membershipId:actor.memberId,role:"LEARNER",
    channel:"EMAIL",expectedRollNumber:"WRONG",
   })).rejects.toThrow("ROLE_PROOF_SCOPE_INVALID");
   await expect(issue({
    userId:actor.userId,membershipId:actor.memberId,role:"FACULTY",
    channel:"EMAIL",
   })).rejects.toThrow("ROLE_PROOF_SCOPE_INVALID");
   const count=await pool.query<{total:string}>(
    "select count(*)::text as total from identity_auth_attempts where user_id=$1",
    [actor.userId]);
   expect(Number(count.rows[0]?.total)).toBe(0);
  });
 });
 it("does not consume proof after membership is suspended or source contact changes",async()=>{
  await withRole("LEARNER",async actor=>{
   const issued=await issue({userId:actor.userId,membershipId:actor.memberId,
    role:"LEARNER",channel:"PHONE",expectedRollNumber:actor.rollNumber});
   await pool.query(
    "update college_memberships set status='SUSPENDED',suspended_at=clock_timestamp() where id=$1",
    [actor.memberId]);
   expect(await redeemScopedAccountProof({
    challengeId:issued.challengeId,code:issued.code,userId:actor.userId,
    membershipId:actor.memberId,role:"LEARNER",
   })).toBe(false);
   const result=await pool.query<{superseded_at:Date|null}>(
    "select superseded_at from identity_auth_attempts where id=$1",[issued.challengeId]);
   expect(result.rows[0]?.superseded_at).toBeInstanceOf(Date);
   await pool.query(
    "update college_memberships set status='ACTIVE',suspended_at=null where id=$1",
    [actor.memberId]);
   expect(await redeemScopedAccountProof({
    challengeId:issued.challengeId,code:issued.code,userId:actor.userId,
    membershipId:actor.memberId,role:"LEARNER",
   })).toBe(false);
  });
 });
 it("denies a previously issued proof when its persisted role is revoked",async()=>{
  await withRole("FACULTY",async actor=>{
   const issued=await issue({userId:actor.userId,membershipId:actor.memberId,
    role:"FACULTY",channel:"EMAIL"});
   await pool.query("delete from membership_roles where membership_id=$1",[actor.memberId]);
   expect(await redeemScopedAccountProof({
    challengeId:issued.challengeId,code:issued.code,userId:actor.userId,
    membershipId:actor.memberId,role:"FACULTY",
   })).toBe(false);
   const closed=await pool.query<{superseded_at:Date|null;verified_at:Date|null}>(
    "select superseded_at,verified_at from identity_auth_attempts where id=$1",
    [issued.challengeId]);
   expect(closed.rows[0]?.superseded_at).toBeInstanceOf(Date);
   expect(closed.rows[0]?.verified_at).toBeNull();
  });
 });
 it("uses one atomic five-guess budget across wrong attempts",async()=>{
  await withRole("FACULTY",async actor=>{
   const issued=await issue({userId:actor.userId,membershipId:actor.memberId,
    role:"FACULTY",channel:"EMAIL"});
   const input={challengeId:issued.challengeId,userId:actor.userId,
    membershipId:actor.memberId,role:"FACULTY" as const,code:"000000"};
   const wrongs=await Promise.all(Array.from({length:8},()=>
    redeemScopedAccountProof(input)));
   expect(wrongs.every(x=>!x)).toBe(true);
   const limit=await pool.query<{verification_attempts:number}>(
    "select verification_attempts from identity_auth_attempts where id=$1",[issued.challengeId]);
   expect(limit.rows[0]?.verification_attempts).toBe(5);
   expect(await redeemScopedAccountProof({...input,code:issued.code})).toBe(false);
  });
 });
});
