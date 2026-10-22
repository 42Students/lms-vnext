import {describe,expect,it} from "vitest";
import {assertCampaignRecipientCap,campaignRecipientDisposition,planTpoCampaignRecipients} from "@/modules/messaging/tpo-campaign-send-policy";
describe("T-S2-04 campaign send policy",()=>{
 const recipient={emailNorm:"person@example.org",unsubscribedAt:null,inviteBouncedAt:null,manualStage:"NEW"};
 it("uses a strict 500-recipient cap",()=>{
  expect(assertCampaignRecipientCap(500)).toBe(500);
  expect(()=>assertCampaignRecipientCap(501)).toThrow();
  expect(()=>assertCampaignRecipientCap(-1)).toThrow();
 });
 it("produces a bounded, PII-free preview with stable contact deduplication",()=>{
  const candidates=[
   {id:"a",...recipient},
   {id:"b",...recipient,emailNorm:"PERSON@example.org"},
   {id:"c",...recipient,unsubscribedAt:new Date()},
   {id:"d",...recipient,emailNorm:null},
  ];
  expect(planTpoCampaignRecipients(candidates)).toMatchObject({
   recipientIds:["a"],suppressed:{NO_EMAIL:1,UNSUBSCRIBED:1,BOUNCED:0,NOT_NOW:0,DUPLICATE:1},
  });
  expect(planTpoCampaignRecipients(candidates).eligibleCount).toBe(1);
  expect(JSON.stringify(planTpoCampaignRecipients(candidates))).not.toContain("example.org");
  expect(planTpoCampaignRecipients(Array.from({length:501},(_,i)=>({
    ...recipient,id:String(i),unsubscribedAt:i<500?new Date():null,
   }))).recipientIds).toEqual(["500"]);
   expect(()=>planTpoCampaignRecipients(Array.from({length:501},(_,i)=>({
    ...recipient,id:String(i),emailNorm:`user${i}@example.org`,
   })))).toThrow("TPO_CAMPAIGN_RECIPIENT_LIMIT");
 });
 it("suppresses missing contact, unsubscribes, bounces and Not now",()=>{
  expect(campaignRecipientDisposition(recipient)).toBe("ELIGIBLE");
  expect(campaignRecipientDisposition({...recipient,emailNorm:null})).toBe("NO_EMAIL");
  expect(campaignRecipientDisposition({...recipient,unsubscribedAt:new Date()})).toBe("UNSUBSCRIBED");
  expect(campaignRecipientDisposition({...recipient,inviteBouncedAt:new Date()})).toBe("BOUNCED");
  expect(campaignRecipientDisposition({...recipient,manualStage:"NOT_NOW"})).toBe("NOT_NOW");
 });
});
