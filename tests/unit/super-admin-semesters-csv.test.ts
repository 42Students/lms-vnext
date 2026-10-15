import {describe,expect,it} from "vitest";
import {parseSuperAdminScopedCsvParams,scopedCsvStatusAllowed,superAdminScopedCsvHref}
 from "@/modules/admin-ui/super-admin-scoped-csv-model";
const statuses=["ALL","ACTIVE","INACTIVE"] as const;
describe("Super Admin Semesters CSV export",()=>{
 it("respects active and inactive only; denies caller scope filters",()=>{
  expect(scopedCsvStatusAllowed("ACTIVE",statuses)).toBe(true);
  expect(scopedCsvStatusAllowed("INACTIVE",statuses)).toBe(true);
  expect(scopedCsvStatusAllowed("WITHDRAWN",statuses)).toBe(false);
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("organizationId=other"))).toThrow();
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("status=ACTIVE&status=INACTIVE"))).toThrow();
 });
 it("keeps search and status but rejects page controls",()=>{
  const query=parseSuperAdminScopedCsvParams(new URLSearchParams("status=INACTIVE&q=First%20year"));
  expect(superAdminScopedCsvHref("/api/admin/semesters/export",query))
   .toBe("/api/admin/semesters/export?q=First+year&status=INACTIVE");
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("page=999"))).toThrow();
 });
});
