import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {getDb} from "@/db/client";
import {persistVerifiedGlobalEmailSuppression,GlobalEmailSuppressionUnavailable} from "@/modules/operations/global-email-suppression-service";
import {deriveGlobalEmailSuppressionHashForAddress} from "@/modules/operations/outbound-delivery-envelope";
import {issueTpoCampaignEmailRecipientKey,issueTpoCampaignRecipientToken} from "@/modules/messaging/tpo-campaign-recipient-token";
import {unsubscribeTpoCampaignRecipient} from "@/modules/messaging/tpo-campaign-unsubscribe-service";

vi.mock("@/db/client",()=>({getDb:vi.fn()}));
vi.mock("@/modules/operations/global-email-suppression-service",()=>({
 persistVerifiedGlobalEmailSuppression:vi.fn(),
 GlobalEmailSuppressionUnavailable:class GlobalEmailSuppressionUnavailable extends Error {},
}));

const college="11111111-1111-4111-8111-111111111111";
const campaign="22222222-2222-4222-8222-222222222222";
const recipientId="33333333-3333-4333-8333-333333333333";
const lead="44444444-4444-4444-8444-444444444444";
const email="verified.campaign@example.com";
const secret="tpo-global-snapshot-recipient-secret-".repeat(2);
const globalKey=Buffer.alloc(32,37).toString("base64");
const token=issueTpoCampaignRecipientToken({
 v:1,collegeId:college,campaignId:campaign,recipientId,expiresAt:4102444800000,
},secret);

function fakeVerifiedDb(snapshotKey:string|null,locked=true){
 const preflightLimit=vi.fn(async()=>snapshotKey?[{
  recipientKey:snapshotKey,email,
 }]:[]);
 const select=vi.fn(()=>({
  from:()=>({innerJoin:()=>({where:()=>({orderBy:()=>({limit:preflightLimit})})})}),
 }));
 const lockedRow=locked?[{
  id:recipientId,collegeId:college,campaignId:campaign,leadId:lead,
  unsubscribedAt:new Date("2026-10-18T00:00:00Z"),
 }]:[];
 const txLimit=vi.fn(async()=>lockedRow);
 const tx={select:vi.fn(()=>({from:()=>({where:()=>({
  orderBy:()=>({for:()=>({limit:txLimit})}),
 })})})),update:vi.fn(),insert:vi.fn()};
 const transaction=vi.fn(async (cb:(argument:typeof tx)=>Promise<unknown>)=>cb(tx));
 const execute=vi.fn(async()=>({rows:[{ready:true}]}));
 vi.mocked(getDb).mockReturnValue({execute,select,transaction} as never);
 return {preflightLimit,select,execute,transaction,tx,txLimit};
}

beforeEach(()=>{
 vi.clearAllMocks();
 vi.stubEnv("TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET",secret);
 vi.stubEnv("DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64",globalKey);
});
afterEach(()=>vi.unstubAllEnvs());

describe("L08 / DB-050 campaign opt-outs use verified snapshots before global suppression",()=>{
 it("persistently suppresses exactly the original verified email, even on an idempotent replay",async()=>{
  const savedKey=issueTpoCampaignEmailRecipientKey(email,secret);
  const db=fakeVerifiedDb(savedKey);
  vi.mocked(persistVerifiedGlobalEmailSuppression).mockResolvedValue();
  await expect(unsubscribeTpoCampaignRecipient(token)).resolves.toEqual({unsubscribed:true});
  const recipientHash=deriveGlobalEmailSuppressionHashForAddress(email,globalKey);
  expect(persistVerifiedGlobalEmailSuppression).toHaveBeenCalledExactlyOnceWith({
   recipientHash,reason:"UNSUBSCRIBED",
  });
  expect(db.preflightLimit).toHaveBeenCalledWith(1);
  expect(db.txLimit).toHaveBeenCalledWith(1);
  expect(db.tx.update).not.toHaveBeenCalled();
  expect(db.tx.insert).not.toHaveBeenCalled();
  expect(JSON.stringify(vi.mocked(persistVerifiedGlobalEmailSuppression).mock.calls))
   .not.toContain(email);
 });
 it("does not globally suppress a replacement email whose campaign snapshot no longer matches",async()=>{
  const db=fakeVerifiedDb("a".repeat(64));
  await expect(unsubscribeTpoCampaignRecipient(token)).resolves.toEqual({unsubscribed:true});
  expect(db.preflightLimit).toHaveBeenCalledOnce();
  expect(db.transaction).toHaveBeenCalledOnce();
  expect(persistVerifiedGlobalEmailSuppression).not.toHaveBeenCalled();
 });
 it("does not issue suppression for a non-existent recipient even with a valid signed token",async()=>{
  const db=fakeVerifiedDb(null,false);
  await expect(unsubscribeTpoCampaignRecipient(token)).resolves.toEqual({unsubscribed:true});
  expect(db.preflightLimit).toHaveBeenCalledOnce();
  expect(persistVerifiedGlobalEmailSuppression).not.toHaveBeenCalled();
  expect(db.tx.update).not.toHaveBeenCalled();
 });
 it("cannot acknowledge local success when global outbox suppression is unavailable",async()=>{
  const db=fakeVerifiedDb(issueTpoCampaignEmailRecipientKey(email,secret));
  vi.mocked(persistVerifiedGlobalEmailSuppression).mockRejectedValue(
   new GlobalEmailSuppressionUnavailable());
  await expect(unsubscribeTpoCampaignRecipient(token))
   .rejects.toBeInstanceOf(GlobalEmailSuppressionUnavailable);
  expect(db.transaction).not.toHaveBeenCalled();
 });
 it("fails closed before CRM mutation on an invalid global HMAC key",async()=>{
  const db=fakeVerifiedDb(issueTpoCampaignEmailRecipientKey(email,secret));
  vi.stubEnv("DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64","invalid");
  await expect(unsubscribeTpoCampaignRecipient(token))
   .rejects.toBeInstanceOf(GlobalEmailSuppressionUnavailable);
  expect(db.transaction).not.toHaveBeenCalled();
  expect(persistVerifiedGlobalEmailSuppression).not.toHaveBeenCalled();
 });
 it("malformed or tampered tokens cannot probe the recipient table or reach global suppression",async()=>{
  const db=fakeVerifiedDb(issueTpoCampaignEmailRecipientKey(email,secret));
  await expect(unsubscribeTpoCampaignRecipient(token+".invalid"))
   .resolves.toEqual({unsubscribed:true});
  expect(db.execute).not.toHaveBeenCalled();
  expect(db.select).not.toHaveBeenCalled();
  expect(persistVerifiedGlobalEmailSuppression).not.toHaveBeenCalled();
 });
});
