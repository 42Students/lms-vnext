import {describe,it,expect} from "vitest";
import {readSuperAdminPlacementId,placementDateOnly,placementDateIst} from "@/modules/admin-ui/super-admin-placement-detail-model";
describe("Super Admin joining outcome drill-in",()=>{
 it("uses scoped offer UUID rather than status or applicant identifiers",()=>{
  expect(readSuperAdminPlacementId("JOINED")).toBeNull();
  expect(readSuperAdminPlacementId("00000000-0000-4000-8000-000000000001")).toBeTruthy();
 });
 it("distinguishes an absent joining date from a real registered date",()=>{
  expect(placementDateOnly(undefined)).toBe("Not recorded");
  expect(placementDateOnly("2026-10-21")).toBe("2026-10-21");
  expect(placementDateIst(null)).toBe("Not recorded");
 });
});
