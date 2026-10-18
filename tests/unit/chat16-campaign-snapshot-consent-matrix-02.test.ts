import {describe,expect,it} from "vitest";
import {tpoCampaignUnsubscribeEvent} from "@/modules/messaging/tpo-campaign-unsubscribe-notification-model";
import {campaignRecipientStillMatchesSnapshot,type CampaignRecipientFact} from "@/modules/messaging/tpo-campaign-send-policy";
import {
 resolveTpoCampaignRecipientSecret,issueTpoCampaignEmailRecipientKey,
 matchesTpoCampaignEmailRecipientKey,
} from "@/modules/messaging/tpo-campaign-recipient-token";

const secret="c".repeat(64);
const eligible:CampaignRecipientFact={
 emailNorm:" Recruiter@Example.org ",unsubscribedAt:null,inviteBouncedAt:null,manualStage:"CONTACTED",
};

describe("chat-16 campaign recipient dispatch consent and token identity",()=>{
 it("HR-CAMPAIGN-SNAPSHOT-01 permits unchanged live recipient and normalized address case",()=>{
  expect(campaignRecipientStillMatchesSnapshot(eligible,{
   ...eligible,emailNorm:"recruiter@example.org",
  })).toBe(true);
 });
 it("HR-CAMPAIGN-SNAPSHOT-02 denies changes to the snapshotted email even when the lead is eligible",()=>{
  expect(campaignRecipientStillMatchesSnapshot(eligible,{
   ...eligible,emailNorm:"different@example.org",
  })).toBe(false);
  expect(campaignRecipientStillMatchesSnapshot(eligible,null)).toBe(false);
  expect(campaignRecipientStillMatchesSnapshot(eligible,undefined)).toBe(false);
 });
 it("HR-CAMPAIGN-SNAPSHOT-03 denies late consent withdrawal, bounce and do-not-contact transition",()=>{
  const unsubscribedAt=new Date("2099-01-01T00:00:00Z");
  for(const live of [
   {...eligible,unsubscribedAt},
   {...eligible,inviteBouncedAt:unsubscribedAt},
   {...eligible,manualStage:"NOT_NOW"},
   {...eligible,emailNorm:null},
  ]){
   expect(campaignRecipientStillMatchesSnapshot(eligible,live)).toBe(false);
  }
  expect(campaignRecipientStillMatchesSnapshot({
   ...eligible,unsubscribedAt,
  },eligible)).toBe(false);
 });
 it("HR-CAMPAIGN-HMAC-04 uses a stable secret-bound key, never raw contact data",()=>{
  const key=issueTpoCampaignEmailRecipientKey(" Recruiter@Example.ORG ",secret);
  expect(key).toMatch(/^[a-f0-9]{64}$/);
  expect(key).not.toContain("Recruiter");
  expect(matchesTpoCampaignEmailRecipientKey(key,"recruiter@example.org",secret)).toBe(true);
  expect(matchesTpoCampaignEmailRecipientKey(key,"another@example.org",secret)).toBe(false);
  expect(matchesTpoCampaignEmailRecipientKey(key,"recruiter@example.org","x".repeat(64))).toBe(false);
  expect(matchesTpoCampaignEmailRecipientKey("not-hex","recruiter@example.org",secret)).toBe(false);
  expect(matchesTpoCampaignEmailRecipientKey(key,null,secret)).toBe(false);
  expect(()=>issueTpoCampaignEmailRecipientKey("r@example.org","weak")).toThrow();
 });
 it("HR-CAMPAIGN-UNSUB-NAME-06 never ends a notification name in half an emoji",()=>{
  const title=tpoCampaignUnsubscribeEvent("a".repeat(119)+"😀"+"other","lead-id").notification.title;
  expect(title).toBe("a".repeat(119)+" unsubscribed");
  expect(title).not.toContain("\uFFFD");
 });
 it("HR-CAMPAIGN-SECRET-05 canonical signing config wins and a bad canonical secret fails closed",()=>{
  expect(resolveTpoCampaignRecipientSecret({
   TPO_CAMPAIGN_RECIPIENT_HMAC_SECRET:"old",
  })).toBe("old");
  expect(resolveTpoCampaignRecipientSecret({
   TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET:"new",
   TPO_CAMPAIGN_RECIPIENT_HMAC_SECRET:"old",
  })).toBe("new");
  expect(resolveTpoCampaignRecipientSecret({
   TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET:"",
   TPO_CAMPAIGN_RECIPIENT_HMAC_SECRET:"old",
  })).toBe("");
  expect(resolveTpoCampaignRecipientSecret({})).toBe("");
 });
});
