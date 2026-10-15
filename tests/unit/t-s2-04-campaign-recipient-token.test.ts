import {describe,expect,it} from "vitest";
import {issueTpoCampaignRecipientToken,verifyTpoCampaignRecipientToken,matchesCampaignRecipient} from "@/modules/messaging/tpo-campaign-recipient-token";
describe("T-S2-04 recipient-bound unsubscribe links",()=>{
 const secret="this is a campaign-only HMAC secret of adequate length";
 const t=Date.parse("2026-10-16T00:00:00Z");
 const claim={v:1 as const,collegeId:"83fc470d-e95b-4c64-af02-543f3c4e79be",
  campaignId:"b87551a0-adc4-483d-9079-2db30de588f4",
  recipientId:"f34184ae-ed81-4df8-a0bb-df1341274383",expiresAt:t+600000};
 it("is scoped to a specific recipient and campaign",()=>{
  const token=issueTpoCampaignRecipientToken(claim,secret);
  expect(verifyTpoCampaignRecipientToken(token,secret,t)).toEqual(claim);
  expect(matchesCampaignRecipient(claim,{id:claim.recipientId,collegeId:claim.collegeId,campaignId:claim.campaignId,unsubscribedAt:null})).toBe(true);
  expect(matchesCampaignRecipient(claim,{id:claim.recipientId,collegeId:claim.collegeId,campaignId:"other",unsubscribedAt:null})).toBe(false);
 });
 it("rejects tampering, wrong key and exact expiry",()=>{
  const token=issueTpoCampaignRecipientToken(claim,secret);
  expect(verifyTpoCampaignRecipientToken(token,secret,claim.expiresAt)).toBeNull();
  expect(verifyTpoCampaignRecipientToken(token,secret+"changed",t)).toBeNull();
  expect(verifyTpoCampaignRecipientToken(token+"x",secret,t)).toBeNull();
  expect(verifyTpoCampaignRecipientToken(token+".more",secret,t)).toBeNull();
 });
});
