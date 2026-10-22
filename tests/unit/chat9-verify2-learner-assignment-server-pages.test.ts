import {describe,expect,it} from "vitest";
import {learnerAssignmentListPage,learnerAssignmentListHref} from "@/modules/courses/learner-assignment-page-model";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/learn/allAssignments/page.tsx"),"utf8");
describe("Learner assignment 20-row server pagination",()=>{
 it("rejects invalid page query values instead of widening the authorized list",()=>{
  for(const input of [-1,0,1.2,"0","1x","10001",["1"],null,""])expect(learnerAssignmentListPage(input)).toBeNull();
  expect(learnerAssignmentListPage(undefined)).toBe(1);
  expect(learnerAssignmentListPage("20")).toBe(20);
  expect(learnerAssignmentListPage("10000")).toBe(10000);
 });
 it("preserves only the authorized course selector between pages",()=>{
  const id="11111111-1111-4111-8111-111111111111";
  expect(learnerAssignmentListHref(1,null)).toBe("/learn/allAssignments");
  expect(learnerAssignmentListHref(2,null)).toBe("/learn/allAssignments?page=2");
  expect(learnerAssignmentListHref(3,id)).toBe("/learn/allAssignments?course="+id+"&page=3");
 });
 it("uses SQL-paged service rather than loading all assignments before slicing",()=>{
  expect(source).toContain("getLearnerAssessmentOverview(context, { courseId: query.course,page,pageSize:20 })");
  expect(source).toContain("overview.pagination?.totals.assignments");
  expect(source).toContain('aria-label="Assignment list pages"');
  expect(source).toContain("Search, state and sort controls apply to the assignments on this page.");
  expect(source).toContain("if(page===null)notFound()");
 });
});
