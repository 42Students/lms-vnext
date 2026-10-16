import {randomUUID} from "node:crypto";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {createTpoLead} from "@/modules/placements/tpo-crm-service";
import {issueTpoRecruiterInvite} from "@/modules/placements/tpo-recruiter-invite-service";
import {requestRecruiterInviteOtp} from "@/modules/placements/recruiter-invite-otp-service";
import {acceptPublicTpoRecruiterInviteOtp} from "@/modules/placements/public-recruiter-invite-accept-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL)&&
 process.env.TEST_DATABASE_URL===process.env.DATABASE_URL;
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:4}):null;
const original={otp:process.env.TPO_RECRUITER_OTP_READY,
 secret:process.env.TPO_RECRUITER_OTP_HMAC_SECRET};
const tpo:RequestContext={
 user:{id:SEED_IDS.facultyUser,identityUid:"seed-faculty",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]},
};
async function fixture(){
 if(!pool)throw new Error("Disposable database is required");
 const nonce=randomUUID(),email="new-"+nonce+"@invited.example";
 const [company]=(await pool.query<{id:string}>(
  "insert into placement_companies(name,created_by_user_id) values($1,$2) returning id",
  ["Invited employer "+nonce,SEED_IDS.facultyUser])).rows;
 const [relationship]=(await pool.query<{id:string}>(
  "insert into placement_company_relationships(college_id,company_id,created_by_user_id) values($1,$2,$3) returning id",
  [SEED_IDS.collegeA,company!.id,SEED_IDS.facultyUser])).rows;
 const lead=await createTpoLead(tpo,{
  collegeId:SEED_IDS.collegeA,name:"Invited recruiter",email,companyName:"Invited employer "+nonce,
 });
 await pool.query(
  "update placement_tpo_leads set company_relationship_id=$1 where id=$2 and college_id=$3",
  [relationship!.id,lead.id,SEED_IDS.collegeA]);
 const invite=await issueTpoRecruiterInvite(tpo,SEED_IDS.collegeA,lead.id);
 let code="";
 await requestRecruiterInviteOtp(invite.token,async (target,delivered)=>{
  expect(target).toBe(email);code=delivered;return true;
 });
 return {lead,email,code,token:invite.token,companyId:company!.id};
}
describe.skipIf(!enabled)("PUB-auth-public-40/41/42 public invite disposable PostgreSQL",()=>{
 beforeAll(()=>{
  process.env.TPO_RECRUITER_OTP_READY="VERIFIED";
  process.env.TPO_RECRUITER_OTP_HMAC_SECRET="disposable-public-invite-otp-secret-for-tests";
 });
 afterAll(async()=>{
  if(original.otp===undefined)delete process.env.TPO_RECRUITER_OTP_READY;
  else process.env.TPO_RECRUITER_OTP_READY=original.otp;
  if(original.secret===undefined)delete process.env.TPO_RECRUITER_OTP_HMAC_SECRET;
  else process.env.TPO_RECRUITER_OTP_HMAC_SECRET=original.secret;
  await pool?.end();await closeDatabaseConnection();
 });
 it("creates account and a grant exactly once from verified work email, with notification",async()=>{
  const f=await fixture();
  const [a,b]=await Promise.allSettled([
   acceptPublicTpoRecruiterInviteOtp(f.token,f.code),
   acceptPublicTpoRecruiterInviteOtp(f.token,f.code),
  ]);
  expect([a,b].filter(item=>item.status==="fulfilled")).toHaveLength(1);
  const success=[a,b].find(item=>item.status==="fulfilled");
  if(success?.status==="fulfilled")expect(success.value).toMatchObject({
   accepted:true,outcome:"JOINED",signInEmail:f.email,
  });
  const identity=(await pool!.query<{id:string}>(
   "select id from users where email=$1",[f.email])).rows[0];
  expect(identity?.id).toBeDefined();
  const grants=(await pool!.query<{valid_until:Date;verification_status:string;capabilities:string[]}>(
   "select g.valid_until,g.verification_status,g.capabilities from placement_recruiter_college_grants g "+
   "join placement_company_relationships r on r.id=g.company_relationship_id "+
   "where g.recruiter_user_id=$1 and r.company_id=$2",
   [identity!.id,f.companyId])).rows;
  expect(grants).toHaveLength(1);
  expect(grants[0]!.verification_status).toBe("VERIFIED");
  expect(grants[0]!.capabilities).toContain("DRIVES");
  expect(grants[0]!.valid_until.getTime()).toBeGreaterThan(Date.now());
  const state=(await pool!.query<{invite_token_hash:string|null,recruiter_user_id:string|null}>(
   "select invite_token_hash,recruiter_user_id from placement_tpo_leads where id=$1",
   [f.lead.id])).rows[0];
  expect(state).toMatchObject({invite_token_hash:null,recruiter_user_id:identity!.id});
  const notices=(await pool!.query<{n:number}>(
   "select count(*)::integer as n from in_app_notifications n join activity_events e "+
   "on e.id=n.event_id where e.subject_id=$1 and e.event_type='PLACEMENTS_RECRUITER_JOINED'",
   [f.lead.id])).rows[0];
  expect(notices?.n).toBeGreaterThan(0);
 });
 it("persists five wrong-code attempts and cannot grant afterward",async()=>{
  const f=await fixture(),wrong=f.code==="000000"?"999999":"000000";
  for(let i=0;i<5;i++)await expect(acceptPublicTpoRecruiterInviteOtp(f.token,wrong)).rejects.toBeDefined();
  await expect(acceptPublicTpoRecruiterInviteOtp(f.token,f.code)).rejects.toBeDefined();
  const codes=(await pool!.query<{failed_attempts:number}>(
   "select failed_attempts from recruiter_invite_code where lead_id=$1 "+
   "order by sent_at desc limit 1",[f.lead.id])).rows[0];
  expect(codes?.failed_attempts).toBe(5);
  const users=(await pool!.query<{n:number}>("select count(*)::integer as n from users where email=$1",
    [f.email])).rows[0];
  expect(users?.n).toBe(0);
 });
});
