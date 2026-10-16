import {describe,it,expect} from "vitest";
import {collegeBulkImportToast} from "@/modules/colleges/bulk-import-feedback-model";
import {readFileSync} from "node:fs";
describe("SA-tenants-modules-15 import result union",()=>{
 it("uses a finite status union accepted by partial-success toast",()=>{
  const source=readFileSync(new URL("../../src/components/admin/college-bulk-import.tsx",import.meta.url),"utf8");
  expect(source).toContain('status:"CREATED"|"SKIPPED"|"FAILED"');
  expect(collegeBulkImportToast([{status:"CREATED"},{status:"FAILED"}]).tone).toBe("error");
 });
});