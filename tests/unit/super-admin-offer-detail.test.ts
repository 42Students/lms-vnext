import {describe,it,expect} from "vitest";
import {readSuperAdminPlacementId,placementDateOnly} from "@/modules/admin-ui/super-admin-placement-detail-model";
describe("Super Admin offer drill-in model",()=>{
 it("rejects untrusted IDs",()=>{
  expect(readSuperAdminPlacementId("not-uuid")).toBeNull();
  expect(readSuperAdminPlacementId("00000000-0000-4000-8000-000000000001")).not.toBeNull();
 });
 it("does not manufacture an offer joining date",()=>{
  expect(placementDateOnly(null)).toBe("Not recorded");
  expect(placementDateOnly("2026-10-15")).toBe("2026-10-15");
 });
});
