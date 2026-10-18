import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {hrVerifiedDriveReceiptMessage} from "@/modules/placements/hr-drive-request-feedback-model";
describe("HR-BREAK-DRIVE-RECEIPT-33 verified drive submission handoff",()=>{
 it.each([
  "Saved. The placement cell sees the new version.",
  "Sent for review.",
  "Sent to the placement cell for review",
  "Request resent to the placement cell.",
 ])("recognizes only receipts emitted after a successful persisted request: %s",value=>{
  expect(hrVerifiedDriveReceiptMessage(value)).toBe(value);
 });
 it.each([
  null,undefined,"",true,"Sent",["Sent for review."],"Request approved",
  "Sent to the placement cell for review <script>",
 ])("does not manufacture a saved request from arbitrary session data %j",raw=>{
  expect(hrVerifiedDriveReceiptMessage(raw)).toBeNull();
 });
 it("matches the exact producer's persisted success message and consumes once",()=>{
  const producer=readFileSync("src/components/hr/hr-drive-draft-form.tsx","utf8");
  const consumer=readFileSync("src/components/hr/recruiter-request-feedback.tsx","utf8");
  expect(producer).toContain(': "Sent to the placement cell for review"');
  expect(producer).toContain("submittedRef.current=true");
  expect(consumer).toContain("hrVerifiedDriveReceiptMessage(message)");
  expect(consumer).toContain("window.sessionStorage.removeItem(storageKey)");
  expect(consumer).not.toContain("window.location.search");
 });
});
