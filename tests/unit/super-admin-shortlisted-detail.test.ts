import {describe,it,expect} from "vitest";
import {readSuperAdminPlacementId,placementDateIst} from "@/modules/admin-ui/super-admin-placement-detail-model";
describe("Super Admin shortlist detail",()=>{
 it("rejects malformed identifiers that could escape selected application",()=>{
  expect(readSuperAdminPlacementId("/../../applications")).toBeNull();
  expect(readSuperAdminPlacementId("00000000-0000-4000-8000-000000000001")).not.toBeNull();
 });
 it("labels a missing screening decision rather than supplying one",()=>{
  expect(placementDateIst(null)).toBe("Not recorded");
 });
});
