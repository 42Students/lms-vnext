import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {createSuperAdminHrInputSchema} from "@/modules/placements/super-admin-hr-validation";
const read=(p:string)=>readFileSync(p,"utf8");
describe("SA-placements-projects-37 free-text company onboarding",()=>{
 it("SA-placements-projects-37 accepts exactly one existing relationship or new company",()=>{
  const id="00000000-0000-4000-8000-000000000001";
  const base={displayName:"Recruiter",phoneE164:"+919876543210"};
  expect(createSuperAdminHrInputSchema.safeParse({...base,companyRelationshipId:id}).success).toBe(true);
  expect(createSuperAdminHrInputSchema.safeParse({...base,newCompany:{name:"Acme",collegeId:id}}).success).toBe(true);
  expect(createSuperAdminHrInputSchema.safeParse(base).success).toBe(false);
  expect(createSuperAdminHrInputSchema.safeParse({...base,companyRelationshipId:id,newCompany:{name:"Acme",collegeId:id}}).success).toBe(false);
 });
 it("SA-placements-projects-37 creates canonical company relationship before granting",()=>{
  const svc=read("src/modules/placements/super-admin-hr-service.ts");
  const create=svc.split("export async function createSuperAdminHrAccount")[1]?.split("export async function updateSuperAdminHrAccount")[0]??"";
  expect(create).toContain("createPlacementCompany(context");
  expect(create).toContain("input.newCompany.collegeId");
  expect(create).toContain("requireHrCollege(");
  expect(create).toContain("selectedRelationships");
  expect(create.indexOf("if(input.newCompany && input.companyRelationshipIds?.length)")).toBeLessThan(create.indexOf("createPlacementCompany(context"));
 });
 it("SA-placements-projects-37 shows company entry and college options, keeping failures retryable",()=>{
  const dialog=read("src/components/admin/super-admin-hr-account-dialog.tsx");
  for(const str of ["Create a company by name","Company name","First college","Company domain (optional)"])
   expect(dialog).toContain(str);
  expect(dialog).toContain("colleges.map");
  expect(read("src/app/api/admin/hr/options/route.ts")).toContain("listSuperAdminHrColleges");
 });
});
