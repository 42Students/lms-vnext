import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("TPO FIXED-ON-MAIN source checks; live acceptance required",()=>{
 it("TPO-students-37 retains its assigned source contract",()=>{
  expect(source("src/components/tpo/tpo-student-clipboard-actions.tsx")).toContain("navigator.clipboard.writeText");
  expect(source("src/components/tpo/tpo-students-spreadsheet.tsx")).toContain("event.key.toLowerCase()===\"c\"");
 });
 it("TPO-students-38 retains its assigned source contract",()=>{
  expect(source("src/components/tpo/tpo-student-clipboard-actions.tsx")).toContain("Paste roll numbers");
  expect(source("src/components/tpo/tpo-student-clipboard-actions.tsx")).toContain("matchTpoStudentRolls");
 });
 it("TPO-students-40 retains its assigned source contract",()=>{
  expect(source("src/components/tpo/tpo-students-spreadsheet.tsx")).toContain("APPLICATIONS_DESC");
  expect(source("src/components/tpo/tpo-students-spreadsheet.tsx")).toContain("OFFERS_ASC");
 });
 it("TPO-students-41 retains its assigned source contract",()=>{
  expect(source("src/components/tpo/tpo-student-note-editor.tsx")).toContain("e.key===\"Enter\"");
  expect(source("src/components/tpo/tpo-students-spreadsheet.tsx")).toContain("event.key.toLowerCase()===\"a\"");
 });
 it("TPO-students-42 retains its assigned source contract",()=>{
  expect(source("src/components/tpo/tpo-student-quick-panel.tsx")).toContain("\"Requests\"|\"Notes\"|\"History\"");
  expect(source("src/components/tpo/tpo-student-quick-panel.tsx")).toContain("TpoRequestDecisionControl");
 });
 it("TPO-students-44 retains its assigned source contract",()=>{
  expect(source("src/components/tpo/tpo-student-quick-panel.tsx")).toContain("teamHistory");
  expect(source("src/modules/placements/tpo-student-panel-detail-service.ts")).toContain("activityEvents");
 });
 it("TPO-students-45 retains its assigned source contract",()=>{
  expect(source("src/app/(authenticated)/tpo/students/[membershipId]/history/page.tsx")).toContain("Application status history");
  expect(source("src/modules/placements/tpo-student-history-service.ts")).toContain("eligibilitySnapshot");
 });
 it("TPO-students-52 retains its assigned source contract",()=>{
  expect(source("src/components/tpo/tpo-student-quick-panel.tsx")).toContain("\"Stage\"");
  expect(source("src/components/tpo/tpo-student-quick-panel.tsx")).toContain("\"Profile check\"");
 });
 it("TPO-requests-verification-02 retains its assigned source contract",()=>{
  expect(source("src/components/placements/tpo-request-decision-control.tsx")).toContain("<Dialog");
  expect(source("src/components/placements/tpo-request-decision-control.tsx")).toContain("tpoRequestNeedsConfirmation");
 });
 it("TPO-requests-verification-03 retains its assigned source contract",()=>{
  expect(source("src/components/placements/tpo-request-decision-control.tsx")).toContain("Proof missing or unclear");
  expect(source("src/components/placements/tpo-request-decision-control.tsx")).toContain("Rejected. The student has been told, with your reason.");
 });
 it("TPO-requests-verification-04 retains its assigned source contract",()=>{
  expect(source("src/modules/placements/request-service.ts")).toContain("inAppNotifications");
 });
 it("TPO-requests-verification-05 retains its assigned source contract",()=>{
  expect(source("src/modules/placements/request-service.ts")).toContain("inAppNotifications");
  expect(source("src/modules/placements/tpo-global-requests-model.ts")).toContain("tpoRequestUrgent");
 });
 it("TPO-requests-verification-22 retains its assigned source contract",()=>{
  expect(source("src/modules/placements/tpo-verification-queue-service.ts")).toContain("rollNumber");
 });
 it("TPO-requests-verification-24 retains its assigned source contract",()=>{
  expect(source("src/components/verification/TpoVerificationPanel.tsx")).toContain("MISSING_DOCUMENT");
  expect(source("src/components/verification/TpoVerificationPanel.tsx")).toContain("Review one by one");
 });
 it("TPO-requests-verification-26 retains its assigned source contract",()=>{
  expect(source("src/components/verification/TpoVerificationPanel.tsx")).toContain("<TpoRosterVerificationBulk");
 });
});
