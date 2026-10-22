import {describe,expect,it} from "vitest";
import {campaignRecipientDisposition,assertCampaignRecipientCap,planTpoCampaignRecipients}
 from "@/modules/messaging/tpo-campaign-send-policy";
import {issueTpoCampaignRecipientToken,verifyTpoCampaignRecipientToken,
 matchesCampaignRecipient,campaignUnsubscribeDecision} from "@/modules/messaging/tpo-campaign-recipient-token";
import {previewTpoCampaignText,tpoCampaignDraftSchema} from "@/modules/messaging/tpo-campaign-draft-model";

const claim={v:1 as const,collegeId:"11111111-1111-4111-8111-111111111111",
 campaignId:"22222222-2222-4222-8222-222222222222",
 recipientId:"33333333-3333-4333-8333-333333333333",expiresAt:4102444800000};
const secret="S".repeat(64);
const eligible={id:"lead-1",emailNorm:" A@example.com ",unsubscribedAt:null,inviteBouncedAt:null,manualStage:"NEW"};

describe("chat-16 campaign suppression, cross-college and tamper hardening",()=>{
 it("campaign-suppression-01 excludes unsubscribed, bounced, missing and not-now recipients",()=>{
  expect(campaignRecipientDisposition({...eligible,unsubscribedAt:new Date("2099-01-01")})).toBe("UNSUBSCRIBED");
  expect(campaignRecipientDisposition({...eligible,emailNorm:"  "})).toBe("NO_EMAIL");
  expect(campaignRecipientDisposition({...eligible,inviteBouncedAt:new Date("2099-01-01")})).toBe("BOUNCED");
  expect(campaignRecipientDisposition({...eligible,manualStage:"NOT_NOW"})).toBe("NOT_NOW");
 });
 it("campaign-dedupe-01 enforces email canonical dedupe without disclosing addresses",()=>{
  const result=planTpoCampaignRecipients([
   eligible,{...eligible,id:"lead-2",emailNorm:"a@EXAMPLE.com"},
   {...eligible,id:"lead-3",emailNorm:"second@example.org"},
   {...eligible,id:"lead-4",unsubscribedAt:new Date("2099-01-01")},
  ]);
  expect(result.recipientIds).toEqual(["lead-1","lead-3"]);
  expect(result.suppressed.DUPLICATE).toBe(1);
  expect(result.suppressed.UNSUBSCRIBED).toBe(1);
  expect(JSON.stringify(result)).not.toContain("example.com");
 });
 it("campaign-cap-01 counts unique eligible recipients, never all suppressed roster entries",()=>{
  expect(assertCampaignRecipientCap(500)).toBe(500);
  expect(()=>assertCampaignRecipientCap(501)).toThrow();
  expect(()=>assertCampaignRecipientCap(-1)).toThrow();
  expect(()=>assertCampaignRecipientCap(1.2)).toThrow();
  // Legacy selection limit counts chosen contacts, including suppressed ones.
  const many=Array.from({length:550},(_,i)=>({...eligible,id:"s"+i,unsubscribedAt:new Date("2099-01-01")}));
  expect(()=>planTpoCampaignRecipients([...many,eligible])).toThrow("TPO_CAMPAIGN_RECIPIENT_LIMIT");
  const bounded=many.slice(0,499);
  const planned=planTpoCampaignRecipients([...bounded,eligible]);
  expect(planned.recipientIds).toEqual(["lead-1"]);
  expect(planned.selectedCount).toBe(500);
  expect(planned.suppressed.UNSUBSCRIBED).toBe(499);
  expect(()=>planTpoCampaignRecipients(Array.from({length:501},(_,i)=>({...eligible,id:"id-"+i,emailNorm:"lead"+i+"@example.org"})))).toThrow();
 });
 it("campaign-signed-token-01 rejects tampering, weaker HMAC secrets and wrong purpose",()=>{
  const token=issueTpoCampaignRecipientToken(claim,secret);
  expect(verifyTpoCampaignRecipientToken(token,secret,Date.parse("2099-01-01"))).toEqual(claim);
  expect(verifyTpoCampaignRecipientToken(token,"wrong".repeat(9),Date.parse("2099-01-01"))).toBeNull();
  const [body,mac]=token.split(".");
  expect(verifyTpoCampaignRecipientToken(body+"A."+mac,secret,Date.parse("2099-01-01"))).toBeNull();
  expect(verifyTpoCampaignRecipientToken(token+".extra",secret,Date.parse("2099-01-01"))).toBeNull();
  expect(()=>issueTpoCampaignRecipientToken(claim,"weak")).toThrow();
 });
 it("campaign-tenant-01 binds signed recipient to the persisted college, campaign and lead",()=>{
  const row={id:claim.recipientId,collegeId:claim.collegeId,campaignId:claim.campaignId,unsubscribedAt:null};
  expect(matchesCampaignRecipient(claim,row)).toBe(true);
  expect(campaignUnsubscribeDecision(claim,row)).toBe("APPLY");
  expect(campaignUnsubscribeDecision(claim,{...row,collegeId:"44444444-4444-4444-8444-444444444444"})).toBe("DENY");
  expect(campaignUnsubscribeDecision(claim,{...row,campaignId:"44444444-4444-4444-8444-444444444444"})).toBe("DENY");
  expect(campaignUnsubscribeDecision(claim,{...row,unsubscribedAt:new Date("2099-01-01")})).toBe("ALREADY");
 });
 it("campaign-draft-01 rejects rogue keys, duplicate lead ids and overly long body",()=>{
  const base={title:"Recruitment",subject:"Hello team",body:"Dear {name} from {company}",
   segment:"ALL_ELIGIBLE",templateKey:"campaign_recruiter"};
  expect(previewTpoCampaignText("Dear {name} at {company}",{name:"A",company:"B"})).toBe("Dear A at B");
  expect(()=>previewTpoCampaignText("x".repeat(10001),{name:"A",company:"B"})).toThrow();
  expect(tpoCampaignDraftSchema.safeParse({...base,unknown:true}).success).toBe(false);
  const id="11111111-1111-4111-8111-111111111111";
  expect(tpoCampaignDraftSchema.safeParse({...base,selectedLeadIds:[id,id]}).success).toBe(false);
 });
});
