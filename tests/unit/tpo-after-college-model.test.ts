import { describe, expect, it } from "vitest";
import { AFTER_COLLEGE_OUTCOMES, afterCollegeOutcomeSchema, afterCollegeOptions } from "@/modules/placements/tpo-after-college-model";
describe("fixed after-college destinations",()=>{
 it("has nine distinct student destinations (six manual), not an inferred placement state",()=>{
  expect(afterCollegeOptions()).toHaveLength(6);
  expect(new Set(AFTER_COLLEGE_OUTCOMES).size).toBe(9);
  expect(afterCollegeOutcomeSchema.safeParse("PLACED").success).toBe(false);
  expect(afterCollegeOutcomeSchema.safeParse("NOT_DECIDED").success).toBe(true);
 });
});
