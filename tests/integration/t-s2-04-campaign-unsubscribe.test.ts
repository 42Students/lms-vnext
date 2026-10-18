import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {createTpoLead} from "@/modules/placements/tpo-crm-service";
import {issueTpoCampaignRecipientToken} from "@/modules/messaging/tpo-campaign-recipient-token";
import {unsubscribeTpoCampaignRecipient} from "@/modules/messaging/tpo-campaign-unsubscribe-service";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&
 Boolean(process.env.TEST_DATABASE_URL)&&process.env.TEST_DATABASE_URL===process.env.DATABASE_URL&&
 process.env.TPO_CAMPAIGNS_READY==="VERIFIED";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const secret="test-only-campaign-unsubscribe-hmac-secret-32-bytes";
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"seed-faculty",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
 organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
const previous=process.env.TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET;
describe.skipIf(!enabled)("T-S2-04 staged campaign unsubscribe PostgreSQL",()=>{
 it("atomically cancels active invites, suppresses campaign recipients and is idempotent",async()=>{
  if(!pool)throw new Error("Disposable PostgreSQL required");
  process.env.TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET=secret;
  const id=randomUUID(),email="campaign-"+id+"@example.org";
  const lead=await createTpoLead(tpo,{collegeId:SEED_IDS.collegeA,name:"Campaign opt out "+id,email});
  await pool.query("update placement_tpo_leads set invite_token_hash=$1,invite_sent_at=now() where id=$2",
   ["a".repeat(64),lead.id]);
  const campaignId=randomUUID(),recipientId=randomUUID();
  await pool.query(`insert into placement_tpo_email_campaigns
   (id,college_id,created_by_user_id,total_recipients) values($1,$2,$3,1)`,
   [campaignId,SEED_IDS.collegeA,SEED_IDS.facultyUser]);
  await pool.query(`insert into placement_tpo_email_campaign_recipients
   (id,college_id,campaign_id,lead_id,recipient_key) values($1,$2,$3,$4,$5)`,
   [recipientId,SEED_IDS.collegeA,campaignId,lead.id,"b".repeat(64)]);
  const token=issueTpoCampaignRecipientToken({v:1,collegeId:SEED_IDS.collegeA,
   campaignId,recipientId,expiresAt:Date.now()+60_000},secret);
  expect(await unsubscribeTpoCampaignRecipient(token)).toEqual({unsubscribed:true});
  expect(await unsubscribeTpoCampaignRecipient(token)).toEqual({unsubscribed:true});
  const updated=(await pool.query<{unsubscribed_at:Date|null;invite_token_hash:string|null}>(
   "select unsubscribed_at,invite_token_hash from placement_tpo_leads where id=$1",[lead.id],
  )).rows[0];
  expect(updated?.unsubscribed_at).toBeInstanceOf(Date);
  expect(updated?.invite_token_hash).toBeNull();
  const recipient=(await pool.query<{unsubscribed_at:Date|null;status:string}>(
   "select unsubscribed_at,status from placement_tpo_email_campaign_recipients where id=$1",[recipientId],
  )).rows[0];
  expect(recipient?.status).toBe("UNSUBSCRIBED");
  expect(recipient?.unsubscribed_at).toBeInstanceOf(Date);
  const activity=(await pool.query<{total:number}>(
   "select count(*)::int as total from placement_tpo_lead_activities where lead_id=$1 and note='Unsubscribed from emails'",
   [lead.id],
  )).rows[0];
  expect(activity?.total).toBe(1);
  // Append-only audit history is intentionally left in the isolated database.
 });
 it("enforces one recipient digest per campaign, even across two different lead IDs",async()=>{
  if(!pool)throw new Error("Disposable PostgreSQL required");
  const ref=randomUUID();
  const a=await createTpoLead(tpo,{collegeId:SEED_IDS.collegeA,
   name:"Campaign dedupe A "+ref,email:"first-"+ref+"@example.org"});
  const b=await createTpoLead(tpo,{collegeId:SEED_IDS.collegeA,
   name:"Campaign dedupe B "+ref,email:"second-"+ref+"@example.org"});
  const campaignId=randomUUID(),key="c".repeat(64);
  await pool.query(`insert into placement_tpo_email_campaigns
   (id,college_id,created_by_user_id,total_recipients) values($1,$2,$3,1)`,
   [campaignId,SEED_IDS.collegeA,SEED_IDS.facultyUser]);
  await pool.query(`insert into placement_tpo_email_campaign_recipients
   (college_id,campaign_id,lead_id,recipient_key) values($1,$2,$3,$4)`,
   [SEED_IDS.collegeA,campaignId,a.id,key]);
  await expect(pool.query(`insert into placement_tpo_email_campaign_recipients
   (college_id,campaign_id,lead_id,recipient_key) values($1,$2,$3,$4)`,
   [SEED_IDS.collegeA,campaignId,b.id,key])).rejects.toMatchObject({code:"23505"});
 });
 it("rejects campaign or recipient swaps using a valid but different signed claim",async()=>{
  if(!pool)throw new Error("Disposable PostgreSQL required");
  process.env.TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET=secret;
  const token=issueTpoCampaignRecipientToken({v:1,collegeId:SEED_IDS.collegeA,
   campaignId:randomUUID(),recipientId:randomUUID(),expiresAt:Date.now()+60_000},secret);
  await expect(unsubscribeTpoCampaignRecipient(token)).rejects.toBeDefined();
 });
});
afterAll(async()=>{
 if(previous===undefined)delete process.env.TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET;
 else process.env.TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET=previous;
 await pool?.end();await closeDatabaseConnection();
});
