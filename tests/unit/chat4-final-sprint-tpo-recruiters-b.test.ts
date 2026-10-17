import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {recruiterAttentionFromPersistedFacts} from "@/modules/placements/tpo-recruiter-attention-model";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
const roster=source("src/components/tpo/recruiter-leads-workspace.tsx");
const detail=source("src/components/tpo/recruiter-lead-detail-workspace.tsx");
describe("chat-4 final sprint TPO recruiter gaps B",()=>{
 it("TPO-recruiters-25 excludes recruited leads from no-next-step and never guesses verification from an invitation",()=>{
  const now=new Date("2026-10-18T10:00:00Z");
  const base={createdAt:new Date("2026-10-01T10:00:00Z"),lastContactAt:null,
   lastActivityAt:null,stage:"NEW",nextFollowupAt:null,inviteBouncedAt:null,
   inviteSentAt:new Date("2026-10-04T10:00:00Z"),recruiterUserId:null,
   manualStage:"NEW",unsubscribedAt:null};
  expect(recruiterAttentionFromPersistedFacts(base,now).chips).toContain("NO_NEXT_STEP");
  expect(recruiterAttentionFromPersistedFacts({...base,stage:"RECRUITED"},now).chips).not.toContain("NO_NEXT_STEP");
  expect(recruiterAttentionFromPersistedFacts(base,now).chips).not.toContain("UNVERIFIED");
  expect(recruiterAttentionFromPersistedFacts({...base,unsubscribedAt:now},now).chips).toEqual([]);
 });
 it("TPO-recruiters-26 offers typed interactions and constrained call outcomes",()=>{
  expect(detail).toContain('aria-label="Interaction type"');
  expect(detail).toContain('aria-label="Call outcome"');
  expect(detail).toContain('"No answer"');
  expect(detail).toContain('"Not interested"');
  expect(detail).toContain('Log activity');
 });
 it("TPO-recruiters-27 rejects past follow-ups and exposes quick scheduling choices",()=>{
  expect(detail).toContain("Pick a future date and time for this follow-up.");
  for(const shortcut of ['["Tomorrow",1]','["In 3 days",3]','["In a week",7]'])
   expect(detail).toContain(shortcut);
  expect(detail).toContain("Overdue");
 });
 it("TPO-recruiters-28 keeps an auditable distinction between system and user timeline entries",()=>{
  expect(detail).toContain("a.isSystem?");
  expect(detail).toContain("Nothing logged yet. A call, email, meeting or note logged above shows up here.");
  expect(detail).toContain('a.type==="CALL"?"Call"');
  expect(detail).toContain("formatDateTimeIst(a.createdAt)");
 });
 it("TPO-recruiters-29 renders safe missing-record responses, recovery and loading surfaces",()=>{
  const page=source("src/app/(authenticated)/tpo/recruiters/[leadId]/page.tsx");
  const error=source("src/app/(authenticated)/tpo/recruiters/error.tsx");
  const loading=source("src/app/(authenticated)/tpo/recruiters/loading.tsx");
  expect(page).toContain("notFound()");
  expect(page).toContain("TPO_CRM_LEAD_NOT_FOUND");
  expect(error).toContain("Retry");
  expect(loading).toContain('aria-busy="true"');
  expect(detail).toContain('role="dialog" aria-modal="true"');
 });
 it("TPO-recruiters-31 requires a reason for Not now and renders an IST revisit date",()=>{
  expect(detail).toContain("Please tell us why this recruiter is not available now.");
  expect(detail).toContain("notNowReason.trim()");
  expect(detail).toContain("Revisit on ");
  expect(detail).toContain('timeZone:"Asia/Kolkata"');
 });
 it("TPO-recruiters-32 restores q, due and campaign deep links with company-prefilled creation",()=>{
  const page=source("src/app/(authenticated)/tpo/recruiters/page.tsx");
  expect(page).toContain('requested === "campaigns"');
  expect(page).toContain('q:first(query.q)??""');
  expect(page).toContain('first(query.due)==="1"?"DUE":"ALL"');
  expect(page).toContain('initialAdd={first(query.add) === "1"}');
  expect(page).toContain('initialCompany={first(query.company)?.trim() ?? ""}');
 });
 it("TPO-recruiters-33 blocks invitations and explains the opted-out status",()=>{
  expect(detail).toContain("Asked not to be contacted.");
  expect(detail).toContain("Invitations and outreach are unavailable.");
  expect(detail).toContain('if(lead?.unsubscribedAt)');
  expect(roster).toContain('Boolean(lead.unsubscribedAt)');
 });
 it("TPO-recruiters-37 provides keyboard equivalents for inaccessible board dragging and focus-managed dialogs",()=>{
  expect(roster).toContain("Move to… / Actions");
  expect(roster).toContain("onDragStart={event");
  expect(roster).toContain('if(e.key==="Escape")');
  expect(roster).toContain('role="dialog" aria-modal="true"');
  expect(detail).toContain("keepRecruiterDialogFocus");
  expect(detail).toContain("event.key");
 });
});
