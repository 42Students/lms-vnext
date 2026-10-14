import {describe,expect,it} from "vitest";
import {parseSuperAdminScopedCsvParams,scopedCsvStatusAllowed,superAdminScopedCsvHref,buildSuperAdminScopedCsv}
 from "@/modules/admin-ui/super-admin-scoped-csv-model";
const statuses=["ALL","SUBMITTED","WITHDRAWN"] as const;
describe("Super Admin Placement Applications CSV export",()=>{
 it("accepts real application states but rejects identity/scope overrides and duplicates",()=>{
  expect(scopedCsvStatusAllowed("SUBMITTED",statuses)).toBe(true);
  expect(scopedCsvStatusAllowed("WITHDRAWN",statuses)).toBe(true);
  expect(scopedCsvStatusAllowed("JOINED",statuses)).toBe(false);
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("collegeId=foreign"))).toThrow();
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("status=SUBMITTED&status=WITHDRAWN"))).toThrow();
 });
 it("preserves role/learner search, formula protection and cap disclosure",()=>{
  const query=parseSuperAdminScopedCsvParams(new URLSearchParams("status=WITHDRAWN&q=Engineering"));
  expect(superAdminScopedCsvHref("/api/admin/placements/applications/export",query))
   .toBe("/api/admin/placements/applications/export?q=Engineering&status=WITHDRAWN");
  const csv=buildSuperAdminScopedCsv([{id:"app1",title:"=HYPERLINK(A1)",subtitle:"Engineer",status:"WITHDRAWN",details:["No private contact"]}],true);
  expect(csv).toContain("EXPORT TRUNCATED");
  expect(csv).toContain("HYPERLINK(A1)");
  expect(csv).toContain("No private contact");
 });
});
