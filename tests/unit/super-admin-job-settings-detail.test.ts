import {describe,it,expect} from "vitest";
import {readSuperAdminPlacementId,placementDateIst} from "@/modules/admin-ui/super-admin-placement-detail-model";
describe("Super Admin job settings detail model",()=>{
 it("requires UUID and never accepts query flags as ID",()=>{
  expect(readSuperAdminPlacementId("all")).toBeNull();
  expect(readSuperAdminPlacementId("00000000-0000-4000-8000-000000000001")).toBeTruthy();
 });
 it("keeps unset deadline and missing policy distinct from time zero",()=>{
  expect(placementDateIst(undefined)).toBe("Not recorded");
  expect(placementDateIst(new Date("2026-10-15T00:00:00.000Z"))).toContain("IST");
 });
});
