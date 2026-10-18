import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {effectiveCourseContentVisibleToStudents} from "@/modules/courses/super-admin-content-directory-model";
const baseline={
 status:"PUBLISHED",visibleToStudents:true,lessonStatus:"ACTIVE",
 learningPathStatus:"PUBLISHED",offeringStatus:"ACTIVE",courseStatus:"ACTIVE",
};
describe("SA-academics-people-62 effective student content visibility",()=>{
 it("shows Students Visible only when the complete Course ancestry is active and published",()=>{
  expect(effectiveCourseContentVisibleToStudents(baseline)).toBe(true);
  for(const condition of [
   {status:"DRAFT"},{status:"ARCHIVED"},{visibleToStudents:false},
   {lessonStatus:"ARCHIVED"},{learningPathStatus:"DRAFT"},
   {learningPathStatus:"ARCHIVED"},{offeringStatus:"ARCHIVED"},
   {courseStatus:"ARCHIVED"},
  ])expect(effectiveCourseContentVisibleToStudents({...baseline,...condition})).toBe(false);
 });
 it("reads live learning path and parent Course status in the selected-college query",()=>{
  const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
  const service=read("src/modules/courses/super-admin-content-directory-service.ts");
  const page=read("src/components/courses/super-admin-content-directory-page.tsx");
  expect(service).toContain('learningPathStatus:aliased(courseLearningPaths.status,"admin_learning_path_status")');
  expect(service).toContain('courseStatus:aliased(courses.status,"admin_course_status")');
  expect(service).toContain("eq(departments.collegeId,collegeId)");
  expect(page).toContain("effectiveCourseContentVisibleToStudents(item)");
  expect(page).toContain("Students {studentContentVisible(item)?\"Visible\":\"Hidden\"}");
 });
});
