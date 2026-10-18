import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
 campaignRecipientStillMatchesSnapshot,
 type CampaignRecipientFact,
} from "@/modules/messaging/tpo-campaign-send-policy";

const ready:CampaignRecipientFact={
 emailNorm:"placement@example.org",
 unsubscribedAt:null,inviteBouncedAt:null,manualStage:"CONTACTED",
};

describe("chat-16 TPO campaign live recipient recheck",()=>{
 it("TPO-campaigns-public-12 rejects a newly unsubscribed or bounced recipient after the queue claim",()=>{
  const now=new Date("2026-10-18T00:00:00Z");
  expect(campaignRecipientStillMatchesSnapshot(ready,{...ready,unsubscribedAt:now})).toBe(false);
  expect(campaignRecipientStillMatchesSnapshot(ready,{...ready,inviteBouncedAt:now})).toBe(false);
  expect(campaignRecipientStillMatchesSnapshot(ready,{...ready,manualStage:"NOT_NOW"})).toBe(false);
 });
 it("TPO-campaigns-public-12 never sends to the old address after a live contact change",()=>{
  expect(campaignRecipientStillMatchesSnapshot(ready,{...ready,emailNorm:"different@example.org"})).toBe(false);
  expect(campaignRecipientStillMatchesSnapshot(ready,{...ready,emailNorm:null})).toBe(false);
  expect(campaignRecipientStillMatchesSnapshot(ready,null)).toBe(false);
  expect(campaignRecipientStillMatchesSnapshot(ready,undefined)).toBe(false);
 });
 it("TPO-campaigns-public-12 permits only the same normalised address when still eligible",()=>{
  expect(campaignRecipientStillMatchesSnapshot(ready,{...ready,emailNorm:" PLACEMENT@Example.ORG "})).toBe(true);
  expect(campaignRecipientStillMatchesSnapshot({...ready,emailNorm:null},ready)).toBe(false);
 });
 it("TPO-campaigns-public-12 never records provider acceptance if persisted CAS outcome is lost",()=>{
  const source=readFileSync("src/modules/messaging/tpo-campaign-dispatch-service.ts","utf8");
  const send=source.indexOf("const result=await outbound.send(");
  const persisted=source.indexOf("const [persistedOutcome]=await db.update(",send);
  const refusal=source.indexOf('if(!persistedOutcome)throw new Error("CAMPAIGN_RECIPIENT_OUTCOME_UNCONFIRMED");',persisted);
  const activity=source.indexOf("if(result){",refusal);
  expect(send).toBeGreaterThan(-1);
  expect(persisted).toBeGreaterThan(send);
  expect(refusal).toBeGreaterThan(persisted);
  expect(activity).toBeGreaterThan(refusal);
  const cas=source.slice(persisted,refusal);
  expect(cas).toContain("eq(placementTpoEmailCampaignRecipients.campaignId,id)");
  expect(cas).toContain('eq(placementTpoEmailCampaignRecipients.status,"QUEUED")');
  expect(cas).toContain("eq(placementTpoEmailCampaignRecipients.collegeId,college.id)");
  expect(cas).toContain(".returning({id:placementTpoEmailCampaignRecipients.id})");
 });
 it("TPO-campaigns-public-12 dispatch reads live college-scoped recipient after claim, before provider call",()=>{
  const source=readFileSync("src/modules/messaging/tpo-campaign-dispatch-service.ts","utf8");
  const claim=source.indexOf("if(!claimedRecipient)continue;");
  const live=source.indexOf("const [live]=await db.select(");
  const gate=source.indexOf("campaignRecipientStillMatchesSnapshot(");
  const send=source.indexOf("const result=await outbound.send(");
  expect(claim).toBeGreaterThan(-1);
  expect(live).toBeGreaterThan(claim);
  expect(gate).toBeGreaterThan(live);
  expect(send).toBeGreaterThan(gate);
  const section=source.slice(live,send);
  expect(section).toContain("eq(placementTpoLeads.collegeId,college.id)");
  expect(section).toContain('eq(placementTpoEmailCampaignRecipients.status,"QUEUED")');
  expect(section).toContain("totals.skipped++");
  expect(section).toContain("continue;");
 });
});
