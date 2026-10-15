import {describe,expect,it} from "vitest";
import {assertCampaignRecipientCap,campaignRecipientDisposition} from "@/modules/messaging/tpo-campaign-send-policy";
describe("T-S2-04 campaign send policy",()=>{
 const recipient={emailNorm:"person@example.org",unsubscribedAt:null,inviteBouncedAt:null,manualStage:"NEW"};
 it("uses a strict 500-recipient cap",()=>{
  expect(assertCampaignRecipientCap(500)).toBe(500);
  expect(()=>assertCampaignRecipientCap(501)).toThrow();
  expect(()=>assertCampaignRecipientCap(-1)).toThrow();
 });
 it("suppresses missing contact, unsubscribes, bounces and Not now",()=>{
  expect(campaignRecipientDisposition(recipient)).toBe("ELIGIBLE");
  expect(campaignRecipientDisposition({...recipient,emailNorm:null})).toBe("NO_EMAIL");
  expect(campaignRecipientDisposition({...recipient,unsubscribedAt:new Date()})).toBe("UNSUBSCRIBED");
  expect(campaignRecipientDisposition({...recipient,inviteBouncedAt:new Date()})).toBe("BOUNCED");
  expect(campaignRecipientDisposition({...recipient,manualStage:"NOT_NOW"})).toBe("NOT_NOW");
 });
});
