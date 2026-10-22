import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(name:string)=>readFileSync(new URL("../../src/components/courses/"+name+".tsx",import.meta.url),"utf8");
describe("UX-courses-college-catalogue-tables-01 responsive DataTable semantics",()=>{
 it("college assessment grid preserves submit counts, grades, quiz release, review and offering navigation",()=>{
  const src=read("college-assessment-aggregate");
  expect(src).toContain("<DataTable");
  expect(src).toContain("caption={name+\" records\"}");
  expect(src).toContain('mobilePriority:"action"');
  expect(src).toContain('mobilePriority:"primary"');
  expect(src).toContain('item.resultsPublished?"Released":"Withheld"');
  expect(src).toContain("item.submittedLearners");
  expect(src).toContain("item.eligibleLearners");
  expect(src).toContain("item.gradedLearners");
  expect(src).toContain("<CollegeQuizAttempts");
  expect(src).toContain("<CollegeAssignmentReview");
  expect(src).toContain("No assignments found for this college");
  expect(src).not.toContain("<table");
 });
 it("college content grid retains selected-college metadata only, material counts, preview and visibility actions",()=>{
  const src=read("college-content-aggregate");
  expect(src).toContain("<DataTable");
  expect(src).toContain('caption={videos?"Existing Content":"Resources"}');
  expect(src).toContain('mobilePriority:"action"');
  expect(src).toContain("<CollegeContentPreview");
  expect(src).toContain("<CollegeStudentVisibilityControl");
  expect(src).toContain("item.materialsCount");
  expect(src).toContain("item.learningPathStatus");
  expect(src).toContain("No content found for the selected filters.");
  expect(src).not.toContain("<table");
 });
 it("college lesson directory and course progress grid both expose DataTables, lifecycle controls and activity drill-ins",()=>{
  const src=read("college-learning-directory");
  expect((src.match(/<DataTable/g)??[]).length).toBe(2);
  expect(src).toContain('caption="Lesson directory"');
  expect(src).toContain('caption="Recorded course progress"');
  expect(src).toContain('mobilePriority:"action"');
  expect(src).toContain("CollegeArchivedLessonRestore");
  expect(src).toContain("CollegeLessonVisibilityControl");
  expect(src).toContain("View recorded course activity");
  expect(src).toContain("View authored lessons");
  expect(src).not.toContain("<table");
 });
});
