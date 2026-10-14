import {describe,it,expect} from "vitest";
import {readSuperAdminPlacementId,placementDateOnly} from "@/modules/admin-ui/super-admin-placement-detail-model";
describe("Super Admin placement season detail model",()=>{
 it("rejects foreign crafted strings and arrays as record identifiers",()=>{
  for(const candidate of ["../seasons","",["20000000-0000-4000-8000-000000000001"]])
   expect(readSuperAdminPlacementId(candidate)).toBeNull();
 });
 it("preserves DB date values as dates and reports missing values explicitly",()=>{
  expect(placementDateOnly("2026-09-30")).toBe("2026-09-30");
  expect(placementDateOnly(null)).toBe("Not recorded");
 });
});
