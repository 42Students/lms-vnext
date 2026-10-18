import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {facultyAssignmentEditLockedBySubmissions,assignmentFieldsChanged}
 from "@/modules/courses/faculty-assignment-authoring-model";

const source=(path:string)=>readFileSync(path,"utf8");

describe("chat-15 final sprint: faculty assessments audit decision verification",()=>{
 it("FAC-assessments-15 NOT-A-GAP: submission locks every field except title",()=>{
  const original={title:"Original",description:"Details",dueAt:new Date("2099-01-01T10:00:00.000Z"),maxPoints:100};
  const unchanged={title:original.title,description:original.description,
   dueAt:original.dueAt.toISOString(),maxPoints:original.maxPoints};
  expect(assignmentFieldsChanged(original,unchanged)).toEqual([]);
  expect(facultyAssignmentEditLockedBySubmissions(["title"],true)).toBe(false);
  for(const field of ["description","dueAt","maxPoints","allowedMethods"]){
   expect(facultyAssignmentEditLockedBySubmissions([field],true)).toBe(true);
   expect(facultyAssignmentEditLockedBySubmissions(["title",field],true)).toBe(true);
   expect(facultyAssignmentEditLockedBySubmissions([field],false)).toBe(false);
  }
  const service=source("src/modules/courses/faculty-assignment-authoring-service.ts");
  expect(service).toContain("facultyAssignmentEditLockedBySubmissions(changedFields,Boolean(submission))");
 });
 it("FAC-assessments-25 NOT-A-GAP: overview shows course, lesson, due-date and draft visibility",()=>{
  const overview=source("src/components/courses/faculty-assessment-overview.tsx");
  for(const label of ["Course: {item.courseName}","Lesson: {item.lessonName}",
   "Needs due date","Draft · hidden from students","Created:"]){
   expect(overview).toContain(label);
  }
 });
 it("FAC-assessments-26 NOT-A-GAP: a draft still has an explicit zero-submission review",()=>{
  const review=source("src/components/courses/faculty-assignment-review.tsx");
  expect(review).toContain('if(status==="DRAFT")');
  expect(review).toContain("No submissions yet. Publish this assignment");
  expect(review).not.toContain("Published assignments cannot be edited");
 });
 it("FAC-assessments-28 NOT-A-GAP: both report types retain legacy sections and guarded incomplete PDF",()=>{
  const assignment=source("src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx");
  const quiz=source("src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx");
  const pdf=source("src/components/courses/faculty-report-download.tsx");
  for(const heading of ["Score distribution","Submission timing","Student scores"])
   expect(assignment).toContain(heading);
  for(const heading of ["Question accuracy","Score distribution","Student scores"])
   expect(quiz).toContain(heading);
  for(const text of ["Download PDF","This report is incomplete","Download marked incomplete"])
   expect(pdf).toContain(text);
 });
});
