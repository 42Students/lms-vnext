import {describe,expect,it} from "vitest";
import {parseSuperAdminScopedCsvParams,scopedCsvStatusAllowed,superAdminScopedCsvHref}
 from "@/modules/admin-ui/super-admin-scoped-csv-model";
const statuses=["ALL","ACTIVE","ENDED"] as const;
describe("Super Admin Faculty Assignment CSV export",()=>{
 it("rejects unsupported state, override, repeated status",()=>{
  expect(scopedCsvStatusAllowed("ENDED",statuses)).toBe(true);
  expect(scopedCsvStatusAllowed("WITHDRAWN",statuses)).toBe(false);
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("organizationId=foreign"))).toThrow();
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("status=ACTIVE&status=ENDED"))).toThrow();
 });
 it("preserves teacher search and ENDED filter, never page",()=>{
  const query=parseSuperAdminScopedCsvParams(new URLSearchParams("status=ENDED&q=Professor"));
  expect(superAdminScopedCsvHref("/api/admin/faculty-assignment/export",query))
   .toBe("/api/admin/faculty-assignment/export?q=Professor&status=ENDED");
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("page=3"))).toThrow();
 });
});
