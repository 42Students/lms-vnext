import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {getDb} from "@/db/client";
import {issueTpoCampaignRecipientToken} from "@/modules/messaging/tpo-campaign-recipient-token";
import {CampaignUnsubscribeInvalid,unsubscribeTpoCampaignRecipient}
 from "@/modules/messaging/tpo-campaign-unsubscribe-service";

vi.mock("@/db/client",()=>({getDb:vi.fn()}));
const college="11111111-1111-4111-8111-111111111111";
const campaign="22222222-2222-4222-8222-222222222222";
const recipient="33333333-3333-4333-8333-333333333333";
const lead="44444444-4444-4444-8444-444444444444";
const secret="s".repeat(64);
const prior=process.env.TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET;
const token=issueTpoCampaignRecipientToken({
 v:1,collegeId:college,campaignId:campaign,recipientId:recipient,
 expiresAt:4102444800000,
},secret);
type Stored={id:string;collegeId:string;campaignId:string;leadId:string;unsubscribedAt:Date|null};
function fakeDb(registered:boolean,row:Stored|null){
 const limit=vi.fn(async()=>row?[row]:[]);
 const select=vi.fn(()=>({from:vi.fn(()=>({where:vi.fn(()=>({
  for:vi.fn(()=>({limit})),
 }))}))}));
 const tx={select,update:vi.fn(),insert:vi.fn()};
 const db={execute:vi.fn(async()=>({rows:[{ready:registered}]})),
  transaction:vi.fn(async(cb:(input:typeof tx)=>Promise<unknown>)=>cb(tx))};
 vi.mocked(getDb).mockReturnValue(db as unknown as ReturnType<typeof getDb>);
 return {db,tx,limit};
}
beforeEach(()=>{
 vi.clearAllMocks();
 process.env.TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET=secret;
});
afterEach(()=>{
 if(prior===undefined)delete process.env.TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET;
 else process.env.TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET=prior;
});

describe("chat-16 TPO recipient unsubscribe live row decision",()=>{
 it("campaign-unsubscribe-service-16 validates purpose-bound HMAC before touching private database",async()=>{
  await expect(unsubscribeTpoCampaignRecipient(token+"changed"))
   .rejects.toBeInstanceOf(CampaignUnsubscribeInvalid);
  await expect(unsubscribeTpoCampaignRecipient("untrusted"))
   .rejects.toBeInstanceOf(CampaignUnsubscribeInvalid);
  expect(getDb).not.toHaveBeenCalled();
 });
 it("campaign-unsubscribe-service-17 refuses missing campaign recipient registration without pretending success",async()=>{
  const f=fakeDb(false,null);
  await expect(unsubscribeTpoCampaignRecipient(token)).rejects.toThrow("TPO_CAMPAIGNS_NOT_REGISTERED");
  expect(f.db.transaction).not.toHaveBeenCalled();
  expect(f.tx.select).not.toHaveBeenCalled();
 });
 it("campaign-unsubscribe-service-18 validates locked college/campaign/recipient identity before changes",async()=>{
  const f=fakeDb(true,null);
  await expect(unsubscribeTpoCampaignRecipient(token)).rejects.toBeInstanceOf(CampaignUnsubscribeInvalid);
  expect(f.db.transaction).toHaveBeenCalledOnce();
  expect(f.limit).toHaveBeenCalledWith(1);
  expect(f.tx.update).not.toHaveBeenCalled();
 });
 it("campaign-unsubscribe-service-19 an already unsubscribed recipient is idempotent, without repeat notifications",async()=>{
  const row:Stored={id:recipient,collegeId:college,campaignId:campaign,
   leadId:lead,unsubscribedAt:new Date("2026-10-18T00:00:00Z")};
  const f=fakeDb(true,row);
  await expect(unsubscribeTpoCampaignRecipient(token)).resolves.toEqual({unsubscribed:true});
  expect(f.tx.update).not.toHaveBeenCalled();
  expect(f.tx.insert).not.toHaveBeenCalled();
 });
});