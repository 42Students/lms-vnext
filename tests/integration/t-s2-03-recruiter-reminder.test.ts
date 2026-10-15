import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {createTpoLead} from "@/modules/placements/tpo-crm-service";
import {
 issueTpoRecruiterInvite,remindTpoRecruiterInvite,recordRecruiterInviteFirstOpen,
} from "@/modules/placements/tpo-recruiter-invite-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
import type {RequestContext} from "@/modules/identity/context";

const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL)&&
 process.env.TEST_DATABASE_URL===process.env.DATABASE_URL;
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const before=process.env.TPO_RECRUITER_REMINDER_READY;
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"seed-faculty",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
 organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};

async function invite(){
 const id=randomUUID();
 const lead=await createTpoLead(tpo,{collegeId:SEED_IDS.collegeA,name:"Reminder "+id,
  email:"reminder-"+id+"@example.test"});
 const sent=new Date();
 const issued=await issueTpoRecruiterInvite(tpo,SEED_IDS.collegeA,lead.id,sent);
 return {lead,issued,sent,day4:new Date(sent.getTime()+4*86_400_000+3_600_000)};
}

describe.skipIf(!enabled)("T-S2-03 recruiter reminder PostgreSQL",()=>{
 it("sends once after day four and rotates hash without extending original invite expiry",async()=>{
  if(!pool)throw new Error("Disposable PostgreSQL required");
  process.env.TPO_RECRUITER_REMINDER_READY="VERIFIED";
  const f=await invite();
  const seen:{token:string;expiry:Date;email:string}[]=[];
  const result=await remindTpoRecruiterInvite(tpo,SEED_IDS.collegeA,f.lead.id,
   async(email,token,expiry)=>{seen.push({email,token,expiry});return true;},f.day4);
  expect(result).toEqual({reminded:true});
  expect(seen).toHaveLength(1);
  expect(seen[0]?.expiry.toISOString()).toBe(f.issued.expiresAt.toISOString());
  expect(seen[0]?.token).not.toBe(f.issued.token);
  const row=(await pool.query<{invite_sent_at:Date;invite_token_hash:string;invite_reminder_sent_at:Date}>(
   "select invite_sent_at,invite_token_hash,invite_reminder_sent_at from placement_tpo_leads where id=$1",
   [f.lead.id],
  )).rows[0]!;
  expect(row.invite_sent_at.toISOString()).toBe(f.sent.toISOString());
  expect(row.invite_token_hash).not.toBeNull();
  expect(row.invite_reminder_sent_at.toISOString()).toBe(f.day4.toISOString());
  await expect(remindTpoRecruiterInvite(tpo,SEED_IDS.collegeA,f.lead.id,
   async()=>{throw new Error("Must not redeliver");},f.day4)).rejects.toBeDefined();
 });
 it("first open permanently suppresses the day-four reminder",async()=>{
  if(!pool)throw new Error("Disposable PostgreSQL required");
  process.env.TPO_RECRUITER_REMINDER_READY="VERIFIED";
  const f=await invite();
  expect(await recordRecruiterInviteFirstOpen(f.issued.token,new Date(f.sent.getTime()+10_000)))
   .toEqual({recorded:true});
  let sends=0;
  await expect(remindTpoRecruiterInvite(tpo,SEED_IDS.collegeA,f.lead.id,
   async()=>{sends++;return true;},f.day4)).rejects.toBeDefined();
  expect(sends).toBe(0);
 });
});
afterAll(async()=>{
 if(before===undefined)delete process.env.TPO_RECRUITER_REMINDER_READY;
 else process.env.TPO_RECRUITER_REMINDER_READY=before;
 await pool?.end();await closeDatabaseConnection();
});
