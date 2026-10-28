import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { getAuthConfig, resetAuthConfigForTests } from "@/modules/auth/config";
import { sessionDigest } from "@/modules/auth/crypto";
import {
 createSession,resolveSession,revokeSessionByToken,revokeAllSessionsForUser,
 listActiveSessions,listOwnSessionRevocationHistory,revokeOwnSession,
 revokeOtherSessions,
} from "@/modules/auth/session-service";
import { closeDatabaseConnection } from "@/db/client";

/** DB-004 replaces historical JWT JTIs and blacklist rows with current,
 * user-scoped, keyed digest sessions. The legacy bearer is never imported.
 */
const url=process.env.TEST_DATABASE_URL;
if(!url||url!==process.env.DATABASE_URL)
 throw new Error("DB-004 device fields require matching disposable test PostgreSQL URLs");
const pool=new Pool({connectionString:url,max:2});
const previousSecret=process.env.AUTH_SECRET;
beforeAll(()=>{
 process.env.AUTH_SECRET="db004-session-semantics-"+randomUUID();
 resetAuthConfigForTests();
});
afterAll(async()=>{
 if(previousSecret===undefined)delete process.env.AUTH_SECRET;
 else process.env.AUTH_SECRET=previousSecret;
 resetAuthConfigForTests();
 await closeDatabaseConnection();
 await pool.end();
});
async function withUsers(run:(a:string,b:string)=>Promise<void>){
 const a=randomUUID(),b=randomUUID();
 try{
  for(const id of [a,b])await pool.query(
   "insert into users(id,identity_uid,platform_status) values($1,$2,'ACTIVE')",
   [id,"db004-sessions-"+id]);
  await run(a,b);
 }finally{
  await pool.query("delete from identity_device_sessions where user_id=any($1::uuid[])",[[a,b]]);
  await pool.query("delete from users where id=any($1::uuid[])",[[a,b]]);
 }
}
describe("DB-004 legacy session + refresh blacklist normalized behavior",()=>{
 it("persists keyed token digest, owner, safe device metadata, expiry and throttled last-seen without exposing secrets",async()=>{
  await withUsers(async(userId,otherId)=>{
   const created=await createSession(userId,{
    deviceName:"test-device-"+randomUUID(),
    userAgent:"browser-"+("A".repeat(600)),
    ipAddress:"test-address-"+("x".repeat(100)),
   });
   const digest=sessionDigest(getAuthConfig().secret,created.token);
   expect(digest).toMatch(/^[0-9a-f]{64}$/);
   expect(digest).not.toBe(created.token);
   const stored=await pool.query<{
    id:string;user_id:string;credential_digest:string;device_name:string;
    user_agent:string;ip_address:string;created_at:Date;
    last_seen_at:Date;expires_at:Date;revoked_at:Date|null;
   }>("select * from identity_device_sessions where credential_digest=$1",[digest]);
   const row=stored.rows[0]!;
   expect(row.user_id).toBe(userId);
   expect(row.credential_digest).toBe(digest);
   expect(row.device_name).toMatch(/^test-device-/);
   expect(row.user_agent.length).toBe(512);
   expect(row.ip_address.length).toBe(64);
   expect(row.created_at).toBeInstanceOf(Date);
   expect(row.last_seen_at).toBeInstanceOf(Date);
   expect(row.expires_at.getTime()).toBeGreaterThan(row.created_at.getTime());
   expect(row.revoked_at).toBeNull();
   await expect(resolveSession(created.token)).resolves.toEqual({
    ok:true,session:{
     sessionId:row.id,userId,identityUid:"db004-sessions-"+userId,
     platformStatus:"ACTIVE",
    },
   });
   expect(await listActiveSessions(userId)).toEqual([
    expect.objectContaining({id:row.id,device_name:row.device_name,
     user_agent:row.user_agent}),
   ]);
   expect(await listActiveSessions(otherId)).toEqual([]);
   expect(JSON.stringify(await listActiveSessions(userId))).not.toContain(digest);
   expect(await revokeOwnSession(row.id,otherId)).toBe(false);
   expect(await revokeOwnSession(row.id,userId)).toBe(true);
   await expect(resolveSession(created.token)).resolves.toEqual({
    ok:false,reason:"SESSION_REVOKED",
   });
   expect(await listActiveSessions(userId)).toEqual([]);
   const history=await listOwnSessionRevocationHistory(userId);
   expect(history).toEqual([expect.objectContaining({
    id:row.id,revocation_reason:"USER_REVOKED_DEVICE",
   })]);
   expect(JSON.stringify(history)).not.toContain(digest);
  });
 });

 it("revokes one JWT-replacement session on logout and all remaining sessions on account-wide block",async()=>{
  await withUsers(async(userId,otherId)=>{
   const first=await createSession(userId,{deviceName:"first"});
   const second=await createSession(userId,{deviceName:"second"});
   const outsider=await createSession(otherId,{deviceName:"outsider"});
   const secondDigest=sessionDigest(getAuthConfig().secret,second.token);
   const current=await pool.query<{id:string}>(
    "select id from identity_device_sessions where credential_digest=$1",[secondDigest]);
   expect(await revokeOtherSessions(userId,current.rows[0]!.id)).toBe(1);
   await expect(resolveSession(first.token)).resolves.toEqual({
    ok:false,reason:"SESSION_REVOKED",
   });
   await expect(resolveSession(second.token)).resolves.toMatchObject({ok:true});
   await revokeAllSessionsForUser(userId,userId,"SECURITY_REVOKE");
   const blocked=await pool.query<{
    revoked_at:Date;revoked_by_user_id:string;revocation_reason:string;
    user_id:string;expires_at:Date;
   }>("select * from identity_device_sessions where user_id=$1",[userId]);
   expect(blocked.rowCount).toBe(2);
   for(const row of blocked.rows){
    expect(row.user_id).toBe(userId);
    expect(row.revoked_at).toBeInstanceOf(Date);
    expect(row.revoked_by_user_id).toBe(userId);
    expect(["SECURITY_REVOKE","USER_SIGNED_OUT_OTHER_DEVICES"]).toContain(row.revocation_reason);
    expect(row.expires_at.getTime()).toBeGreaterThan(row.revoked_at.getTime());
   }
   await expect(resolveSession(second.token)).resolves.toEqual({
    ok:false,reason:"SESSION_REVOKED",
   });
   await expect(resolveSession(outsider.token)).resolves.toMatchObject({ok:true});
   await revokeSessionByToken(outsider.token);
   await expect(resolveSession(outsider.token)).resolves.toEqual({
    ok:false,reason:"SESSION_REVOKED",
   });
  });
 });
});
