import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {facultyAssignmentMethodsChanged,facultyAssignmentEditLockedBySubmissions}
 from "@/modules/courses/faculty-assignment-authoring-model";
import {facultyReportIsIncomplete} from "@/modules/courses/faculty-report-completeness";

const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("chat-7 last gaps: faculty assessment behavior",()=>{
 it("FAC-assessments-15: submitted work locks true field changes but permits title-only corrections",()=>{
  expect(facultyAssignmentMethodsChanged(["WRITTEN_RESPONSE","PDF_UPLOAD"],
   ["PDF_UPLOAD","WRITTEN_RESPONSE"])).toBe(false);
  expect(facultyAssignmentMethodsChanged(["WRITTEN_RESPONSE"],["PDF_UPLOAD"])).toBe(true);
  expect(facultyAssignmentEditLockedBySubmissions(["title"],true)).toBe(false);
  expect(facultyAssignmentEditLockedBySubmissions(["title","dueAt"],true)).toBe(true);
  expect(facultyAssignmentEditLockedBySubmissions(["maxPoints"],true)).toBe(true);
  expect(facultyAssignmentEditLockedBySubmissions(["allowedMethods"],true)).toBe(true);
  expect(facultyAssignmentEditLockedBySubmissions(["dueAt"],false)).toBe(false);
  const service=source("src/modules/courses/faculty-assignment-authoring-service.ts");
  const overview=source("src/modules/courses/faculty-assessment-service.ts");
  const editor=source("src/components/courses/faculty-assessment-editor.tsx");
  expect(service).toContain("facultyAssignmentMethodsChanged(current.allowedSubmissionMethods,input.allowedMethods)");
  expect(service).toContain('throw new CoursesServiceError("ASSIGNMENT_HAS_SUBMISSIONS")');
  expect(overview).toContain("submittedIds.has(item.id)");
  expect(editor).toContain('const titleOnly = assessment.kind==="ASSIGNMENT" && assessment.hasSubmissions===true');
  expect(editor).toContain("...(titleOnly?{}:{");
  expect(editor).toContain("disabled={titleOnly}");
  expect(editor).toContain("Learner submissions exist. Deadline, points, audience, resources and submission methods are locked.");
 });
 it("FAC-assessments-25: due or created timestamps and course lesson scope information are shown",()=>{
  const ui=source("src/components/courses/faculty-assessment-overview.tsx");
  expect(ui).toContain("Created: ");
  expect(ui).toContain("formatDate(item.createdAt)");
  expect(ui).toContain("Due date: ");
  expect(ui).toContain("formatDate(item.dueAt)");
  expect(ui).toContain("Course: {item.courseName} · Lesson: {item.lessonName}");
  expect(ui).toContain("item.sectionName");
  expect(ui).toContain("Needs due date");
  expect(ui).toContain("Draft · hidden from students");
 });
 it("FAC-assessments-26: drafts and published assignments link to a real review with empty state",()=>{
  const ui=source("src/components/courses/faculty-assessment-overview.tsx");
  const report=source("src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx");
  const drawer=source("src/components/courses/faculty-assignment-review.tsx");
  expect(ui).toContain("View submissions");
  expect(ui).toContain('encodeURIComponent(item.deliveryId)}#submissions');
  expect(report).toContain('id="submissions"');
  expect(report).toContain("No one has submitted this assignment yet.");
  expect(report).toContain("<FacultyAssignmentReview");
  expect(drawer).toContain('if(status==="DRAFT")return');
  expect(drawer).toContain("No submissions yet. Publish this assignment to allow students to submit work.");
  expect(drawer).toContain("View submissions");
 });
 it("FAC-assessments-28: incomplete PDF must be confirmed and marked, complete report is immediate",()=>{
  expect(facultyReportIsIncomplete({kind:"quiz",eligibleLearners:8,submittedLearners:8,questionCount:4})).toBe(false);
  expect(facultyReportIsIncomplete({kind:"quiz",eligibleLearners:8,submittedLearners:7,questionCount:4})).toBe(true);
  expect(facultyReportIsIncomplete({kind:"quiz",eligibleLearners:0,submittedLearners:0,questionCount:4})).toBe(true);
  expect(facultyReportIsIncomplete({kind:"assignment",eligibleLearners:6,submitted:6,graded:6})).toBe(false);
  expect(facultyReportIsIncomplete({kind:"assignment",eligibleLearners:6,submitted:6,graded:5})).toBe(true);
  expect(facultyReportIsIncomplete({kind:"assignment",eligibleLearners:6,submitted:4,graded:4})).toBe(true);
  const download=source("src/components/courses/faculty-report-download.tsx");
  const quiz=source("src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx");
  const assignment=source("src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx");
  expect(download).toContain('title="This report is incomplete"');
  expect(download).toContain('confirmLabel="Download marked incomplete"');
  expect(download).toContain("if(props.incomplete)");
  expect(download).toContain('summary:incomplete?["This report is incomplete",...reportData.summary]');
  expect(quiz).toContain('incomplete={facultyReportIsIncomplete({kind:"quiz"');
  expect(assignment).toContain('incomplete={facultyReportIsIncomplete({kind:"assignment"');
  for(const heading of ["Question accuracy","Worst-answered first.","Student scores","Score distribution"])
   expect(quiz).toContain(heading);
  for(const heading of ["Submission timing","Score distribution","Student scores"])
   expect(assignment).toContain(heading);
 });
});
