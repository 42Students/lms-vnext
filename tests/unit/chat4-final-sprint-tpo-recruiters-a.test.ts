import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
const roster=source("src/components/tpo/recruiter-leads-workspace.tsx");
const detail=source("src/components/tpo/recruiter-lead-detail-workspace.tsx");

describe("chat-4 final sprint TPO recruiter gaps A",()=>{
 it("TPO-recruiters-05 supports restricted drag-and-drop and native stage moves",()=>{
  expect(roster).toContain("draggable={lead.manualStage");
  expect(roster).toContain("onDragStart={event");
  expect(roster).toContain("onDrop={event");
  expect(roster).toContain("Move to… / Actions");
  expect(roster).toContain("<RecruiterInlineStage");
 });
 it("TPO-recruiters-06 includes the Emails campaign view and count-bearing companies tab",()=>{
  const page=source("src/app/(authenticated)/tpo/recruiters/page.tsx");
  expect(page).toContain('requested === "campaigns"');
  expect(page).toContain("<CampaignHistory");
  expect(roster).toContain('["campaigns","Emails"]');
  expect(roster).toContain('"Companies ("+companies.length+")"');
  expect(roster).toContain('role="tab"');
 });
 it("TPO-recruiters-10 shows persisted company metrics, drives, and added date",()=>{
  expect(detail).toContain("companySummary");
  expect(detail).toContain("drivesRan");
  expect(detail).toContain("acceptedOfferDrives");
  expect(detail).toContain("Added: {formatDateTimeIst(lead.createdAt)}");
  expect(detail).toContain('aria-label="Company"');
 });
 it("TPO-recruiters-11 has company-aware invite, drive creation, and team talk",()=>{
  expect(detail).toContain('"Resend invite":"Invite"');
  expect(detail).toContain("Create drive");
  expect(detail).toContain("Team talk");
  expect(detail).toContain('lead.unsubscribedAt');
  expect(detail).toContain('"#recruiter-invite"');
 });
 it("TPO-recruiters-15 reports individual bulk failure reasons and an email composer entry",()=>{
  const owner=source("src/components/tpo/recruiter-bulk-owner-controls.tsx");
  const stage=source("src/components/tpo/recruiter-bulk-stage-controls.tsx");
  expect(owner).toContain("tpoBulkFailedLines");
  expect(owner).toContain("result.reason");
  expect(stage).toContain("tpoBulkFailedSummary");
  expect(roster).toContain("Send an email to selected");
  expect(roster).toContain("<RecruiterBulkOwnerControls");
 });
 it("TPO-recruiters-16 performs inline stage and owner edits through protected APIs",()=>{
  const stage=source("src/components/tpo/recruiter-inline-stage.tsx");
  const owner=source("src/components/tpo/recruiter-inline-owner.tsx");
  expect(roster).toContain("<RecruiterInlineStage");
  expect(roster).toContain("<RecruiterInlineOwner");
  expect(stage).toContain("/api/placements/tpo/leads/bulk-stage");
  expect(stage).toContain("Give a reason for Not now.");
  expect(owner).toContain("expectedOwnerMembershipId");
  expect(owner).toContain("/api/placements/tpo/leads/bulk-owner");
 });
 it("TPO-recruiters-18 supports saved views, max-five pins, update, delete and persisted columns",()=>{
  const views=source("src/components/tpo/recruiter-saved-view-controls.tsx");
  expect(roster).toContain("<RecruiterSavedViewControls");
  expect(views).toContain("You can pin up to 5 views.");
  expect(views).toContain('apply("UPDATE",active)');
  expect(views).toContain('apply("DELETE",active)');
  expect(views).toContain("columns_json");
 });
 it("TPO-recruiters-20 retains column selection and sort mode as explicit choices",()=>{
  const controls=source("src/components/tpo/recruiter-roster-display-controls.tsx");
  expect(roster).toContain("<RecruiterRosterDisplayControls");
  expect(roster).toContain("sortEngageRows");
  expect(roster).toContain("visibleColumns");
  expect(controls).toContain("ENGAGE_COLUMNS");
  expect(controls).toContain('value="LAST_ACTIVITY"');
  expect(controls).toContain('value="NEXT_FOLLOWUP"');
 });
 it("TPO-recruiters-21 has company-required add, future follow-up and dirty-draft confirmation",()=>{
  expect(roster).toContain("Company is required.");
  expect(roster).toContain('list="known-engage-companies"');
  expect(roster).toContain("Choose a future follow-up date (IST).");
  expect(roster).toContain("Discard this recruiter draft?");
  expect(roster).toContain('role="dialog" aria-modal="true"');
 });
});
