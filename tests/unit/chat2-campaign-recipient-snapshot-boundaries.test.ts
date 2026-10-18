import {describe,expect,it} from "vitest";
import {campaignRecipientDisposition,planTpoCampaignRecipients,campaignRecipientStillMatchesSnapshot,assertCampaignRecipientCap,TPO_CAMPAIGN_MAX_RECIPIENTS} from "@/modules/messaging/tpo-campaign-send-policy";

const baseline={unsubscribedAt:null,inviteBouncedAt:null,manualStage:"NEW"};
describe("TPO-campaigns-public-12 recruiter recipient identity and consent boundaries",()=>{
 it("deduplicates both the physical recruiter ID and normalized email",()=>{
  const actual=planTpoCampaignRecipients([
   {id:"a",emailNorm:" A@example.com ",...baseline},
   {id:"a",emailNorm:"a-second@example.com",...baseline},
   {id:"b",emailNorm:"a@example.COM",...baseline},
   {id:"c",emailNorm:"c@example.com",...baseline},
  ]);
  expect(actual).toEqual({recipientIds:["a","c"],suppressed:{
   NO_EMAIL:0,UNSUBSCRIBED:0,BOUNCED:0,NOT_NOW:0,DUPLICATE:2,
  }});
  expect(JSON.stringify(actual)).not.toContain("@");
 });
 it("never converts historical unsubscribed, bounced, or not-now snapshots into consent",()=>{
  const saved={emailNorm:"a@example.com",...baseline};
  expect(campaignRecipientStillMatchesSnapshot(saved,{...saved})).toBe(true);
  for(const old of [
   {...saved,unsubscribedAt:new Date("2099-01-01T00:00:00Z")},
   {...saved,inviteBouncedAt:new Date("2099-01-01T00:00:00Z")},
   {...saved,manualStage:"NOT_NOW"},
   {...saved,emailNorm:""},
  ])expect(campaignRecipientStillMatchesSnapshot(old,saved)).toBe(false);
  for(const live of [
   {...saved,unsubscribedAt:new Date("2099-01-01T00:00:00Z")},
   {...saved,inviteBouncedAt:new Date("2099-01-01T00:00:00Z")},
   {...saved,manualStage:"NOT_NOW"},
   {...saved,emailNorm:"redirect@example.com"},
  ])expect(campaignRecipientStillMatchesSnapshot(saved,live)).toBe(false);
  expect(campaignRecipientStillMatchesSnapshot(saved,null)).toBe(false);
 });
 it("counts suppressed leads without giving them recipient slots",()=>{
  const suppressed=Array.from({length:650},(_,i)=>({
   id:"skip-"+i,emailNorm:"skip"+i+"@example.com",unsubscribedAt:new Date("2099-01-01T00:00:00Z"),
   inviteBouncedAt:null,manualStage:"NEW",
  }));
  const send=planTpoCampaignRecipients([...suppressed,{id:"send",emailNorm:"send@example.com",...baseline}]);
  expect(send.recipientIds).toEqual(["send"]);
  expect(send.suppressed.UNSUBSCRIBED).toBe(650);
  expect(campaignRecipientDisposition({...baseline,emailNorm:"not-an-email"})).toBe("NO_EMAIL");
 });
 it("caps unique deliverable recipients but allows exactly 500",()=>{
  expect(TPO_CAMPAIGN_MAX_RECIPIENTS).toBe(500);
  const unique=Array.from({length:500},(_,i)=>({id:String(i),emailNorm:"user"+i+"@example.com",...baseline}));
  expect(planTpoCampaignRecipients(unique).recipientIds).toHaveLength(500);
  expect(()=>planTpoCampaignRecipients([...unique,{id:"501",emailNorm:"next@example.com",...baseline}])).toThrow("TPO_CAMPAIGN_RECIPIENT_LIMIT");
  for(const invalid of [-1,501,0.25,Number.POSITIVE_INFINITY])expect(()=>assertCampaignRecipientCap(invalid)).toThrow();
 });
});
