import {describe,it,expect} from "vitest";
import {canActOnEntireTpoView,TPO_BULK_UI_LIMIT} from "@/modules/placements/tpo-bulk-ui-model";
import {tpoBulkPreviewRequestSchema} from "@/modules/placements/tpo-bulk-workflow-model";
describe("TPO-students-03 and TPO-drive-workspace-25 filtered bulk actions",()=>{
 const id=(i:number)=>"00000000-0000-4000-8000-"+String(i).padStart(12,"0");
 it("requires the entire filtered view, not only this page",()=>{
  const rows=[{id:id(1),label:"A"},{id:id(2),label:"B"}];
  expect(canActOnEntireTpoView(2,rows)).toBe(true);
  expect(canActOnEntireTpoView(3,rows)).toBe(false);
  expect(canActOnEntireTpoView(2,[rows[0],rows[0]])).toBe(false);
  expect(canActOnEntireTpoView(201,rows)).toBe(false);
 });
 it("parses up to 200 selected rows, rejects duplicates and cross-target actions",()=>{
  expect(TPO_BULK_UI_LIMIT).toBe(200);
  const req={target:"STUDENTS",action:"ELIGIBLE",ids:Array.from({length:200},(_,i)=>id(i))};
  expect(tpoBulkPreviewRequestSchema.safeParse(req).success).toBe(true);
  expect(tpoBulkPreviewRequestSchema.safeParse({...req,ids:[id(0),id(0)]}).success).toBe(false);
  expect(tpoBulkPreviewRequestSchema.safeParse({...req,ids:Array.from({length:201},(_,i)=>id(i))}).success).toBe(false);
  expect(tpoBulkPreviewRequestSchema.safeParse({...req,action:"SHORTLISTED"}).success).toBe(false);
 });
});
