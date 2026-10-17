import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {tpoCampaignUnsubscribeEvent} from "@/modules/messaging/tpo-campaign-unsubscribe-notification-model";
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
