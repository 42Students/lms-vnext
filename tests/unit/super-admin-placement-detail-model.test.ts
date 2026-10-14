import {describe,it,expect} from "vitest";
import {placementDateIst,readSuperAdminPlacementId} from "@/modules/admin-ui/super-admin-placement-detail-model";
describe("Super Admin application details",()=>{
 it("accepts only UUID detail IDs; null, malformed and URL escapes are not routes",()=>{
  expect(readSuperAdminPlacementId("00000000-0000-4000-8000-000000000001")).toBe("00000000-0000-4000-8000-000000000001");
  for(const id of ["../other","",null,42,["00000000-0000-4000-8000-000000000001"]])
   expect(readSuperAdminPlacementId(id)).toBeNull();
 });
 it("formats persisted timestamps in IST and does not fake missing dates",()=>{
  expect(placementDateIst(new Date("2026-10-15T04:30:00.000Z"))).toContain("IST");
  expect(placementDateIst(null)).toBe("Not recorded");
 });
});
