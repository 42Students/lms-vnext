import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {tpoCampaignUnsubscribeEvent} from "@/modules/messaging/tpo-campaign-unsubscribe-notification-model";
import {resolveTpoCampaignRecipientSecret,issueTpoCampaignRecipientToken,verifyTpoCampaignRecipientToken} from "@/modules/messaging/tpo-campaign-recipient-token";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-9 final sprint",()=>{
 it("TPO-campaigns-public-14 preserves verified functionality and safe failure states",()=>{
 const event=tpoCampaignUnsubscribeEvent(" Example Recruiter ","lead-123");
 expect(event.summary).toBe("Example Recruiter unsubscribed from emails");
 expect(event.timeline).toBe("Unsubscribed from emails");
 expect(event.notification.actionHref).toContain("/tpo/recruiters/lead-123");
 const service=read("src/modules/messaging/tpo-campaign-unsubscribe-service.ts");
 const route=read("src/app/api/public/campaign-unsubscribe/route.ts");
 expect(route).toContain("verifyTpoCampaignRecipientToken");
 expect(route).toContain("unsubscribeTpoCampaignRecipient(rawToken)");
 expect(service).toContain('.for("update")');
 expect(service).toContain("inviteTokenHash:null");
 expect(service).toContain("tx.insert(placementTpoLeadActivities)");
 expect(service).toContain("tx.insert(inAppNotifications)");
 expect(service).toContain("campaignUnsubscribeDecision(claim,row)");
 });
});

describe("TPO-campaigns-public-14 signing key convergence",()=>{
 it("TPO-campaigns-public-14 issues and verifies through the same canonical recipient secret",()=>{
  const secret="this-purpose-specific-secret-is-long-enough-to-sign-links";
  const config={TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET:secret,TPO_CAMPAIGN_RECIPIENT_HMAC_SECRET:"different-backward-compat-key-which-must-not-win"};
  const chosen=resolveTpoCampaignRecipientSecret(config);
  expect(chosen).toBe(secret);
  expect(resolveTpoCampaignRecipientSecret({TPO_CAMPAIGN_RECIPIENT_HMAC_SECRET:secret})).toBe(secret);
  expect(resolveTpoCampaignRecipientSecret({})).toBe("");
  const claim={v:1 as const,collegeId:"83fc470d-e95b-4c64-af02-543f3c4e79be",campaignId:"b87551a0-adc4-483d-9079-2db30de588f4",recipientId:"f34184ae-ed81-4df8-a0bb-df1341274383",expiresAt:Date.parse("2099-01-01T00:00:00Z")};
  const token=issueTpoCampaignRecipientToken(claim,chosen);
  expect(verifyTpoCampaignRecipientToken(token,resolveTpoCampaignRecipientSecret(config),Date.parse("2098-01-01T00:00:00Z"))).toEqual(claim);
  expect(verifyTpoCampaignRecipientToken(token,"mismatched-purpose-secret-of-safe-length",Date.parse("2098-01-01T00:00:00Z"))).toBeNull();
  for(const file of ["src/modules/messaging/tpo-campaign-dispatch-service.ts","src/modules/messaging/tpo-campaign-unsubscribe-service.ts","src/app/api/public/campaign-unsubscribe/route.ts"])
   expect(read(file)).toContain("resolveTpoCampaignRecipientSecret(process.env)");
 });
});
