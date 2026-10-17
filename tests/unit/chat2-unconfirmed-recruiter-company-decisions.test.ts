import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const src=(p:string)=>readFileSync(p,"utf8");
describe("TPO recruiter and company ambiguous permissions and deployment gates",()=>{
 it("TPO-recruiters-34 requires the scoped central placements.manage permission for recruiter lead mutation",()=>{
  const page=src("src/app/(authenticated)/tpo/recruiters/page.tsx");
  const writes=src("src/modules/placements/tpo-bulk-lead-stage-service.ts");
  expect(page).toContain('can(context,"placements.manage",{collegeId:context.membership.collegeId})');
  expect(writes).toContain('requirePermission(context, "placements.manage", { collegeId })');
  expect(writes).toContain("requirePlacementManageScope(context, collegeId)");
 });
 it("TPO-companies-04 never auto-approves a recruiter request solely for a Trusted label",()=>{
  const service=src("src/modules/placements/recruiter-drive-request-service.ts");
  expect(service).toContain("recruiterDriveApprovalPolicy({");
  expect(service).toContain('grantVerified:scope.grant.verificationStatus==="VERIFIED"');
  expect(service).toContain("if(policy.autoApprove)");
  const policy=src("src/modules/placements/recruiter-drive-autoapproval-policy.ts");
  expect(policy).toContain('if(!input.grantVerified)return {autoApprove:false,reason:"REVIEW_REQUIRED"}');
  expect(policy).toContain("trustedRecruiterDomain(input.recruiterEmail");
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
  expect(page).toContain('can(context,"placements.manage",{collegeId:context.membership.collegeId})');
  expect(details).toContain("requirePlacementManageScope(context, collegeId)");
 });
});