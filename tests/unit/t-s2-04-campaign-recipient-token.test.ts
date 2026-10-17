import {describe,expect,it} from "vitest";
import {issueTpoCampaignRecipientToken,verifyTpoCampaignRecipientToken,matchesCampaignRecipient,campaignUnsubscribeDecision} from "@/modules/messaging/tpo-campaign-recipient-token";
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
 it("does not unsubscribe another college/campaign/recipient",()=>{
  const same={id:claim.recipientId,collegeId:claim.collegeId,campaignId:claim.campaignId,unsubscribedAt:null};
  expect(campaignUnsubscribeDecision(claim,same)).toBe("APPLY");
  expect(campaignUnsubscribeDecision(claim,{...same,unsubscribedAt:new Date(t)})).toBe("ALREADY");
  expect(campaignUnsubscribeDecision(claim,{...same,collegeId:"other"})).toBe("DENY");
  expect(campaignUnsubscribeDecision(claim,{...same,campaignId:"other"})).toBe("DENY");
  expect(campaignUnsubscribeDecision(claim,{...same,id:"other"})).toBe("DENY");
 });
 it("rejects tampering and wrong key while preserving signed unsubscribe access after expiry",()=>{
  const token=issueTpoCampaignRecipientToken(claim,secret);
  // One-click campaign opt-out must remain usable after the campaign ends;
  // the separate HMAC and persisted recipient/college gate still apply.
  expect(verifyTpoCampaignRecipientToken(token,secret,claim.expiresAt)).toEqual(claim);
  expect(verifyTpoCampaignRecipientToken(token,secret+"changed",t)).toBeNull();
  expect(verifyTpoCampaignRecipientToken(token+"x",secret,t)).toBeNull();
  expect(verifyTpoCampaignRecipientToken(token+".more",secret,t)).toBeNull();
 });
});
