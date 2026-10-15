import {describe,it,expect} from "vitest";
import {hasCurrentTpoConfigVersion,tpoJobTypeNameSchema,tpoBlockedDaySchema} from "@/modules/placements/tpo-configuration-model";
describe("TPO configuration boundary",()=>{
 it("checks version including absent records",()=>{
  expect(hasCurrentTpoConfigVersion(undefined,"none")).toBe(true);
  expect(hasCurrentTpoConfigVersion(new Date("2026-10-15T00:00:00Z"),"none")).toBe(false);
 });
 it("rejects invalid configuration",()=>{
  expect(tpoJobTypeNameSchema.safeParse("   ").success).toBe(false);
  expect(tpoBlockedDaySchema.safeParse("2026-13-10").success).toBe(false);
 });
});