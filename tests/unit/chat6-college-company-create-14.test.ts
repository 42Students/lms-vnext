import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {createPlacementCompanyInputSchema} from "@/modules/placements/validation";
const src=(p:string)=>readFileSync(p,"utf8");
const id="11111111-1111-4111-8111-111111111111";
describe("College Admin company identity creation",()=>{
 it("COL-placements-14 allows safe company creation in college context, never silently granting a foreign college",()=>{
  const parsed=createPlacementCompanyInputSchema.safeParse({
   collegeId:id,name:"Acme",primaryDomain:"acme.example",isTrusted:false,
  });
  expect(parsed.success).toBe(true);
  expect(createPlacementCompanyInputSchema.safeParse({
   collegeId:"not-a-uuid",name:"Acme",
  }).success).toBe(false);
  const route=src("src/app/api/placements/companies/route.ts");
  const service=src("src/modules/placements/company-service.ts");
  const ui=src("src/components/placements/college-company-create.tsx");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(service).toContain("requirePlacementManageScope(context, input.collegeId)");
  expect(service).toContain("PLACEMENT_COMPANY_IDENTITY_CONFLICT");
  expect(ui).toContain("Add company");
  expect(ui).toContain("apiFetch");
  expect(ui).toContain("useGuardedAction");
  expect(ui).not.toContain("window.confirm");
  expect(src("src/app/(authenticated)/college/companies/page.tsx"))
    .toContain("<CollegeCompanyCreate collegeId={collegeId}/>");
 });
 it("COL-placements-14 keeps global shared company fields Super Admin controlled",()=>{
  const ui=src("src/components/placements/placement-employer-relationships.tsx");
  expect(ui).toContain("Relationship owner");
  expect(ui).toContain("Trusted employer relationship");
  expect(src("src/components/admin/super-admin-company-edit.tsx")).toContain("Edit global company");
 });
});
