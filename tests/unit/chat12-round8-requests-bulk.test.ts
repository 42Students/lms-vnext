import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("chat-12 Requests actual persisted bulk decisions and legacy copy",()=>{
 it("TPO-requests-verification-13 reviews same-kind requests and versions each persisted decision",()=>{
  const page=src("src/app/(authenticated)/tpo/requests/page.tsx");
  const bulk=src("src/components/placements/tpo-request-bulk-decision.tsx");
  expect(page).toContain("<TpoRequestBulkDecision");
  expect(bulk).toContain("chosenKind!==row.requestType");
  expect(bulk).toContain("MAX_BULK_REQUESTS=10");
  expect(bulk).toContain("expectedUpdatedAt:row.expectedUpdatedAt");
  expect(bulk).toContain('"/decision"');
  expect(bulk).toContain("runGuarded(async()=>");
  expect(bulk).toContain("results.push({id:row.id,name:row.studentName,status:\"failed\"");
  expect(bulk).toContain("acknowledged");
 });
 it("TPO-requests-verification-17 renders legacy title and waiting/history copy without an invented eyebrow",()=>{
  const page=src("src/app/(authenticated)/tpo/requests/page.tsx");
  expect(page).toContain('<PageHeader title="Requests"');
  expect(page).not.toContain('eyebrow="TPO · Operations"');
  expect(page).toContain("Urgent ones come first.");
  expect(page).toContain("Nothing is waiting for you.");
  expect(page).toContain("No requests in this period.");
 });
 it("TPO-requests-verification-02 sends an empty approval note as a valid string instead of null",()=>{
  const form=src("src/components/placements/tpo-request-decision-control.tsx");
  const model=src("src/modules/placements/tpo-request-decision-model.ts");
  expect(model).toContain("note: z.string().trim().max(2000)");
  expect(form).toContain("note:decisionText,expectedUpdatedAt");
  expect(form).not.toContain("note:decisionText||null");
 });
 it("TPO-requests-verification-18 retains request loading and retryable friendly error states",()=>{
  expect(src("src/app/(authenticated)/tpo/requests/loading.tsx")).toContain('aria-busy="true"');
  expect(src("src/app/(authenticated)/tpo/requests/error.tsx")).toContain("Retry requests");
 });
 it("TPO-requests-verification-23 counts authorized verification requests before server pagination",()=>{
  const service=src("src/modules/placements/tpo-verification-queue-service.ts");
  expect(service).toContain("groupBy(profileVerifications.status)");
  expect(service).toContain("counts.WAITING+=item.total");
  expect(service).toContain("asc(profileVerifications.submittedAt)");
 });
 it("TPO-requests-verification-27 preserves Education and Identity-specific send-back reasons",()=>{
  const source=src("src/modules/verification/review-reasons.ts");
  expect(source).toContain("The marksheet is unclear or cropped");
  expect(source).toContain("Wrong document uploaded");
 });
 it("TPO-requests-verification-28 differentiates failed verification and failed send-back",()=>{
  const source=src("src/components/verification/VerificationReviewDrawer.tsx");
  expect(source).toContain('action==="VERIFY"?"Could not verify":"Could not send it back"');
  expect(source).toContain('role="alert"');
 });
 it("TPO-requests-verification-R01 declines ISSUED but not ACCEPTED offers for an approved withdrawal",()=>{
  const source=src("src/modules/placements/request-service.ts");
  expect(source).toContain('offer.status==="ISSUED"');
  expect(source).toContain('toStatus:"DECLINED"');
 });
});
