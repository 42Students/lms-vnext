import {describe,expect,it} from "vitest";
import {parseSuperAdminScopedCsvParams,scopedCsvStatusAllowed,superAdminScopedCsvHref}
 from "@/modules/admin-ui/super-admin-scoped-csv-model";
const statuses=["ALL","ACTIVE","INACTIVE"] as const;
describe("Super Admin Semester–Course Mapping CSV export",()=>{
 it("only accepts term active/inactive; rejects caller tenant and duplicates",()=>{
  expect(scopedCsvStatusAllowed("ACTIVE",statuses)).toBe(true);
  expect(scopedCsvStatusAllowed("INACTIVE",statuses)).toBe(true);
  expect(scopedCsvStatusAllowed("WITHDRAWN",statuses)).toBe(false);
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("collegeId=foreign"))).toThrow();
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("q=one&q=two"))).toThrow();
 });
 it("keeps the current mapping filters without caller paging override",()=>{
  const query=parseSuperAdminScopedCsvParams(new URLSearchParams("status=ACTIVE&q=Calculus"));
  expect(superAdminScopedCsvHref("/api/admin/semester-courses/export",query))
   .toBe("/api/admin/semester-courses/export?q=Calculus&status=ACTIVE");
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("page=2"))).toThrow();
 });
});
