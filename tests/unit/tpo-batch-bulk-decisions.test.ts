import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoBulkPreviewRequestSchema,tpoBulkActionLabel} from "@/modules/placements/tpo-bulk-workflow-model";
const id="11111111-1111-4111-8111-111111111111";
describe("TPO-batches-32 preview/confirm batch bulk actions",()=>{
 it("permits ineligible only with a meaningful reason and forbids arbitrary student free text",()=>{
  expect(tpoBulkPreviewRequestSchema.safeParse({
   target:"STUDENTS",action:"INELIGIBLE",note:"No verified eligibility",ids:[id],
  }).success).toBe(true);
  expect(tpoBulkPreviewRequestSchema.safeParse({
   target:"STUDENTS",action:"INELIGIBLE",note:"",ids:[id],
  }).success).toBe(false);
  expect(tpoBulkPreviewRequestSchema.safeParse({
   target:"STUDENTS",action:"INELIGIBLE",note:"x".repeat(201),ids:[id],
  }).success).toBe(false);
  expect(tpoBulkPreviewRequestSchema.safeParse({
   target:"STUDENTS",action:"ELIGIBLE",note:"unexpected text",ids:[id],
  }).success).toBe(false);
  expect(tpoBulkActionLabel("INELIGIBLE")).toBe("Mark learners ineligible");
 });
 it("wires batch rows into existing audited signed-preview mutation path",()=>{
  const page=readFileSync("src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx","utf8");
  const confirm=readFileSync("src/modules/placements/tpo-bulk-action-confirm-service.ts","utf8");
  expect(page).toContain("<TpoBulkActionPanel");
  expect(page).toContain("target=\"STUDENTS\"");
  expect(confirm).toContain('plan.action==="INELIGIBLE"');
  expect(confirm).toContain("decideTpoLearnerParticipation");
 });
});
