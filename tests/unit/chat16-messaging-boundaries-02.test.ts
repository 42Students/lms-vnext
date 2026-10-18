import {describe,expect,it} from "vitest";
import {resolveTpoCampaignRecipientSecret} from "@/modules/messaging/tpo-campaign-recipient-token";
import {tpoCampaignUnsubscribeEvent} from "@/modules/messaging/tpo-campaign-unsubscribe-notification-model";
import {hrNotificationReadSchema,hrNotificationVersionMatches}
 from "@/modules/placements/hr-notification-read-model";
import {conversationSnippet} from "@/modules/placements/hr-conversation-snippet-model";
import {inboundMailMetadataSchema} from "@/modules/inbound-mail/message-model";
import {readZeptoMailConfig} from "@/modules/notifications/zeptomail-email";

describe("chat-16 campaign, messaging and inbound boundary cases",()=>{
 it("T-S2-04 recipient token uses canonical configuration without falling back across mismatched secrets",()=>{
  expect(resolveTpoCampaignRecipientSecret({TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET:"canonical",
   TPO_CAMPAIGN_RECIPIENT_HMAC_SECRET:"legacy"})).toBe("canonical");
  expect(resolveTpoCampaignRecipientSecret({TPO_CAMPAIGN_RECIPIENT_HMAC_SECRET:"legacy"})).toBe("legacy");
  expect(resolveTpoCampaignRecipientSecret({TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET:"",
   TPO_CAMPAIGN_RECIPIENT_HMAC_SECRET:"legacy"})).toBe("");
  expect(resolveTpoCampaignRecipientSecret({})).toBe("");
 });
 it("T-S2-04 unsubscribe creates scoped user-facing event without external links",()=>{
  const event=tpoCampaignUnsubscribeEvent("   ","../../admin?x=1");
  expect(event.eventType).toBe("PLACEMENTS_RECRUITER_UNSUBSCRIBED");
  expect(event.summary).toBe("Recruiter unsubscribed from emails");
  expect(event.notification.title).toBe("Recruiter unsubscribed");
  expect(event.notification.actionHref).toContain("%2F");
  expect(event.notification.actionHref).toMatch(/^\/tpo\/recruiters\//);
  expect(event.timeline).toBe("Unsubscribed from emails");
 });
 it("REC-calendar-messages-profile-21 denies stale notification mark tokens",()=>{
  const created=new Date("2026-10-18T01:02:03.444Z");
  expect(hrNotificationVersionMatches(created,created.toISOString())).toBe(true);
  expect(hrNotificationVersionMatches(created,"2026-10-18T01:02:03.443Z")).toBe(false);
  expect(hrNotificationVersionMatches(created,"not-a-date")).toBe(false);
  expect(hrNotificationReadSchema.safeParse({expectedCreatedAt:created.toISOString()}).success).toBe(true);
  expect(hrNotificationReadSchema.safeParse({expectedCreatedAt:"invalid"}).success).toBe(false);
  expect(hrNotificationReadSchema.safeParse({expectedCreatedAt:created.toISOString(),readOther:true}).success).toBe(false);
 });
 it("REC-calendar-messages-profile-08 malformed preview limits cannot expose the full body",()=>{
  const text="a".repeat(4000);
  expect(conversationSnippet(text,-900)).toBe("");
  expect(conversationSnippet(text,2)).toHaveLength(2);
  expect(conversationSnippet(text,Number.POSITIVE_INFINITY)).toHaveLength(120);
 });
 it("inbound-mail-metadata-02 parses required envelope and rejects oversized subjects",()=>{
  const envelope={id:"11111111-1111-4111-8111-111111111111",
   receivedAt:"2026-10-18T01:02:03.000Z",fromAddress:"sender@example.org",
   subject:"Hello",status:"NEW"};
  expect(inboundMailMetadataSchema.safeParse(envelope).success).toBe(true);
  expect(inboundMailMetadataSchema.safeParse({...envelope,subject:"x".repeat(513)}).success).toBe(false);
  expect(inboundMailMetadataSchema.safeParse({...envelope,hidden:"secret"}).success).toBe(false);
 });
 it("email-provider-configuration-01 missing secrets never fabricate provider acceptance",()=>{
  const config=readZeptoMailConfig({ZEPTOMAIL_API_URL:"https://api.zeptomail.in/v1.1/email/template",
   ZEPTOMAIL_TOKEN:'"  "'});
  expect(config.token).toBe("  ");
  expect(config.apiUrl).toMatch(/^https:\/\//);
  expect(config.fromAddress).toBe("hello@42lms.com");
 });
});
