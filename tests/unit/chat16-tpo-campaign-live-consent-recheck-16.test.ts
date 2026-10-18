import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {issueTpoCampaignEmailRecipientKey,matchesTpoCampaignEmailRecipientKey} from "@/modules/messaging/tpo-campaign-recipient-token";
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
 it("TPO-campaigns-public-12 binds every queued send to its original opaque recipient email HMAC",()=>{
  const secret="s".repeat(64);
  const key=issueTpoCampaignEmailRecipientKey("  Placement@Example.ORG  ",secret);
  expect(key).toMatch(/^[0-9a-f]{64}$/);
  expect(matchesTpoCampaignEmailRecipientKey(key,"placement@example.org",secret)).toBe(true);
  expect(matchesTpoCampaignEmailRecipientKey(key,"new-contact@example.org",secret)).toBe(false);
  expect(matchesTpoCampaignEmailRecipientKey(key,"placement@example.org","x".repeat(64))).toBe(false);
  expect(matchesTpoCampaignEmailRecipientKey("not-a-key","placement@example.org",secret)).toBe(false);
  expect(matchesTpoCampaignEmailRecipientKey(key,null,secret)).toBe(false);
  expect(()=>issueTpoCampaignEmailRecipientKey("placement@example.org","short")).toThrow();
 });
 it("TPO-campaigns-public-12 validates stored draft HMAC before claiming a recipient for provider delivery",()=>{
  const source=readFileSync("src/modules/messaging/tpo-campaign-dispatch-service.ts","utf8");
  const draftKey=source.indexOf("matchesTpoCampaignEmailRecipientKey(row.recipientKey,row.email,config.key)");
  const claim=source.indexOf("const [claimedRecipient]=await db.update(");
  const send=source.indexOf("const result=await outbound.send(");
  expect(draftKey).toBeGreaterThan(-1);
  expect(claim).toBeGreaterThan(draftKey);
  expect(send).toBeGreaterThan(claim);
  expect(source).toContain("recipientKey:placementTpoEmailCampaignRecipients.recipientKey");
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
