import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
const source=(name:string)=>read("src/components/"+name+".tsx");
describe("Chat-6 independent TPO first-third cross-audit",()=>{
 it("UX-tpo-audit-21 audit grid uses mobile cards and retains selection and copy",()=>{
  const code=source("tpo/tpo-audit-grid");
  expect(code).toContain("<TpoAuditQuartz");
  expect(code).toContain('mobilePrimaryKeys={["event","when"]}');
  expect(code).toContain("mobileActionsCollapsible");
  expect(code).toContain("allIds:visible.map");
  expect(code).toContain("Copy rows");
  expect(code).toContain("Showing {visible.length} of {snapshotRows.length}");
  expect(code).not.toContain("<table");
 });
 it("UX-tpo-batches-batchid-students-21 saved views use accessible destructive dialog and pending lock",()=>{
  const code=source("tpo/tpo-batch-student-saved-views");
  expect(code).toContain("<ConfirmDialog open={deleteTarget!==null}");
  expect(code).toContain("Delete this saved batch view?");
  expect(code).toContain("inFlightRef.current=true");
  expect(code).toContain("inFlightRef.current=false");
  expect(code).not.toContain("window.confirm");
 });
 it("UX-tpo-batches-batchid-rules-21 unsaved batch changes protect history and links",()=>{
  const code=source("tpo/tpo-batch-rule-editor");
  expect(code).toContain("Discard your unsaved batch-rule changes?");
  expect(code).toContain("<ConfirmDialog open={pendingHref!==null}");
  expect(code).toContain("setPendingHref(destination)");
  expect(code).not.toContain("window.confirm");
 });
 it("UX-tpo-batches-batchid-classes-21 class decision is confirmed with guarded writes",()=>{
  const code=source("tpo/tpo-batch-class-decision");
  expect(code).toContain("<ConfirmDialog open={confirmOpen}");
  expect(code).toContain("Student overrides are not changed.");
  expect(code).toContain("inFlightRef.current=true");
  expect(code).toContain("inFlightRef.current=false");
  expect(code).not.toContain("window.confirm");
  expect(code).not.toContain("data?.error");
 });
 it("UX-tpo-batches-batchid-students-22 ineligibility reason uses shared Dialog",()=>{
  const code=source("tpo/tpo-batch-inline-decision");
  expect(code).toContain("<Dialog open={reasonOpen}");
  expect(code).toContain("Higher studies");
  expect(code).toContain("Not interested in placements");
  expect(code).toContain("Use reason");
  expect(code).not.toContain("<dialog");
 });
 it("UX-tpo-batches-batchid-students-23 eligibility CSV uses shared Drawer",()=>{
  const code=source("tpo/tpo-batch-eligibility-import");
  expect(code).toContain("<Drawer open={importOpen}");
  expect(code).toContain("Import eligibility decisions");
  expect(code).toContain("Confirm matched decisions");
  expect(code).toContain("Discard import review?");
  expect(code).not.toContain("<dialog");
 });
 it("UX-tpo-calendar-21 follow-up creation preserves native back and IST",()=>{
  const code=source("tpo/tpo-new-followup-modal");
  expect(code).toContain("<Dialog open={open}");
  expect(code).toContain("<ConfirmDialog open={confirmLeave}");
  expect(code).toContain("Discard this follow-up draft?");
  expect(code).toContain("calendarLocalIstToOffset(when)");
  expect(code).toContain("sm:text-sm");
  expect(code).not.toContain("role=\"dialog\"");
 });
 it("UX-tpo-follow-ups-21 due follow-up confirmations and IST conversion are safe",()=>{
  const code=source("tpo/tpo-due-followup-workspace");
  expect(code).toContain("<ConfirmDialog open={confirmCreate}");
  expect(code).toContain("<ConfirmDialog open={confirmComplete!==null}");
  expect(code).toContain("calendarLocalIstToOffset(dueLocal)");
  expect(code).toContain("inFlightRef.current=true");
  expect(code).toContain("inFlightRef.current=false");
  expect(code).not.toContain("window.confirm");
 });
 it("UX-tpo-placements-jobs-jobid-applicants-pipeline-21 filter sheet confines focus",()=>{
  const code=source("tpo/tpo-grid-filter-panel");
  expect(code).toContain("<BottomSheet open={sheetOpen}");
  expect(code).toContain("aria-expanded={sheetOpen}");
  expect(code).toContain("clearTpoGridFilters");
  expect(code).not.toContain("open:fixed");
 });
 it("UX-tpo-messages-21 recruiter composer retains draft in native Dialog",()=>{
  const code=source("tpo/tpo-new-recruiter-conversation");
  expect(code).toContain("<Dialog open={open}");
  expect(code).toContain("sessionStorage.setItem(draftKey,value)");
  expect(code).toContain("inFlightRef.current=true");
  expect(code).toContain("inFlightRef.current=false");
  expect(code).not.toContain("role=\"dialog\"");
 });
 it("UX-tpo-placements-jobs-jobid-applicants-pipeline-22 applicant review uses native Drawer",()=>{
  const code=source("placements/tpo-applicant-review-drawer");
  expect(code).toContain("<Drawer open={open}");
  expect(code).toContain("TpoApplicantReviewForm");
  expect(code).toContain("previousId");
  expect(code).toContain("nextId");
  expect(code).not.toContain("<dialog");
 });
 it("UX-tpo-batches-batchid-21 deadline deletion uses accessible confirmation",()=>{
  const code=source("tpo/tpo-batch-invitation-control");
  expect(code).toContain("<ConfirmDialog open={confirmClear}");
  expect(code).toContain("Remove the registration deadline?");
  expect(code).toContain("if(saved)setConfirmClear(false)");
  expect(code).not.toContain("window.confirm");
 });
 it("UX-tpo-batches-batchid-students-24 bulk actions retain phone targets and legacy command",()=>{
  const code=source("tpo/tpo-bulk-action-panel");
  expect(code).toContain("min-h-11");
  expect(code).toContain("Do it");
  expect(code).toContain("useGuardedAction");
  expect(code).not.toContain("text-on-primary");
 });
 it("UX-tpo-placements-jobs-jobid-applicants-pipeline-23 spreadsheet mobile actions retain full fields",()=>{
  const code=source("tpo/tpo-spreadsheet-grid");
  expect(code).toContain("More student details");
  expect(code).toContain("mobileActionsCollapsible");
  expect(code).toContain("Row actions");
 });
 it("UX-tpo-batches-batchid-students-25 column chooser preserves order and 44px targets",()=>{
  const code=source("tpo/tpo-grid-column-chooser");
  expect(code).toContain("Visible columns");
  expect(code).toContain("min-h-11");
  expect(code).toContain("Show all columns");
  expect(code).toContain("Reset columns");
 });
 it("UX-tpo-first-third-coverage-21 verifies 42 route sources and authored UX notes",()=>{
  const list=read("docs/orchestrator/ui-ux/pages-tpo.md");
  const routes=list.split("\n").filter(line=>line.startsWith("- [")).map(line=>line.split("`")[1]).filter((route):route is string=>Boolean(route));
  expect(routes).toHaveLength(126);
  for(const route of routes.slice(0,42)){
   expect(read("src/app/(authenticated)"+route+"/page.tsx").length).toBeGreaterThan(40);
   const slug=route==="/tpo"?"tpo-index":route.slice(1).replaceAll("[","").replaceAll("]","").replaceAll("/","-").toLowerCase();
   expect(read("docs/audit/ux/"+slug+".md").length).toBeGreaterThan(100);
  }
 });
});
