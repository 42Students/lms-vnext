import {describe,expect,it} from "vitest";
import {tpoBulkPreviewRequestSchema,selectedBulkActionRows,tpoBulkConfirmRequestSchema} from "@/modules/placements/tpo-bulk-workflow-model";
const id="11111111-1111-4111-8111-111111111111";
describe("TPO bulk workflow boundaries",()=>{
 it("rejects mixing student and applicant actions",()=>{
  expect(tpoBulkPreviewRequestSchema.safeParse({target:"STUDENTS",action:"REJECTED",note:"reason",ids:[id]}).success).toBe(false);
  expect(tpoBulkPreviewRequestSchema.safeParse({target:"APPLICATIONS",action:"REJECTED",jobId:id,note:"short",ids:[id]}).success).toBe(false);
  expect(tpoBulkPreviewRequestSchema.safeParse({target:"APPLICATIONS",action:"SHORTLISTED",jobId:id,note:"Reviewed candidate",ids:[id]}).success).toBe(true);
 });
 it("rejects duplicate rows and oversized selections",()=>{
  expect(tpoBulkPreviewRequestSchema.safeParse({target:"STUDENTS",action:"ELIGIBLE",ids:[id,id]}).success).toBe(false);
  expect(tpoBulkPreviewRequestSchema.safeParse({target:"STUDENTS",action:"ELIGIBLE",ids:Array(26).fill(id)}).success).toBe(false);
 });
 it("never copies a selected learner name into the preview",()=>{
  const rows=selectedBulkActionRows([id],new Map([[id,{version:"v1",ready:true}]]));
  expect(rows).toEqual([{id,version:"v1",label:"Selected row 1",status:"ready",reason:null}]);
  expect(JSON.stringify(rows)).not.toContain("Learner Name");
 });
 it("requires confirmation and an issued preview token",()=>{
  expect(tpoBulkConfirmRequestSchema.safeParse({target:"STUDENTS",action:"ELIGIBLE",selections:[{id,version:"v1"}],previewToken:"",confirmed:true}).success).toBe(false);
 });
});
