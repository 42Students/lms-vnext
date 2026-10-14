import {describe,it,expect} from "vitest";
import {readSuperAdminPlacementId,placementDateIst} from "@/modules/admin-ui/super-admin-placement-detail-model";
describe("Super Admin screening detail",()=>{
 it("rejects missing/invalid identifiers before a lookup",()=>{
  for(const id of [undefined,null,"",["00000000-0000-4000-8000-000000000001"]])
   expect(readSuperAdminPlacementId(id)).toBeNull();
 });
 it("uses IST for a recorded decision, not a made-up time",()=>{
  expect(placementDateIst(null)).toBe("Not recorded");
  expect(placementDateIst(new Date("2026-10-15T09:00:00.000Z"))).toContain("IST");
 });
});
