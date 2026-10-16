import {describe,it,expect} from "vitest";
import {collegeBulkImportToast} from "@/modules/colleges/bulk-import-feedback-model";
describe("SA-tenants-modules-15 Bulk Import partial-success toast",()=>{
 it("reports every created/skipped/failed row explicitly",()=>{
  expect(collegeBulkImportToast([
   {status:"CREATED"},{status:"SKIPPED"},{status:"FAILED"},
  ])).toEqual({title:"1 college created; 1 skipped; 1 failed",tone:"error"});
 });
 it("distinguishes all-success and all-skipped",()=>{
  expect(collegeBulkImportToast([{status:"CREATED"}]).tone).toBe("success");
  expect(collegeBulkImportToast([{status:"SKIPPED"}]).tone).toBe("error");
 });
});
