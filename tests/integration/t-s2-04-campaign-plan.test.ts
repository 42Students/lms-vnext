import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {createTpoLead} from "@/modules/placements/tpo-crm-service";
import {planTpoCampaignRecipients} from "@/modules/messaging/tpo-campaign-send-policy";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL)&&
 process.env.TEST_DATABASE_URL===process.env.DATABASE_URL;
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"seed-faculty",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
 organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("T-S2-04 deduplicated campaign preview against persisted CRM",()=>{
 it("counts only eligible and deduplicated college-scoped contacts",async()=>{
  if(!pool)throw new Error("Disposable DB required");
  const uniq=randomUUID();
  const eligible=await createTpoLead(tpo,{collegeId:SEED_IDS.collegeA,
   name:"Eligible "+uniq,email:"eligible-"+uniq+"@example.test"});
  const optedOut=await createTpoLead(tpo,{collegeId:SEED_IDS.collegeA,
   name:"Opted out "+uniq,email:"opted-"+uniq+"@example.test"});
  await pool.query("UPDATE placement_tpo_leads SET unsubscribed_at=now(),invite_token_hash=null WHERE id=$1",
   [optedOut.id]);
  const {rows}=await pool.query<{
   id:string;emailNorm:string|null;unsubscribedAt:Date|null;inviteBouncedAt:Date|null;manualStage:string;
  }>(`select id,email_norm as "emailNorm",unsubscribed_at as "unsubscribedAt",
    invite_bounced_at as "inviteBouncedAt",manual_stage as "manualStage"
    from placement_tpo_leads where college_id=$1 and id=any($2::uuid[])`,
   [SEED_IDS.collegeA,[eligible.id,optedOut.id]]);
  const plan=planTpoCampaignRecipients(rows);
  expect(plan.recipientIds).toEqual([eligible.id]);
  expect(plan.suppressed.UNSUBSCRIBED).toBe(1);
  expect(JSON.stringify(plan)).not.toContain("@example.test");
 });
 afterAll(async()=>{await pool?.end();await closeDatabaseConnection();});
});
