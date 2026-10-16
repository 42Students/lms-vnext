import {describe,it,expect} from "vitest";
import {tpoBulkPreviewRequestSchema} from "@/modules/placements/tpo-bulk-workflow-model";
import {tpoBulkApplicationReady} from "@/modules/placements/tpo-bulk-decision-model";
describe("TPO-drive-workspace-25 bulk private notes",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 it("requires job, note and signed preview for an applicant note",()=>{
  const input={target:"APPLICATIONS",jobId:id,action:"ADD_NOTE",ids:[id],note:"Private TPO review context"};
  expect(tpoBulkPreviewRequestSchema.safeParse(input).success).toBe(true);
  expect(tpoBulkPreviewRequestSchema.safeParse({...input,jobId:undefined}).success).toBe(false);
  expect(tpoBulkPreviewRequestSchema.safeParse({...input,note:"short"}).success).toBe(false);
 });
 it("allows notes for submitted applications even with no screening row, denies withdrawal",()=>{
  expect(tpoBulkApplicationReady("ADD_NOTE","PUBLISHED","SUBMITTED",null,null)).toBe(true);
  expect(tpoBulkApplicationReady("ADD_NOTE","CLOSED","SUBMITTED","SHORTLISTED",null)).toBe(true);
  expect(tpoBulkApplicationReady("ADD_NOTE","PUBLISHED","WITHDRAWN",null,null)).toBe(false);
  expect(tpoBulkApplicationReady("ADD_NOTE","DRAFT","SUBMITTED",null,null)).toBe(false);
 });
});
