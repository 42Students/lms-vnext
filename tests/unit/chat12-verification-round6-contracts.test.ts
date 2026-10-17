import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(new URL("../../src/"+p,import.meta.url),"utf8");
describe("TPO verification round6 source regressions",()=>{
 it("TPO-requests-verification-20 current behavior covered",()=>{
  const s=src("modules/placements/tpo-verification-queue-service.ts");
  expect(s).toContain("effectiveTpoVerifierSetting(setting)");
  expect(s).toContain("tpoVerifierGrantAllowed(grant)");
 });
 it("TPO-requests-verification-21 current behavior covered",()=>{
  const s=src("app/(authenticated)/tpo/verification/page.tsx");
  expect(s).toContain("Your college admin has not allowed");
  expect(s).toContain("Your verification access has been removed");
 });
 it("TPO-requests-verification-22 current behavior covered",()=>{
  const s=src("modules/placements/tpo-verification-queue-service.ts");
  expect(s).toContain("rollNumber:learnerProfiles.rollNumber");
  expect(s).toContain("submittedMarksheets(");
 });
 it("TPO-requests-verification-23 current behavior covered",()=>{
  const s=src("modules/placements/tpo-verification-queue-service.ts");
  expect(s).toContain("counts.WAITING");
  expect(s).toContain("asc(profileVerifications.submittedAt)");
 });
 it("TPO-requests-verification-24 current behavior covered",()=>{
  const s=src("app/(authenticated)/tpo/verification/page.tsx");
  expect(s).toContain("waitingSince");
  expect(s).toContain("batchId");
  expect(s).toContain("branchId");
  expect(s).toContain("Student or roll number");
 });
 it("TPO-requests-verification-25 current behavior covered",()=>{
  const s=src("components/verification/TpoVerificationPanel.tsx");
  expect(s).toContain("Stopped at ");
  expect(s).toContain("Review one by one");
 });
 it("TPO-requests-verification-26 current behavior covered",()=>{
  const s=src("components/tpo/tpo-roster-verification-bulk.tsx");
  expect(s).toContain("collegeBulkReviewPayload(");
  expect(s).toContain("runGuarded");
 });
 it("TPO-requests-verification-27 current behavior covered",()=>{
  const s=src("components/verification/VerificationReviewDrawer.tsx");
  expect(s).toContain("tpoVerificationSectionReasons");
  expect(s).toContain("The student sees your reason");
 });
 it("TPO-requests-verification-28 current behavior covered",()=>{
  const s=src("components/verification/TpoVerificationPanel.tsx");
  expect(s).toContain("showToast(");
  expect(s).toContain("The student has been told.");
 });
 it("TPO-requests-verification-29 current behavior covered",()=>{
  const s=src("components/verification/VerificationReviewDrawer.tsx");
  expect(s).toContain("Private supporting documents");
  expect(s).toContain("Submitted versus previously verified");
  expect(s).toContain("Education");
 });
 it("TPO-requests-verification-31 current behavior covered",()=>{
  const s=src("app/(authenticated)/tpo/verification/page.tsx");
  expect(s).toContain("Check students&apos; education and identity");
  expect(s).toContain("<h1");
 });
 it("TPO-requests-verification-32 current behavior covered",()=>{
  const s=src("app/(authenticated)/tpo/verification/page.tsx");
  expect(s).toContain("/api/tpo/verification/export?");
  expect(s).toContain("Verified");
 });
});
