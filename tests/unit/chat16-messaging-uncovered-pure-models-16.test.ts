import {describe,expect,it} from "vitest";
import {isCampaignTemplateKey} from "@/modules/messaging/template-boundary-model";
import {campaignSourceSchema} from "@/modules/messaging/campaign-source-model";
import {campaignFilterHref,campaignFilterSchema} from "@/modules/messaging/campaign-filter-model";
import {engageAudienceQuerySchema,summarizeEngageAudience,type EngageContact} from "@/modules/messaging/engage-audience-model";
import {tpoCampaignHistoryStatus,tpoCampaignHistoryTime} from "@/modules/messaging/tpo-campaign-history-copy";
import {tpoCampaignUnsubscribeEvent} from "@/modules/messaging/tpo-campaign-unsubscribe-notification-model";
import {issueUnsubscribeToken,verifyUnsubscribeToken,unsubscribeConfirmation} from "@/modules/messaging/unsubscribe-model";

const eligible:EngageContact={
 id:"lead-1",emailNorm:"contact@example.org",manualStage:"NEW",ownerMembershipId:null,
 unsubscribedAt:null,inviteBouncedAt:null,
};
const suppressionDate=new Date("2099-01-01T00:00:00.000Z");

describe("chat-16 messaging campaign, audience and notification boundary behaviour",()=>{
 it("messaging-template-boundary-16 forbids auth, OTP and password templates in campaign delivery",()=>{
  for(const key of ["otp","campaign.otp","auth-email","login.reset","verification/mfa","campaign:magic-link","password-recovery"]){
   expect(isCampaignTemplateKey(key),key).toBe(false);
  }
  for(const key of ["campaign.recruitment","tpo_notice_v2","placement/reminder"]){
   expect(isCampaignTemplateKey(key),key).toBe(true);
  }
  for(const key of ["","with whitespace","a".repeat(161),"../unsafe","/absolute","campaign?key"]){
   expect(isCampaignTemplateKey(key),key).toBe(false);
  }
 });
 it("messaging-campaign-source-16 requires a bounded other-source explanation and rejects mass assignment",()=>{
  expect(campaignSourceSchema.safeParse({source:"REFERRAL"}).success).toBe(true);
  expect(campaignSourceSchema.safeParse({source:"OTHER"}).success).toBe(false);
  expect(campaignSourceSchema.safeParse({source:"OTHER",sourceDetail:" Partner event "}).data)
   .toEqual({source:"OTHER",sourceDetail:"Partner event"});
  expect(campaignSourceSchema.safeParse({source:"OTHER",sourceDetail:"  "}).success).toBe(false);
  expect(campaignSourceSchema.safeParse({source:"OTHER",sourceDetail:"x".repeat(201)}).success).toBe(false);
  expect(campaignSourceSchema.safeParse({source:"REFERRAL",collegeId:"foreign"}).success).toBe(false);
 });
 it("messaging-campaign-filter-16 bounds URL query pagination without letting user input become a route",()=>{
  expect(campaignFilterSchema.parse({})).toEqual({state:"ALL",search:"",page:1});
  expect(campaignFilterSchema.safeParse({page:0}).success).toBe(false);
  expect(campaignFilterSchema.safeParse({page:10001}).success).toBe(false);
  expect(campaignFilterSchema.safeParse({state:"DELETED"}).success).toBe(false);
  expect(campaignFilterSchema.safeParse({search:"x".repeat(101)}).success).toBe(false);
  expect(campaignFilterSchema.safeParse({organizationId:"foreign"}).success).toBe(false);
  const href=campaignFilterHref({state:"UNASSIGNED",page:4,search:"  A&B?  "});
  const url=new URL(href,"https://local.example.org");
  expect(url.pathname).toBe("/tpo/recruiters");
  expect(url.searchParams.get("state")).toBe("UNASSIGNED");
  expect(url.searchParams.get("page")).toBe("4");
  expect(url.searchParams.get("q")).toBe("A&B?");
 });
 it("messaging-engage-preview-16 matches suppression precedence without revealing contact emails",()=>{
  const contacts:EngageContact[]=[
   eligible,
   {...eligible,id:"bad",emailNorm:"  "},
   {...eligible,id:"optout",unsubscribedAt:suppressionDate,emailNorm:null},
   {...eligible,id:"bounce",inviteBouncedAt:suppressionDate},
   {...eligible,id:"not-now",manualStage:"NOT_NOW"},
   {...eligible,id:"assigned",ownerMembershipId:"membership-1",manualStage:"CONTACTED"},
  ];
  expect(engageAudienceQuerySchema.safeParse({segment:"UNKNOWN"}).success).toBe(false);
  expect(engageAudienceQuerySchema.safeParse({segment:"NEW",collegeId:"foreign"}).success).toBe(false);
  const all=summarizeEngageAudience(contacts,"ALL_ELIGIBLE");
  expect(all).toEqual({total:6,eligible:2,withoutEmail:1,unsubscribed:1,bounced:1,notNow:1,outsideSegment:0});
  const unassigned=summarizeEngageAudience(contacts,"UNASSIGNED");
  expect(unassigned.eligible).toBe(1);
  expect(unassigned.outsideSegment).toBe(1);
  const newer=summarizeEngageAudience(contacts,"NEW");
  expect(newer.outsideSegment).toBe(2);
  expect(JSON.stringify(all)).not.toContain("contact@example.org");
 });
 it("messaging-history-copy-16 displays IST time and graceful unknown provider states",()=>{
  expect(tpoCampaignHistoryTime(new Date("2099-01-01T00:00:00.000Z"))).toBe("05:30 1 Jan 2099");
  expect(tpoCampaignHistoryStatus("DRAFT")).toBe("Draft");
  expect(tpoCampaignHistoryStatus("SENDING")).toBe("Sending");
  expect(tpoCampaignHistoryStatus("unexpected_status")).toBe("Recorded");
 });
 it("messaging-unsubscribe-token-16 verifies canonical signed payload, expiry and explicit POST intent",()=>{
  const secret="s".repeat(64);
  const claim={version:1 as const,recipientKey:"a".repeat(64),expiresAt:4102444800000};
  const token=issueUnsubscribeToken(claim,secret);
  expect(verifyUnsubscribeToken(token,secret,Date.parse("2099-01-01T00:00:00Z"))).toEqual(claim);
  expect(verifyUnsubscribeToken(token,secret,claim.expiresAt)).toBeNull();
  expect(verifyUnsubscribeToken(token+"!",secret,Date.parse("2099-01-01"))).toBeNull();
  expect(verifyUnsubscribeToken(token,"b".repeat(64),Date.parse("2099-01-01"))).toBeNull();
  expect(verifyUnsubscribeToken(token+".extra",secret,Date.parse("2099-01-01"))).toBeNull();
  expect(()=>issueUnsubscribeToken(claim,"short")).toThrow();
  expect(unsubscribeConfirmation(token,secret,Date.parse("2099-01-01")))
   .toEqual({canConfirm:true,willUnsubscribeOnView:false});
 });
 it("messaging-unsubscribe-event-16 preserves legacy notification wording and an internal target",()=>{
  expect(tpoCampaignUnsubscribeEvent("   ","123")).toMatchObject({
   eventType:"PLACEMENTS_RECRUITER_UNSUBSCRIBED",
   summary:"Recruiter unsubscribed from emails",
   notification:{title:"Recruiter unsubscribed",actionHref:"/tpo/recruiters/123"},
   timeline:"Unsubscribed from emails",
  });
  expect(tpoCampaignUnsubscribeEvent("A & B","a/b").notification.actionHref)
   .toBe("/tpo/recruiters/a%2Fb");
  expect(tpoCampaignUnsubscribeEvent("A\nB\tC","123").notification.title)
   .toBe("A B C unsubscribed");
  expect(tpoCampaignUnsubscribeEvent("x".repeat(300),"123").notification.title)
   .toBe("x".repeat(120)+" unsubscribed");
 });
});
