import { describe, expect, it } from "vitest";
import { learnerCourseCardDueLabel } from "@/modules/courses/learner-course-card-due-label-model";
const due={kind:"Quiz" as const,title:"Final",dueAt:"2026-10-20"};
describe("learner course deadline label",()=>{
 it("never advertises a past-term assessment as actionable",()=>{
  expect(learnerCourseCardDueLabel(true,due,()=> "20 Oct")).toBe("Past semester · read only");
 });
 it("keeps real deadlines and handles missing data",()=>{
  expect(learnerCourseCardDueLabel(false,due,()=> "20 Oct")).toContain("Quiz · Final");
  expect(learnerCourseCardDueLabel(false,null,()=> "20 Oct")).toBe("No upcoming due dates");
 });
});
