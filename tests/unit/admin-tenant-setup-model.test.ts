import {describe,expect,it} from "vitest";
import {tenantSetupQuerySchema,tenantSetupPresentation} from "@/modules/colleges/admin-tenant-setup-model";
describe("Super Admin tenant setup stages",()=>{
 it("disables creation when a college is selected even if caller can create globally",()=>{
  expect(tenantSetupPresentation({tab:"create",selectedCollegeId:"college",canCreateCollege:true,canCreateOrganization:true}))
   .toMatchObject({canCreateCollege:false,canCreateOrganization:false});
 });
 it("requires an explicit college to inspect setup and rejects invented tabs",()=>{
  expect(tenantSetupPresentation({tab:"setup",selectedCollegeId:null,canCreateCollege:true,canCreateOrganization:true}).requiresCollege).toBe(true);
  expect(tenantSetupQuerySchema.safeParse({tab:"delete"}).success).toBe(false);
 });
});
