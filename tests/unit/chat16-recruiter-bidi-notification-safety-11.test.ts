import {describe,expect,it} from "vitest";
import {
 recruiterMessageTpoPreview,recruiterMessageTpoRecipients,recruiterMessageTpoHref,
} from "@/modules/placements/recruiter-message-tpo-notification-model";
import {tpoCampaignUnsubscribeEvent} from "@/modules/messaging/tpo-campaign-unsubscribe-notification-model";
import {safeInboundPreview} from "@/modules/inbound-mail/message-model";

describe("chat-16 recruiter and campaign notification Unicode direction safety",()=>{
 it("REC-MESSAGE-BIDI-11 preserves visible multilingual text without direction-spoof controls",()=>{
  expect(recruiterMessageTpoPreview("Sent\n\u202Eevil\u202C  update"))
   .toBe("Sent evil update");
  expect(recruiterMessageTpoPreview("Family 👨‍👩‍👧‍👦 says hello")).toContain("👨‍👩‍👧‍👦");
  expect(recruiterMessageTpoPreview("🙂".repeat(150))).toBe("🙂".repeat(120)+"…");
  expect(recruiterMessageTpoRecipients([{userId:"one"},{userId:"one"},{userId:"two"}],"two"))
   .toEqual(["one"]);
  expect(recruiterMessageTpoHref("broken/thread")).toBe("/tpo/messages");
 });
 it("TPO-UNSUB-BIDI-12 prevents forged display names but retains normal legacy wording",()=>{
  const event=tpoCampaignUnsubscribeEvent("Alice\u202Eevil\u202C Example","lead-1");
  expect(event.notification.title).toBe("Alice evil Example unsubscribed");
  expect(event.summary).toBe("Alice evil Example unsubscribed from emails");
  expect(event.notification.actionHref).toBe("/tpo/recruiters/lead-1");
  expect(tpoCampaignUnsubscribeEvent("इंजीनियर 👨‍💻","lead-2").notification.title)
   .toContain("👨‍💻");
 });
 it("INBOUND-MAIL-BIDI-13 collapses misleading mail subject controls before displaying preview",()=>{
  expect(safeInboundPreview("From: Admin\u2066FAKE\u2069\nNext")).toBe("From: Admin FAKE Next");
  expect(safeInboundPreview("Course 👩‍🎓 updates")).toBe("Course 👩‍🎓 updates");
 });
});