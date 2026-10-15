import {describe,expect,it} from "vitest";
import {learnerAssessmentScopedItems} from "@/modules/courses/learner-assessment-scope-attention-model";
describe("Course-scoped assignment and quiz attention",()=>{
 const rows=[{courseId:"course-a",id:"one"},{courseId:"course-b",id:"two"}];
 it("limits quick attention pills to the selected authorized course",()=>{
  expect(learnerAssessmentScopedItems(rows,"course-a").map(x=>x.id)).toEqual(["one"]);
 });
 it("preserves the global aggregation when All courses is selected",()=>{
  expect(learnerAssessmentScopedItems(rows,"")).toHaveLength(2);
 });
});
