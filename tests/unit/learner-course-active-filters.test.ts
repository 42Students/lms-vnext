import { describe, it, expect } from "vitest";
import { learnerCourseHasActiveFilters } from "@/modules/courses/learner-course-active-filters-model";
const base = {query:"",typeFilter:"all",continueOnly:false,progressFilter:"ALL",termState:"ALL",sortMode:"NAME"} as const;
describe("learner Course filter recovery", () => {
  it("does not offer Clear when only semester is chosen", () => {expect(learnerCourseHasActiveFilters(base)).toBe(false);});
  it("detects each applied filter and sorting choice", () => {
    for(const filters of [{query:" instructor "},{typeFilter:"elective"},{continueOnly:true},{progressFilter:"COMPLETED"},{termState:"HISTORY"},{sortMode:"DUE"}] as const) {
      expect(learnerCourseHasActiveFilters({...base,...filters})).toBe(true);
    }
  });
  it("ignores whitespace-only search", () => {expect(learnerCourseHasActiveFilters({...base,query:"  "})).toBe(false);});
});
