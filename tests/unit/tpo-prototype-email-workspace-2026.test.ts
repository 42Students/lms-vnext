import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {
 TPO_CAMPAIGN_COMPOSE_PRESETS,tpoCampaignMergeToken,
} from "@/modules/messaging/tpo-campaign-compose-presets";
const source=(path:string)=>readFileSync(path,"utf8");

describe("2026 TPO Companies / Emails prototype",()=>{
 it("offers four truthful optional starting points without assuming a send",()=>{
  expect(TPO_CAMPAIGN_COMPOSE_PRESETS.map(item=>item.title)).toEqual([
   "Season dates","Introduce the college","Welcome back","Thank you after a drive",
  ]);
  for(const preset of TPO_CAMPAIGN_COMPOSE_PRESETS){
   expect(preset.subject.length).toBeGreaterThan(8);
   expect(preset.body).toContain("{name}");
   expect(preset.body).toContain("{company}");
   expect(preset.body).not.toMatch(/https?:\/\//);
  }
  expect(tpoCampaignMergeToken("Hello","name")).toBe("Hello {name}");
  expect(tpoCampaignMergeToken("Hello ","company")).toBe("Hello {company}");
  expect(tpoCampaignMergeToken("","name")).toBe("{name}");
 });
 it("allows explicit replacement only after warning about unsaved subject/body",()=>{
  const s=source("src/components/tpo/tpo-campaign-compose.tsx");
  expect(s).toContain('if(subject.trim()||body.trim())setPendingPreset(preset)');
  expect(s).toContain('title="Replace the current email wording?"');
  expect(s).toContain('cancelLabel="Keep my draft"');
  expect(s).toContain('description="The subject and body will be replaced with the chosen starting text. Nothing will be sent."');
  expect(s).toContain('tpoCampaignMergeToken(current,"name")');
  expect(s).toContain('tpoCampaignMergeToken(current,"company")');
  expect(s).toContain('fetch("/api/placements/tpo/campaigns/drafts"');
  expect(s).toContain('Nothing is sent from this form.');
  expect(s).toContain("const campaignTitle=title.trim()||subject.trim()");
  expect(s).toContain('title="Advanced campaign settings"');
  expect(s).toContain('Defaults to the email subject');
 });
 it("list and composer share a prototype split-screen shell without flattening authorization",()=>{
  const page=source("src/app/(authenticated)/tpo/recruiters/campaigns/new/page.tsx");
  expect(page).toContain("hasMembershipRole(ctx,\"TPO\")");
  expect(page).toContain("validIds.length!==candidateIds.length");
  expect(page).toContain("<TpoCampaignPrototypeSidebar");
  expect(page).toContain("<TpoCampaignCompose");
  expect(page).toContain("listTpoCampaignDrafts(ctx)");
 });
 it("offers author-based Mine, real search and persisted campaign statuses",()=>{
  const sidebar=source("src/components/tpo/tpo-campaign-prototype-sidebar.tsx");
  const service=source("src/modules/messaging/tpo-campaign-draft-service.ts");
  expect(sidebar).toContain("row.createdByUserId===actorUserId");
  expect(sidebar).toContain("row.title,row.subject,row.sender_name");
  expect(sidebar).toContain("provider accepted");
  expect(sidebar).toContain("Drafts and sending");
  expect(service).toContain("d.created_by_user_id");
  expect(service).toContain("createdByUserId:row.created_by_user_id");
  expect(service).toContain("assertPersistedPlatformPermission");
 });
 it("preserves draft review, dispatch checks and genuine recipient receipts",()=>{
  const detail=source("src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/page.tsx");
  const index=source("src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx");
  expect(detail).toContain("<TpoCampaignPrototypeSidebar");
  expect(detail).toContain("<TpoCampaignSendControl");
  expect(detail).toContain("<TpoCampaignSentStory");
  expect(detail).toContain("recipientsReady={recipients?.ready===true}");
  expect(detail).toContain("Provider acceptance is not proof of delivery.");
  expect(index).toContain('data-testid="tpo.campaigns.prototype-overview"');
  expect(index).toContain("Advanced history, filters and provider receipt ledger");
  expect(index).toContain("tpoCampaignDispatchReady()");
  expect(index).toContain("listTpoMessagingHistory(context");
 });
 it("sent campaign chronology distinguishes provider receipts from untracked engagement",()=>{
  const story=source("src/components/tpo/tpo-campaign-sent-story.tsx");
  for(const heading of ["What you sent","What happened","What to do now","Everyone it went to"]){
   expect(story).toContain(heading);
  }
  expect(story).toContain('campaign.status==="SENT"||campaign.status==="SENDING"');
  expect(story).toContain("Provider acceptance does not confirm inbox delivery");
  expect(story).toContain("no instrumentation for delivery, opens, clicks");
  expect(story).toContain('href={"/tpo/recruiters/"+encodeURIComponent(row.leadId)}');
 });

});
