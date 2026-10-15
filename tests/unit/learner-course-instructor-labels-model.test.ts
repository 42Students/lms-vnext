import { describe, expect, it } from "vitest";
import { learnerCourseInstructorLabels } from "@/modules/courses/learner-course-instructor-labels-model";
describe("learner course instructor list", () => {
  it("deduplicates one membership's repeated teaching records", () => {
    expect(learnerCourseInstructorLabels([
      {membershipId:"a",name:" Dr Rao "},{membershipId:"a",name:"Dr Rao"},
      {membershipId:"b",name:"Dr Rao"},
    ])).toEqual(["Dr Rao","Dr Rao"]);
  });
  it("has a truthful fallback for absent instructor names", () => {
    expect(learnerCourseInstructorLabels([{membershipId:"c",name:null}])).toEqual(["Instructor"]);
  });
});
