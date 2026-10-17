import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const src=(p:string)=>readFileSync(p,"utf8");
describe("TPO recruiter and company ambiguous permissions and deployment gates",()=>{
 it("TPO-recruiters-34 requires an active TPO role for recruiter lead mutation, rather than broad college-admin membership alone",()=>{
  const page=src("src/app/(authenticated)/tpo/recruiters/page.tsx");
  const writes=src("src/modules/placements/tpo-bulk-lead-stage-service.ts");
  expect(page).toContain('hasMembershipRole(context, "TPO")');
  expect(writes).toContain('hasMembershipRole(context, "TPO")');
 });
 it("TPO-companies-04 never auto-approves a recruiter request solely for a Trusted label",()=>{
  const service=src("src/modules/placements/recruiter-drive-request-service.ts");
  expect(service).toContain("No auto-approval until the shared TPO-side policy is registered");
  expect(service).not.toContain("isTrusted ? \"APPROVED\"");
 });
 it("TPO-companies-25 checks actual registered CRM tables instead of an unrelated deployment flag",()=>{
  for(const path of [
   "src/app/api/placements/tpo/companies/route.ts",
   "src/app/api/placements/tpo/companies/detail/route.ts",
   "src/app/api/placements/tpo/companies/[companyId]/people/route.ts"]){
   const route=src(path);
   expect(route).toContain('placementTableExists("placement_tpo_leads")');
   expect(route).toContain('placementTableExists("placement_tpo_lead_activities")');
   expect(route).not.toContain('DB09_TPO_API_READY');
  }
 });
 it("TPO-companies-R03 keeps company edit access constrained by the scoped TPO permission",()=>{
  const page=src("src/app/(authenticated)/tpo/companies/page.tsx");
  const details=src("src/modules/placements/tpo-company-memory-service.ts");
  expect(page).toContain('hasMembershipRole(context, "TPO")');
  expect(details).toContain("requirePlacementManageScope(context, collegeId)");
 });
});