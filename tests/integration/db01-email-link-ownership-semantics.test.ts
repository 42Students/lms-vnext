import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {
 issueEmailOwnershipLink,redeemEmailOwnershipLink,
 type EmailLinkScope,
} from "@/modules/identity/email-link-verification-service";
import {SEED_IDS} from "../../scripts/db-seed-data";

const url=process.env.TEST_DATABASE_URL;
if(!url||process.env.DATABASE_URL!==url)
 throw new Error("DB-004 email proof requires registered disposable PG URLs");
const pool=new Pool({connectionString:url,max:4});
const previousSecret=process.env.AUTH_EMAIL_VERIFICATION_SECRET;
const previousVersion=process.env.AUTH_EMAIL_VERIFICATION_KEY_VERSION;
process.env.AUTH_EMAIL_VERIFICATION_SECRET="db004-email-link-isolation-secret-"+randomUUID();
process.env.AUTH_EMAIL_VERIFICATION_KEY_VERSION="v1";
afterAll(async()=>{
 if(previousSecret===undefined)delete process.env.AUTH_EMAIL_VERIFICATION_SECRET;
 else process.env.AUTH_EMAIL_VERIFICATION_SECRET=previousSecret;
 if(previousVersion===undefined)delete process.env.AUTH_EMAIL_VERIFICATION_KEY_VERSION;
 else process.env.AUTH_EMAIL_VERIFICATION_KEY_VERSION=previousVersion;
 await pool.end();await closeDatabaseConnection();
});
type TestIdentity={
 userId:string;membershipId:string;email:string;identityUid:string;
};
async function withUser(run:(u:TestIdentity)=>Promise<void>){
 const userId=randomUUID(),membershipId=randomUUID();
 const email="db004-email-"+userId+"@example.test";
 const identityUid="db004-email-"+userId;
 try{
  await pool.query(
   "insert into users(id,identity_uid,email,platform_status) values($1,$2,$3,'ACTIVE')",
   [userId,identityUid,email]);
  await pool.query(
   "insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
   [membershipId,userId,SEED_IDS.collegeA]);
  await pool.query(
   "insert into membership_roles(membership_id,role) values($1,'LEARNER')",
   [membershipId]);
  await run({userId,membershipId,email,identityUid});
 }finally{
  await pool.query(
   "delete from identity_email_ownership_proofs where user_id=$1",[userId]);
  await pool.query(
   "delete from identity_email_verification_links where user_id=$1",[userId]);
  await pool.query("delete from membership_roles where membership_id=$1",[membershipId]);
  await pool.query("delete from college_memberships where id=$1",[membershipId]);
  await pool.query("delete from users where id=$1",[userId]);
 }
}
async function issued(scope:EmailLinkScope){
 let token="",delivered="";
 const response=await issueEmailOwnershipLink(scope,async message=>{
  token=message.token;delivered=message.to;
 });
 return {...response,token,delivered};
}
describe("DB-004 registered email verification link replacements",()=>{
 it("stores only keyed digests, enforces one winner and writes durable current-contact proof",async()=>{
  await withUser(async u=>{
   const link=await issued({userId:u.userId});
   expect(link.delivered).toBe(u.email);
   expect(link.token.length).toBeGreaterThanOrEqual(43);
   const record=await pool.query<{
    token_digest:string;email_fingerprint:string;email_key_version:string;
    created_at:Date;expires_at:Date;verified_at:Date|null;
   }>("select * from identity_email_verification_links where id=$1",[link.id]);
   expect(record.rows[0]?.token_digest).toMatch(/^[0-9a-f]{64}$/);
   expect(record.rows[0]?.email_fingerprint).toMatch(/^[0-9a-f]{64}$/);
   expect(record.rows[0]?.email_key_version).toBe("v1");
   expect(JSON.stringify(record.rows[0])).not.toContain(link.token);
   expect(JSON.stringify(record.rows[0])).not.toContain(u.email);
   const ttl=(record.rows[0]?.expires_at.getTime()??0)-
    (record.rows[0]?.created_at.getTime()??0);
   expect(ttl).toBe(24*60*60*1000);
   const attempts=await Promise.all([
    redeemEmailOwnershipLink(link.token),redeemEmailOwnershipLink(link.token),
   ]);
   expect(attempts.sort()).toEqual([false,true]);
   expect(await redeemEmailOwnershipLink(link.token)).toBe(false);
   const proof=await pool.query<{
    email_fingerprint:string;verification_link_id:string;verified_at:Date;
   }>("select * from identity_email_ownership_proofs where user_id=$1",[u.userId]);
   expect(proof.rows).toHaveLength(1);
   expect(proof.rows[0]?.email_fingerprint).toBe(record.rows[0]?.email_fingerprint);
   expect(proof.rows[0]?.verification_link_id).toBe(link.id);
   expect(proof.rows[0]?.verified_at).toBeInstanceOf(Date);
   expect(await redeemEmailOwnershipLink("incorrect-bearer")).toBe(false);
  });
 });
 it("requires live college and matching persisted membership; revoked scope cannot be restored",async()=>{
  await withUser(async u=>{
   await expect(issued({
    userId:u.userId,collegeId:SEED_IDS.collegeB,membershipId:u.membershipId,
   })).rejects.toThrow("EMAIL_LINK_SCOPE_INVALID");
   await expect(issued({
    userId:u.userId,collegeId:SEED_IDS.collegeA,
    membershipId:u.membershipId,applicationId:randomUUID(),
   })).rejects.toThrow("EMAIL_LINK_SCOPE_INVALID");
   const link=await issued({
    userId:u.userId,collegeId:SEED_IDS.collegeA,membershipId:u.membershipId,
   });
   await pool.query(
    "update college_memberships set status='SUSPENDED',suspended_at=clock_timestamp() where id=$1",
    [u.membershipId]);
   expect(await redeemEmailOwnershipLink(link.token)).toBe(false);
   const revoked=await pool.query<{revoked_at:Date|null}>(
    "select revoked_at from identity_email_verification_links where id=$1",[link.id]);
   expect(revoked.rows[0]?.revoked_at).toBeInstanceOf(Date);
   await pool.query(
    "update college_memberships set status='ACTIVE',suspended_at=null where id=$1",
    [u.membershipId]);
   expect(await redeemEmailOwnershipLink(link.token)).toBe(false);
   const proofs=await pool.query<{id:string}>(
    "select id from identity_email_ownership_proofs where user_id=$1",[u.userId]);
   expect(proofs.rows).toHaveLength(0);
  });
 });
 it("invalidates an outstanding link if the canonical email changes",async()=>{
  await withUser(async u=>{
   const link=await issued({userId:u.userId});
   await pool.query("update users set email=$1 where id=$2",
    ["new-"+u.email,u.userId]);
   expect(await redeemEmailOwnershipLink(link.token)).toBe(false);
   const revoked=await pool.query<{revoked_at:Date|null}>(
    "select revoked_at from identity_email_verification_links where id=$1",[link.id]);
   expect(revoked.rows[0]?.revoked_at).toBeInstanceOf(Date);
   await pool.query("update users set email=$1 where id=$2",[u.email,u.userId]);
   expect(await redeemEmailOwnershipLink(link.token)).toBe(false);
  });
 });
 it("never redeems expired links, including a link with a valid token",async()=>{
  await withUser(async u=>{
   const link=await issued({userId:u.userId});
   await pool.query(`
    update identity_email_verification_links
    set created_at=clock_timestamp()-interval '24 hours',
        expires_at=clock_timestamp()-interval '1 second'
    where id=$1`,[link.id]);
   expect(await redeemEmailOwnershipLink(link.token)).toBe(false);
  });
 });
 it("marks failed provider delivery unusable and enforces per-contact send cooldown",async()=>{
  await withUser(async u=>{
   await expect(issueEmailOwnershipLink({userId:u.userId},async()=>{throw Error("SMTP_DOWN");}))
    .rejects.toThrow("SMTP_DOWN");
   const after=await pool.query<{revoked_at:Date|null}>(
    "select revoked_at from identity_email_verification_links where user_id=$1",
    [u.userId]);
   expect(after.rows[0]?.revoked_at).toBeInstanceOf(Date);
   await expect(issued({userId:u.userId})).rejects.toThrow("EMAIL_LINK_RATE_LIMIT");
  });
 });
 it("never issues proofs for disabled identities or malformed untrusted scope",async()=>{
  await withUser(async u=>{
   await expect(issued({userId:u.userId,membershipId:u.membershipId}))
    .rejects.toThrow("EMAIL_LINK_SCOPE_INVALID");
   await pool.query("update users set platform_status='DISABLED' where id=$1",[u.userId]);
   await expect(issued({userId:u.userId})).rejects.toThrow("EMAIL_LINK_SCOPE_INVALID");
  });
 });
});
