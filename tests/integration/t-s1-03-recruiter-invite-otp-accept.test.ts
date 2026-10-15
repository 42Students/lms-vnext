import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {resolveRequestContext} from "@/modules/identity/context-service";
import {createTpoLead} from "@/modules/placements/tpo-crm-service";
import {issueTpoRecruiterInvite} from "@/modules/placements/tpo-recruiter-invite-service";
import {requestRecruiterInviteOtp} from "@/modules/placements/recruiter-invite-otp-service";
import {acceptTpoRecruiterInviteOtp} from "@/modules/placements/recruiter-invite-otp-accept-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

/** T-S1-01/T-S1-03: real 0092/0093 tables and transaction concurrency.
 * Isolated disposable database only. These fixtures deliberately remain in
 * that throwaway database because CRM history is immutable/append-only.
 */
const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1" &&
 Boolean(process.env.TEST_DATABASE_URL) &&
 process.env.TEST_DATABASE_URL===process.env.DATABASE_URL;
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:4}):null;
const saved={
  ready:process.env.TPO_RECRUITER_OTP_READY,
  secret:process.env.TPO_RECRUITER_OTP_HMAC_SECRET,
};
const tpo:RequestContext={
 user:{id:SEED_IDS.facultyUser,identityUid:"seed-faculty",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]},
};

async function fixture(){
 if(!pool)throw new Error("Isolated PG required");
 const uid=randomUUID(),identity="otp-fixture-"+uid,email="otp-"+uid+"@example.test";
 const user=(await pool.query<{id:string}>(
  "insert into users(identity_uid,email,display_name) values($1,$2,$3) returning id",
  [identity,email,"OTP recruiter"],
 )).rows[0]!;
 const company=(await pool.query<{id:string}>(
  "insert into placement_companies(name,created_by_user_id) values($1,$2) returning id",
  ["OTP company "+uid,SEED_IDS.facultyUser],
 )).rows[0]!;
 const relationship=(await pool.query<{id:string}>(
  "insert into placement_company_relationships(college_id,company_id,created_by_user_id) values($1,$2,$3) returning id",
  [SEED_IDS.collegeA,company.id,SEED_IDS.facultyUser],
 )).rows[0]!;
 await pool.query(`insert into placement_tpo_college_settings(college_id,recruiter_access_months)
   values($1,12) on conflict(college_id) do update set recruiter_access_months=12`,
   [SEED_IDS.collegeA]);
 const lead=await createTpoLead(tpo,{
  collegeId:SEED_IDS.collegeA,name:"OTP candidate "+uid,email,companyName:"OTP company "+uid,
 });
 await pool.query("update placement_tpo_leads set company_relationship_id=$1 where id=$2 and college_id=$3",
  [relationship.id,lead.id,SEED_IDS.collegeA]);
 const invite=await issueTpoRecruiterInvite(tpo,SEED_IDS.collegeA,lead.id);
 const receiver:RequestContext={user:{id:user.id,identityUid:identity,platformStatus:"ACTIVE",systemRoles:[]},membership:null};
 return {user,identity,email,company,relationship,lead,token:invite.token,receiver};
}
async function deliverOtp(token:string){
 let code="";
 const result=await requestRecruiterInviteOtp(token,async (_email,issued)=>{
  code=issued;return true;
 });
 expect(result).toEqual({sent:true});
 expect(code).toMatch(/^\d{6}$/);
 return code;
}
async function noGrant(userId:string){
 if(!pool)throw new Error("DB required");
 const rows=await pool.query(
  "select id from placement_recruiter_college_grants where recruiter_user_id=$1",
  [userId],
 );
 expect(rows.rowCount).toBe(0);
}

describe.skipIf(!enabled)("T-S1-03 0092/0093 recruiter OTP PostgreSQL acceptance",()=>{
 it("has migrated tables and fail-closed validity columns",async()=>{
  if(!pool)throw new Error("DB required");
  const {rows}=await pool.query<{code:string|null;grants:string|null}>(
   "select to_regclass('public.recruiter_invite_code')::text as code, " +
   "to_regclass('public.placement_recruiter_college_grants')::text as grants");
  expect(rows[0]?.code).toBe("recruiter_invite_code");
  expect(rows[0]?.grants).toBe("placement_recruiter_college_grants");
  const cols=(await pool.query<{column_name:string}>(
   "select column_name from information_schema.columns where table_name='placement_recruiter_college_grants'"
  )).rows.map(x=>x.column_name);
  expect(cols).toEqual(expect.arrayContaining(["valid_until","capabilities","verification_status"]));
 });
 it("accepts one delivered code, consumes token and creates verified expiring grant atomically",async()=>{
  if(!pool)throw new Error("DB required");
  const f=await fixture(),code=await deliverOtp(f.token);
  const [first,second]=await Promise.allSettled([
    acceptTpoRecruiterInviteOtp(f.receiver,f.token,code),
    acceptTpoRecruiterInviteOtp(f.receiver,f.token,code),
  ]);
  expect([first,second].filter(x=>x.status==="fulfilled")).toHaveLength(1);
  const result=(await pool.query<{valid_until:Date;verification_status:string;capabilities:string[]}>(
   "select valid_until,verification_status,capabilities from placement_recruiter_college_grants where recruiter_user_id=$1",
   [f.user.id],
  )).rows;
  expect(result).toHaveLength(1);
  expect(result[0]?.verification_status).toBe("VERIFIED");
  expect(result[0]?.capabilities).toContain("DRIVES");
  expect(result[0]!.valid_until.getTime()).toBeGreaterThan(Date.now());
  const record=(await pool.query<{consumed_at:Date|null}>(
   "select consumed_at from recruiter_invite_code where lead_id=$1 order by sent_at desc limit 1",[f.lead.id]
  )).rows[0];
  expect(record?.consumed_at).toBeInstanceOf(Date);
  const lead=(await pool.query<{invite_token_hash:string|null;recruiter_user_id:string|null}>(
   "select invite_token_hash,recruiter_user_id from placement_tpo_leads where id=$1",[f.lead.id]
  )).rows[0];
  expect(lead).toMatchObject({invite_token_hash:null,recruiter_user_id:f.user.id});
  const ctx=await resolveRequestContext({identityUid:f.identity});
  expect(ctx.recruiter?.grants.some(x=>x.collegeId===SEED_IDS.collegeA)).toBe(true);
  await expect(acceptTpoRecruiterInviteOtp(f.receiver,f.token,code)).rejects.toBeDefined();
 });
 it("fails closed after grant expiry, unverification or capability removal without an env gate",async()=>{
  if(!pool)throw new Error("DB required");
  const f=await fixture(),code=await deliverOtp(f.token);
  await expect(acceptTpoRecruiterInviteOtp(f.receiver,f.token,code))
    .resolves.toEqual({accepted:true});
  expect((await resolveRequestContext({identityUid:f.identity})).recruiter?.grants).toHaveLength(1);
  const original=(await pool.query<{valid_until:Date;capabilities:string[]}>(
    "select valid_until,capabilities from placement_recruiter_college_grants where recruiter_user_id=$1",
    [f.user.id],
  )).rows[0]!;
  await pool.query("update placement_recruiter_college_grants set created_at=now()-interval '2 days',valid_until=now()-interval '1 second' where recruiter_user_id=$1",[f.user.id]);
  expect((await resolveRequestContext({identityUid:f.identity})).recruiter).toBeNull();
  await pool.query("update placement_recruiter_college_grants set valid_until=$2,verification_status='PENDING' where recruiter_user_id=$1",
    [f.user.id,original.valid_until]);
  expect((await resolveRequestContext({identityUid:f.identity})).recruiter).toBeNull();
  await pool.query("update placement_recruiter_college_grants set verification_status='VERIFIED',capabilities=ARRAY['MESSAGES']::text[] where recruiter_user_id=$1",
    [f.user.id]);
  expect((await resolveRequestContext({identityUid:f.identity})).recruiter).toBeNull();
  await pool.query("update placement_recruiter_college_grants set capabilities=$2::text[] where recruiter_user_id=$1",
    [f.user.id,original.capabilities]);
  expect((await resolveRequestContext({identityUid:f.identity})).recruiter?.grants).toHaveLength(1);
 });
 it("persists five wrong guesses even on denied calls, then locks out the correct code",async()=>{
  if(!pool)throw new Error("DB required");
  const f=await fixture(),valid=await deliverOtp(f.token);
  const wrong=valid==="000000"?"999999":"000000";
  for(let n=0;n<5;n++){
   await expect(acceptTpoRecruiterInviteOtp(f.receiver,f.token,wrong)).rejects.toBeDefined();
  }
  const attempts=(await pool.query<{failed_attempts:number}>(
   "select failed_attempts from recruiter_invite_code where lead_id=$1 order by sent_at desc limit 1",[f.lead.id]
  )).rows[0];
  expect(attempts?.failed_attempts).toBe(5);
  await expect(acceptTpoRecruiterInviteOtp(f.receiver,f.token,valid)).rejects.toBeDefined();
  await noGrant(f.user.id);
 });
 it("rejects cross-user identity and exact expiry without creating a grant",async()=>{
  if(!pool)throw new Error("DB required");
  const f=await fixture(),code=await deliverOtp(f.token);
  await expect(acceptTpoRecruiterInviteOtp(tpo,f.token,code)).rejects.toBeDefined();
  await noGrant(f.user.id);
  await pool.query("update recruiter_invite_code set expires_at=sent_at+interval '1 second' where lead_id=$1",[f.lead.id]);
  await pool.query("update recruiter_invite_code set sent_at=now()-interval '20 minutes',expires_at=now()-interval '19 minutes' where lead_id=$1",[f.lead.id]);
  await expect(acceptTpoRecruiterInviteOtp(f.receiver,f.token,code)).rejects.toBeDefined();
  await noGrant(f.user.id);
 });
 afterAll(async()=>{
  if(saved.ready===undefined)delete process.env.TPO_RECRUITER_OTP_READY;
  else process.env.TPO_RECRUITER_OTP_READY=saved.ready;
  if(saved.secret===undefined)delete process.env.TPO_RECRUITER_OTP_HMAC_SECRET;
  else process.env.TPO_RECRUITER_OTP_HMAC_SECRET=saved.secret;
  await pool?.end();
  await closeDatabaseConnection();
 });
});
if(enabled){
 process.env.TPO_RECRUITER_OTP_READY="VERIFIED";
 process.env.TPO_RECRUITER_OTP_HMAC_SECRET="disposable-test-only-recruiter-invite-secret-32chars";
}
