import {describe,it,expect} from "vitest";
import {learnerAssessmentCourseScopeCount} from "@/modules/courses/learner-assessment-course-scope-count-model";
describe("assessment scoped Course count",()=>{
 const courses=[{id:"a"},{id:"b"}];
 it("uses all authorized Courses when unfiltered",()=>expect(learnerAssessmentCourseScopeCount(courses,"")).toBe(2));
 it("counts only selected authorized Course",()=>expect(learnerAssessmentCourseScopeCount(courses,"a")).toBe(1));
 it("does not count forged or stale Course IDs",()=>expect(learnerAssessmentCourseScopeCount(courses,"foreign")).toBe(0));
});
