import {describe,it,expect} from "vitest";
import {resolveLearnerCourseTypeFilter} from "@/modules/courses/learner-course-type-availability-model";
describe("learner Course type availability",()=>{
  it("recovers a hidden elective filter when no authorized electives remain",()=>{
    expect(resolveLearnerCourseTypeFilter("elective",8,0)).toBe("all");
    expect(resolveLearnerCourseTypeFilter("core",0,5)).toBe("all");
  });
  it("preserves an actionable filter where the selected type is available",()=>{
    expect(resolveLearnerCourseTypeFilter("elective",3,2)).toBe("elective");
    expect(resolveLearnerCourseTypeFilter("core",3,2)).toBe("core");
    expect(resolveLearnerCourseTypeFilter("all",3,2)).toBe("all");
  });
});
