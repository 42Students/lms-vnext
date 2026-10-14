import {describe,expect,it} from "vitest";
import {hrDisplayNamePatchSchema,normalizeHrDisplayName,sameHrNameVersion} from "@/modules/placements/hr-display-name-model";
describe("HR self-display-name update",()=>{
 it("normalizes own name and requires a current version",()=>{
  const token="2026-10-14T19:01:02.123Z";
  expect(normalizeHrDisplayName("  Maya    Rao ")).toBe("Maya Rao");
  expect(hrDisplayNamePatchSchema.safeParse({displayName:"Maya Rao",expectedUpdatedAt:token}).success).toBe(true);
  expect(hrDisplayNamePatchSchema.safeParse({displayName:"A",expectedUpdatedAt:token}).success).toBe(false);
  expect(hrDisplayNamePatchSchema.safeParse({displayName:"Maya",expectedUpdatedAt:"bad"}).success).toBe(false);
  expect(hrDisplayNamePatchSchema.safeParse({displayName:"Maya",expectedUpdatedAt:token,companyId:"foreign"}).success).toBe(false);
  expect(sameHrNameVersion(new Date(token),token)).toBe(true);
  expect(sameHrNameVersion(new Date(token),"2026-10-14T19:01:02.122Z")).toBe(false);
 });
});
