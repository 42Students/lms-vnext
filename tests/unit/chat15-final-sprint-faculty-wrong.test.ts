import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const src=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-15 final sprint: faculty audit decisions grounded in current code",()=>{
 it("FAC-assessments-15 WRONG: submitted assignments cannot move deadlines or points; title correction remains possible",()=>{
  const service=src("src/modules/courses/faculty-assignment-authoring-service.ts");
  const model=src("src/modules/courses/faculty-assignment-authoring-model.ts");
  const editor=src("src/components/courses/faculty-assessment-editor.tsx");
  expect(service).toContain("facultyAssignmentEditLockedBySubmissions(changedFields,Boolean(submission))");
  expect(service).toContain('throw new CoursesServiceError("ASSIGNMENT_HAS_SUBMISSIONS")');
  expect(service).toContain('sql`date_trunc(\'milliseconds\'');
  expect(model).toContain("facultyAssignmentEditLockedBySubmissions");
  expect(editor).toContain("Learner submissions exist. Deadline, points, audience, resources and submission methods are locked. You can still correct the title.");
 });
 it("FAC-assessments-25 WRONG: course, section, lesson, due-state and hidden draft are present",()=>{
  const ui=src("src/components/courses/faculty-assessment-overview.tsx");
  for(const phrase of ["Course: {item.courseName}","Lesson: {item.lessonName}","Needs due date",
   "Draft · hidden from students","item.sectionName","item.dueAt"])
   expect(ui).toContain(phrase);
 });
 it("FAC-assessments-26 WRONG: every assessment links to its report, even without submissions",()=>{
  const ui=src("src/components/courses/faculty-assessment-overview.tsx");
  expect(ui).toContain("View Report");
  expect(ui).toContain('/teacher/report/${item.kind === "QUIZ" ? "quiz" : "assignment"}');
  const assignment=src("src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx");
  expect(assignment).toContain("View submissions");
  expect(assignment).toContain('No one has submitted this assignment yet.');
 });
 it("FAC-assessments-28 WRONG: distinct quiz and assignment report sections have the requested copy",()=>{
  const quiz=src("src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx");
  const assignment=src("src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx");
  const download=src("src/components/courses/faculty-report-download.tsx");
  for(const phrase of ["Question accuracy","Worst-answered first.","Student scores","Score distribution"])
   expect(quiz).toContain(phrase);
  for(const phrase of ["Score distribution","Submission timing","Student scores"])
   expect(assignment).toContain(phrase);
  expect(download).toContain("Download PDF");
 });
});
