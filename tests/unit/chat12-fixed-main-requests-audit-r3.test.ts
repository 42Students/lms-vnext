import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("TPO Requests FIXED-ON-MAIN source contracts; DB acceptance separate",()=>{
 it("TPO-requests-verification-07 preserves its source contract",()=>{
  expect(source("src/modules/placements/tpo-drive-stop-effects.ts")).toContain("settleDriveWithdrawalRequests");
  const stop=source("src/modules/placements/tpo-drive-stop-effects.ts");
  expect(stop).toContain('const decision=protectedOffer?"REJECTED":"APPROVED"');
  expect(stop).toContain("status:decision");
  expect(source("src/modules/placements/tpo-drive-stop-effects.ts")).toContain('const approvedNote="Approved (drive "+statusLabel');
  expect(stop).toContain('eq(placementOffers.status,"ACCEPTED")');
 });
 it("TPO-requests-verification-36 preserves its source contract",()=>{
  expect(source("src/modules/placements/tpo-drive-change-request-service.ts")).toContain("getDriveChangeRequests");
  expect(source("src/modules/placements/tpo-drive-change-request-service.ts")).toContain("placementDriveChangeRequests");
 });
 it("TPO-requests-verification-09 preserves its source contract",()=>{
  expect(source("src/app/(authenticated)/tpo/requests/page.tsx")).toContain('request.rollNumber??"—"');
  expect(source("src/app/(authenticated)/tpo/requests/page.tsx")).toContain("After college:");
 });
 it("TPO-requests-verification-10 preserves its source contract",()=>{
  expect(source("src/app/(authenticated)/tpo/requests/page.tsx")).toContain(">Decided by</th>");
  expect(source("src/app/(authenticated)/tpo/requests/page.tsx")).toContain(">Decided on</th>");
 });
 it("TPO-requests-verification-11 preserves its source contract",()=>{
  expect(source("src/modules/placements/tpo-global-requests-model.ts")).toContain("urgentOnly");
  expect(source("src/app/(authenticated)/tpo/requests/page.tsx")).toContain("requestType");
 });
 it("TPO-requests-verification-12 preserves its source contract",()=>{
  expect(source("src/modules/placements/tpo-request-attention-model.ts")).toContain("waitingOverTwoDays");
  expect(source("src/app/(authenticated)/tpo/requests/page.tsx")).toContain("tpoRequestAttentionOnPage");
 });
 it("TPO-requests-verification-14 preserves its source contract",()=>{
  expect(source("src/app/(authenticated)/tpo/requests/page.tsx")).toContain("<TpoStudentNudgePanel");
  expect(source("src/components/tpo/tpo-student-nudge-panel.tsx")).toContain("Send a message");
 });
 it("TPO-requests-verification-15 preserves its source contract",()=>{
  expect(source("src/app/(authenticated)/tpo/requests/page.tsx")).toContain("tpoRequestsExportHref");
  expect(source("src/modules/placements/tpo-requests-page-csv-model.ts")).toContain("tpoRequestsExportHref");
 });
 it("TPO-requests-verification-25 preserves its source contract",()=>{
  expect(source("src/components/verification/TpoVerificationPanel.tsx")).toContain("Start with the first of {waiting.length}");
  expect(source("src/components/verification/TpoVerificationPanel.tsx")).toContain("sequenceIndex+1");
  expect(source("src/components/verification/TpoVerificationPanel.tsx")).toContain("nextSequential");
 });
 it("TPO-requests-verification-30 preserves its source contract",()=>{
  expect(source("src/modules/profile-verification/transaction-writer.ts")).toContain("verificationDecisionNotice");
  expect(source("src/modules/verification/notification-copy.ts")).toContain("Verified by");
 });
 it("TPO-requests-verification-32 preserves its source contract",()=>{
  expect(source("src/modules/verification/staff-export-service.ts")).toContain("exportCollegeVerificationCsv");
 });
});
