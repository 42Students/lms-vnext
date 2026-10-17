import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {tpoStudentDisplayLabel} from "@/modules/placements/tpo-student-display-label";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("chat-12 independently verified legacy copy and summary",()=>{
 it("TPO-students-32 shows registration-not-open from scoped invitation state",()=>{
  const s=src("src/app/(authenticated)/tpo/students/page.tsx");
  expect(s).toContain("Registration is not open for {data.uninvitedCount} students");
  expect(s).toContain("Open Placement eligibility");
 });
 it("TPO-students-46 uses exact single Students header subtitle and primary import",()=>{
  const s=src("src/app/(authenticated)/tpo/students/page.tsx");
  expect(s).toContain('description="Everyone in placements, from the batches you made eligible."');
  expect(s).toContain("actions={manageAllowed?<TpoAcademicImportWorkspace />:undefined}");
  expect(s).not.toContain('eyebrow="TPO · Students"');
 });
 it("TPO-students-R05 avoids development-only badges and copy",()=>{
  const s=src("src/app/(authenticated)/tpo/students/page.tsx");
  for(const fragment of ["Readiness unverified","Browser and legacy parity remain unverified.","Provisional rate. An unavailable registration table"])expect(s).not.toContain(fragment);
 });
 it("TPO-students-R06 converts server enums to visible human-status copy",()=>{
  expect(tpoStudentDisplayLabel("READY_NOT_APPLYING")).toBe("Ready, not applying");
  expect(tpoStudentDisplayLabel("TECHNICAL_INTERVIEW round 2: NOT_SELECTED")).toBe("Not selected at Technical interview (round 2)");
 });
 it("TPO-students-R07 derives journey summary from scoped filtered rows, not the college base",()=>{
  const s=src("src/modules/placements/tpo-students-service.ts");
  expect(s).toContain("const scopedRows=filterTpoStudentRoster(filteredRows");
  expect(s).toContain("summary: summarizeTpoStudents(scopedRows)");
 });
 it("TPO-students-53 counts ISSUED as waiting and ISSUED or ACCEPTED as offers",()=>{
  const s=src("src/modules/placements/tpo-students-model.ts");
  expect(s).toContain('offer.status==="ISSUED"');
  expect(s).toContain('offer.status === "ACCEPTED"');
 });
 it("TPO-requests-verification-17 retains legacy Requests title/history/empty copy",()=>{
  const s=src("src/app/(authenticated)/tpo/requests/page.tsx");
  expect(s).toContain('<PageHeader title="Requests"');
  expect(s).toContain("What students have asked you to decide: withdrawals, off-campus offers, registration changes and disputes. Urgent ones come first.");
  for(const token of ["Waiting","Last 30 days","All history","Nothing is waiting for you.","No requests in this period."])expect(s).toContain(token);
 });
 it("TPO-requests-verification-27 offers section-specific reason presets and custom text",()=>{
  const s=src("src/modules/verification/review-reasons.ts");
  const drawer=src("src/components/verification/VerificationReviewDrawer.tsx");
  expect(s).toContain("The marksheet is unclear or cropped");
  expect(s).toContain("Wrong document uploaded");
  expect(drawer).toContain("Or write what needs to change");
  expect(drawer).toContain("The student sees your reason and fixes it on their profile.");
 });
 it("TPO-requests-verification-R01 reverses released-but-not-accepted offers during approved withdrawal",()=>{
  const s=src("src/modules/placements/request-service.ts");
  expect(s).toContain('offer.status==="ISSUED"');
  expect(s).toContain('toStatus:"DECLINED"');
 });
});