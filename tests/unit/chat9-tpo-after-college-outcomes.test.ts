import {describe,it,expect} from "vitest";
import {AFTER_COLLEGE_OUTCOMES,AFTER_COLLEGE_LABELS,afterCollegeManualSchema,afterCollegeAllOptions} from "../../src/modules/placements/tpo-after-college-model";
describe("TPO after college reporting",()=>{
 it("TPO-calendar-reports-32 lists all nine destination categories while excluding manual placed and debarred mutations",()=>{
  expect(AFTER_COLLEGE_OUTCOMES).toHaveLength(9);
  expect(afterCollegeAllOptions()).toHaveLength(9);
  expect(AFTER_COLLEGE_LABELS.HIGHER_STUDIES).toBe("Higher studies");
  expect(afterCollegeManualSchema.safeParse("PLACED_ON_CAMPUS").success).toBe(false);
  expect(afterCollegeManualSchema.safeParse("DEBARRED").success).toBe(false);
  expect(afterCollegeManualSchema.safeParse("ENTREPRENEURSHIP").success).toBe(true);
 });
});