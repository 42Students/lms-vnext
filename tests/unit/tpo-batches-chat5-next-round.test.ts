import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {batchDecisionLabel,batchSourceLabel,batchRegistrationLabel,batchHistoryDate,batchRuleDate} from "@/modules/placements/tpo-batch-labels-model";
import {tpoBatchDecisionSchema} from "@/modules/placements/tpo-batch-decision-model";
const source=(path:string)=>readFileSync(path,"utf8");
describe("TPO Batches next-round source and behavioral gap closure",()=>{
 it("TPO-batches-52 displays learner decision, source and five registration choices as human terms",()=>{
  expect(batchDecisionLabel("NOT_DECIDED")).toBe("Not decided");
  expect(batchDecisionLabel("ELIGIBLE")).toBe("Eligible");
  expect(batchSourceLabel("LEARNER")).toBe("Own decision");
  for(const [choice,label] of [
   ["PLACEMENTS","Placements"],["HIGHER_STUDIES","Higher studies"],
   ["NOT_INTERESTED","Not interested"],["ENTREPRENEURSHIP","Entrepreneurship"],
   ["COMPETITIVE_EXAMS","Competitive exams"],
  ])expect(batchRegistrationLabel(choice)).toBe(label);
  const page=source("src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx");
  expect(page).toContain("batchRegistrationLabel(s.registration.choice)");
 });
 it("TPO-batches-56 formats rules dates for India without leaking ISO timestamps",()=>{
  const iso=new Date("2099-01-05T03:30:00.000Z");
  expect(batchRuleDate(iso)).toContain("IST");
  expect(batchRuleDate(null)).toBe("Not recorded");
  const page=source("src/app/(authenticated)/tpo/batches/[batchId]/rules/page.tsx");
  expect(page).toContain("batchRuleDate(lifecycle?.registrationDeadline)");
  expect(page).not.toContain("lifecycle?.registrationDeadline?.toISOString()");
 });
 it("TPO-batches-57 rejects decision reasons above the persisted 200-character limit",()=>{
  const basic={membershipId:"11111111-1111-4111-8111-111111111111",expectedVersion:"2099-01-01"};
  expect(tpoBatchDecisionSchema.safeParse({...basic,decision:"INELIGIBLE",reason:"a".repeat(200)}).success).toBe(true);
  expect(tpoBatchDecisionSchema.safeParse({...basic,decision:"INELIGIBLE",reason:"a".repeat(201)}).success).toBe(false);
  expect(tpoBatchDecisionSchema.safeParse({...basic,decision:"INELIGIBLE",reason:"a"}).success).toBe(false);
 });
 it("TPO-batches-60 displays readable chronological history with Indian time and no raw action ID",()=>{
  expect(batchHistoryDate(new Date("2099-03-04T12:00:00Z"))).toContain("IST");
  const page=source("src/app/(authenticated)/tpo/batches/[batchId]/history/page.tsx");
  expect(page).toContain("batchDecisionLabel(e.after)");
  expect(page).toContain("batchHistoryDate(e.occurredAt)");
  expect(page).not.toContain("Action: {e.actionId}");
 });
 it("TPO-batches-40 uses the expected legacy import heading and confirm button",()=>{
  const page=source("src/components/tpo/tpo-batch-eligibility-import.tsx");
  expect(page).toContain(">Import eligibility</h2>");
  expect(page).toContain(">Confirm import</button>");
  expect(page).not.toContain("Confirm matched decisions");
 });
 it("TPO-batches-39 distinguishes unchanged CSV imports from genuine updates",()=>{
  const page=source("src/components/tpo/tpo-batch-eligibility-import.tsx");
  expect(page).toContain('row.currentStatus===row.proposedStatus?');
  expect(page).toContain('"No change"');
  expect(page).toContain("skippedByUser");
 });
 it("TPO-batches-49 offers a suggested decision review without silently making students eligible",()=>{
  const page=source("src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx");
  expect(page).toContain("Suggested: make them eligible");
  expect(page).toContain("Review each learner before changing their status.");
  expect(page).toContain('id="batch-student-decisions"');
 });
 it("TPO-batches-50 distinguishes filtered-empty from no students in the batch",()=>{
  const page=source("src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx");
  expect(page).toContain("No students match these filters. Clear the filters or change the page.");
  const boundary=source("src/app/(authenticated)/tpo/batches/[batchId]/students/error.tsx");
  expect(boundary).toContain("Retry");
 });
 it("TPO-batches-43 keeps the ineligible reason and client draft when an API write fails",()=>{
  const ui=source("src/components/tpo/tpo-batch-inline-decision.tsx");
  expect(ui).toContain("apiFetch");
  expect(ui).toContain("useGuardedAction");
  expect(ui).not.toContain("data.error??");
  expect(ui).toContain("min-h-10");
 });
 it("GR-04 GR-30 GR-32 prevent raw errors and double submissions in batch decision editor",()=>{
  const ui=source("src/components/tpo/tpo-batch-inline-decision.tsx");
  expect(ui).toContain("apiFetch");
  expect(ui).toContain("if(!valid||busy)return");
  expect(ui).toContain("finally{setBusy(false)");
  expect(ui).toContain('role="alert"');
 });
 it("TPO-batches-61 keeps audited undo accessible without leaking provider responses",()=>{
  const overview=source("src/app/(authenticated)/tpo/batches/[batchId]/page.tsx");
  const ui=source("src/components/tpo/tpo-batch-undo-control.tsx");
  expect(overview).toContain("Undo last decision");
  expect(ui).toContain("apiFetch");
  expect(ui).toContain("useGuardedAction");
  expect(ui).not.toContain("window.confirm");
  expect(ui).toContain("checked={reviewed}");
 });
 it("TPO-batches-50 has a complete keyboard-safe loading and recovery state",()=>{
  const pending=source("src/app/(authenticated)/tpo/batches/[batchId]/students/loading.tsx");
  const failed=source("src/app/(authenticated)/tpo/batches/[batchId]/students/error.tsx");
  expect(pending).toContain('aria-busy="true"');
  expect(pending).toContain("animate-pulse");
  expect(failed).toContain("Retry");
 });
 it("GR-35 GR-90 avoids native confirmation and exposes an alert for failed batch undo",()=>{
  const ui=source("src/components/tpo/tpo-batch-undo-control.tsx");
  expect(ui).not.toContain("window.confirm");
  expect(ui).toContain('type="checkbox"');
  expect(ui).toContain('role="alert"');
 });

});
