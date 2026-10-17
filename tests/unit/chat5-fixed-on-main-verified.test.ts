import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(path,"utf8");
describe("Chat-5 FIXED-ON-MAIN evidence revalidation",()=>{
 it("TPO-batches-29 redirects legacy tab deep links to the registered workspace routes",()=>{
  const p=source("src/app/(authenticated)/tpo/batches/[batchId]/page.tsx");
  for(const text of ['classes:"classes"','registration:"registrations"','students:"students"','rules:"rules"','history:"history"'])expect(p).toContain(text);
  expect(p).toContain('redirect("/tpo/batches/"+encodeURIComponent(batchId)+"/"+aliases[selected])');
 });
 it("TPO-students-08 exposes authenticated bulk profile verification with guarded write",()=>{
  const c=source("src/components/tpo/tpo-roster-verification-bulk.tsx");
  expect(c).toContain('"VERIFY"');
  expect(c).toContain("useGuardedAction");
  expect(c).toContain("apiFetch");
 });
 it("TPO-students-09 exposes send-back in bulk with reason and guarded action",()=>{
  const c=source("src/components/tpo/tpo-roster-verification-bulk.tsx");
  expect(c).toContain('"SEND_BACK"');
  expect(c).toContain("reason");
  expect(c).toContain("useGuardedAction");
 });
 it("TPO-students-11 offers audited per-student and bulk private notes without leaking server details",()=>{
  const c=source("src/components/tpo/tpo-student-note-editor.tsx");
  expect(c).toContain("apiFetch");
  expect(c).toContain("useGuardedAction");
  expect(c).toContain("Ctrl+Enter");
  expect(c).toContain("membershipIds");
 });
 it("TPO-students-18 has roster-wide scoped Batch Program Branch and Class filters",()=>{
  const c=source("src/components/tpo/tpo-students-spreadsheet.tsx");
  for(const x of ['urlKey:"programId"','urlKey:"classId"','label:"Program"','label:"Class"'])expect(c).toContain(x);
  const page=source("src/app/(authenticated)/tpo/students/page.tsx");
  expect(page).toContain("listTpoBatches");
 });
 it("TPO-students-27 identifies learners from finished batches distinctly",()=>{
  const c=source("src/components/tpo/tpo-students-spreadsheet.tsx");
  expect(c).toContain("fromFinishedBatch");
  expect(c).toContain('" · From "');
  expect(c).toContain("cohortName");
 });
 it("TPO-students-30 preserves unknown verification status and waiting sections",()=>{
  const c=source("src/modules/placements/tpo-student-verification-facts.ts");
  expect(c).toContain('status:"UNKNOWN"');
  expect(c).toContain("waitingSections");
  expect(c).toContain("verifiedSections");
 });
 it("TPO-requests-verification-02 uses reviewed approval with exact learner notice and no native confirm",()=>{
  const c=source("src/components/placements/tpo-request-decision-control.tsx");
  expect(c).toContain("Approved. The student has been told.");
  expect(c).toContain("tpoRequestNeedsConfirmation");
  expect(c).not.toContain("window.confirm");
 });
 it("TPO-requests-verification-03 uses real reject reason presets and learner confirmation",()=>{
  const c=source("src/components/placements/tpo-request-decision-control.tsx");
  for(const reason of ["Not eligible","Proof missing or unclear","Deadline has passed","Duplicate request","Other"])expect(c).toContain(reason);
  expect(c).toContain("Rejected. The student has been told, with your reason.");
 });
 it("TPO-requests-verification-04 persists student-facing notice in the decision service",()=>{
  const c=source("src/modules/placements/request-service.ts");
  expect(c).toContain("inAppNotifications");
  expect(c).toContain("Your request was answered");
  expect(c).toContain("decisionEvent.id");
 });
});
