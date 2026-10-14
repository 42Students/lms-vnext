import {describe,it,expect} from "vitest";
import {readSuperAdminPlacementId,placementDateIst} from "@/modules/admin-ui/super-admin-placement-detail-model";
describe("Super Admin interview detail ID and safe schedule",()=>{
 it("rejects invalid identifiers before DB read",()=>{
  expect(readSuperAdminPlacementId("not-a-uuid")).toBeNull();
  expect(readSuperAdminPlacementId(["00000000-0000-4000-8000-000000000001"])).toBeNull();
 });
 it("uses IST for schedule and explicit missing data",()=>{
  expect(placementDateIst(new Date("2026-10-15T04:30:00Z"))).toContain("IST");
  expect(placementDateIst(undefined)).toBe("Not recorded");
 });
});
