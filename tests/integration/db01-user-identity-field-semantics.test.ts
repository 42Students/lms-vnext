import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {drizzleLoginRepository} from "@/modules/auth/login-repository";
import {resolveRequestContext} from "@/modules/identity/context-service";
import {closeDatabaseConnection} from "@/db/client";

/** DB-004: direct source-field user mapping through live canonical login and
 * context resolution. Does not approve legacy password/username imports.
 */
const url=process.env.TEST_DATABASE_URL;
if(!url||process.env.DATABASE_URL!==url)
 throw new Error("DB004 user mapping requires matching disposable test database URLs");
const pool=new Pool({connectionString:url,max:2});
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
describe("DB-004 canonical first-party user identity persistence",()=>{
 it("round-trips live canonical identity, contacts and display name, then denies disabled identity",async()=>{
  const id=randomUUID(),uid="db004-user-"+id;
  const phone="+91"+String(Math.floor(Math.random()*10000000000)).padStart(10,"0");
  const email="identity-"+id+"@example.test",name="DB004 Identity Witness";
  try{
   await pool.query(
    `insert into users(id,identity_uid,phone_e164,email,display_name,platform_status)
     values($1,$2,$3,$4,$5,'ACTIVE')`,
    [id,uid,phone,email,name]);
   const row=await pool.query<{
    id:string;identity_uid:string;phone_e164:string;email:string;
    display_name:string;platform_status:string;created_at:Date;updated_at:Date;
   }>("select * from users where id=$1",[id]);
   expect(row.rows[0]).toMatchObject({
    id,identity_uid:uid,phone_e164:phone,email,
    display_name:name,platform_status:"ACTIVE",
   });
   expect(row.rows[0]?.created_at).toBeInstanceOf(Date);
   expect(row.rows[0]?.updated_at).toBeInstanceOf(Date);
   expect(await drizzleLoginRepository.findUserByPhone(phone)).toMatchObject({
    id,identityUid:uid,phoneE164:phone,email,displayName:name,platformStatus:"ACTIVE",
   });
   expect(await drizzleLoginRepository.findUserByEmail(email.toUpperCase())).toMatchObject({
    id,identityUid:uid,
   });
   await expect(resolveRequestContext({identityUid:uid})).resolves.toMatchObject({
    user:{id,identityUid:uid,platformStatus:"ACTIVE"},membership:null,
   });
   await pool.query(
    "update users set platform_status='DISABLED',updated_at=clock_timestamp() where id=$1",[id]);
   const after=await pool.query<{updated_at:Date;platform_status:string}>(
    "select updated_at,platform_status from users where id=$1",[id]);
   expect(after.rows[0]?.platform_status).toBe("DISABLED");
   expect(after.rows[0]?.updated_at).toBeInstanceOf(Date);
   expect(after.rows[0]!.updated_at.getTime()).toBeGreaterThanOrEqual(
    row.rows[0]!.updated_at.getTime());
   await expect(resolveRequestContext({identityUid:uid})).rejects.toMatchObject({
    code:"USER_DISABLED",
   });
  }finally{
   await pool.query("delete from users where id=$1",[id]);
  }
 });
});
