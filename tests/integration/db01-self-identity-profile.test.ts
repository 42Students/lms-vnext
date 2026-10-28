import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { getOwnIdentityProfile, updateOwnIdentityName } from "@/modules/people/identity-profile-service";
import type { RequestContext } from "@/modules/identity/context";
const url=process.env.TEST_DATABASE_URL;
if(!url||process.env.DATABASE_URL!==url)
 throw new Error("DB-004 identity self-service needs matching disposable database URLs");
const pool=new Pool({connectionString:url,max:2});
async function fixture(run:(ctx:RequestContext)=>Promise<void>){
 const id=randomUUID(),identityUid="db004-self-"+id;
 await pool.query("INSERT INTO users (id,identity_uid,display_name) VALUES ($1,$2,'Original Name')",[id,identityUid]);
 const ctx:RequestContext={user:{id,identityUid,platformStatus:"ACTIVE",systemRoles:[]},membership:null};
 try{await run(ctx);}finally{
  await pool.query("DELETE FROM users WHERE id=$1",[id]);
 }
}
afterAll(async()=>{await closeDatabaseConnection();await pool.end();});
describe("DB-004 first-party own identity profile",()=>{
 it("reads and edits only authenticated user's names using optimistic concurrency",async()=>{
  await fixture(async ctx=>{
   const initial=await getOwnIdentityProfile(ctx);
   expect(initial).toMatchObject({givenName:null,familyName:null,
    displayName:"Original Name",version:1});
   const saved=await updateOwnIdentityName(ctx,{givenName:"Mary Ann",
    familyName:"van der Berg"},1);
   expect(saved).toMatchObject({givenName:"Mary Ann",familyName:"van der Berg",
    displayName:"Mary Ann van der Berg",version:2});
   await expect(updateOwnIdentityName(ctx,{givenName:"Stale",familyName:"Writer"},1))
    .rejects.toMatchObject({code:"IDENTITY_PROFILE_VERSION_CONFLICT"});
   const current=await getOwnIdentityProfile(ctx);
   expect(current).toMatchObject({givenName:"Mary Ann",familyName:"van der Berg",version:2});
  });
 });
 it("denies stale disabled identity even with old context and valid version",async()=>{
  await fixture(async ctx=>{
   await pool.query("UPDATE users SET platform_status='DISABLED' WHERE id=$1",[ctx.user.id]);
   await expect(updateOwnIdentityName(ctx,{givenName:"Denied",familyName:""},1)).rejects.toBeDefined();
  });
 });
});
