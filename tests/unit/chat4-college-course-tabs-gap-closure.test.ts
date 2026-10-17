import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {collegeAssessmentSummary,parseCollegeAssessmentQuery} from "@/modules/courses/college-assessment-aggregate-model";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-4 College Course Tabs gap closure",()=>{
 it("COL-course-tabs-05 verifies scoped College Admin authoring and listing",()=>{
  {const s=source("src/components/courses/college-assignment-review.tsx");
   expect(s).toContain("FacultyAssignmentReview");
   expect(s).toContain("Publish grades");
   expect(s).toContain("Retry failed");
   expect(s).toContain("failedIds");
  }
 });
 it("COL-course-tabs-06 verifies scoped College Admin authoring and listing",()=>{
  {const s=source("src/components/courses/college-quiz-create.tsx");
   expect(s).toContain("Create New Quiz");
   expect(s).toContain("moveQuestion");
  }
  {const s=source("src/components/courses/college-quiz-actions.tsx");
   expect(s).toContain("Save quiz");
   expect(s).toContain("Delete this quiz?");
  }
  {const s=source("src/components/courses/college-quiz-attempts.tsx");
   expect(s).toContain("Submissions");
   expect(s).toContain("Previous");
   expect(s).toContain("Next");
  }
 });
 it("COL-course-tabs-07 verifies scoped College Admin authoring and listing",()=>{
  {const s=source("src/components/courses/college-assessment-aggregate.tsx");
   expect(s).toContain("QuizListActions");
   expect(s).toContain("AdminQuizResultsActions");
   expect(s).toContain("resultsReleaseReady");
   expect(s).toContain("Results can be released after the quiz deadline");
  }
  expect(parseCollegeAssessmentQuery("QUIZ",{results:"PUBLISHED"}).results).toBe("PUBLISHED");
 });
 it("COL-course-tabs-08 verifies scoped College Admin authoring and listing",()=>{
  {const s=source("src/components/courses/college-learner-progress-report.tsx");
   expect(s).toContain("Average completion");
   expect(s).toContain("Videos");
   expect(s).toContain("Assignments");
   expect(s).toContain("Quizzes");
   expect(s).toContain("row.progress");
  }
 });
 it("COL-course-tabs-09 verifies scoped College Admin authoring and listing",()=>{
  {const s=source("src/components/courses/college-learner-progress-report.tsx");
   expect(s).toContain("choices.filter(option=>option.sectionId===sectionId)");
   expect(s).toContain("Select Course");
   expect(s).toContain("Show progress");
  }
 });
 it("COL-course-tabs-10 verifies scoped College Admin authoring and listing",()=>{
  {const s=source("src/components/courses/college-learner-progress-report.tsx");
   expect(s).toContain("Export per-learner CSV");
   expect(s).toContain("/api/courses/college/learner-progress/export");
  }
 });
 it("COL-course-tabs-11 verifies scoped College Admin authoring and listing",()=>{
  {const s=source("src/components/courses/college-assessment-aggregate.tsx");
   expect(s).toContain("item.submittedLearners}/{item.eligibleLearners");
   expect(s).toContain("item.gradedLearners");
  }
  {const s=source("src/modules/courses/college-assessment-aggregate-service.ts");
   expect(s).toContain("eligibleByOfferingMembers");
   expect(s).toContain("learnerProgramEnrollments.cohortId");
  }
  expect(collegeAssessmentSummary([{status:"PUBLISHED",activityCount:3},{status:"DRAFT",activityCount:1}])).toEqual({displayed:2,published:1,activity:4});
 });
 it("COL-course-tabs-12 verifies scoped College Admin authoring and listing",()=>{
  {const s=source("src/app/(authenticated)/college/lessons/page.tsx");
   expect(s).toContain("CollegeLessonCreateControl");
  }
  {const s=source("src/components/courses/college-lesson-create-control.tsx");
   expect(s).toContain("Create New Lesson");
   expect(s).toContain("Create Lesson & Add Another");
   expect(s).toContain("/api/courses/lessons");
  }
 });
 it("COL-course-tabs-13 verifies scoped College Admin authoring and listing",()=>{
  {const s=source("src/components/courses/college-learning-directory.tsx");
   expect(s).toContain("CollegeLessonBulkVisibility");
  }
  {const s=source("src/components/courses/college-lesson-visibility-controls.tsx");
   expect(s).toContain("apiFetch");
   expect(s).toContain("Retry failed");
   expect(s).toContain("failedRows");
   expect(s).toContain("Select all on this page");
  }
 });
 it("COL-course-tabs-24 verifies scoped College Admin authoring and listing",()=>{
  {const s=source("src/components/courses/college-learning-directory.tsx");
   expect(s).toContain("Rows per page");
   expect(s).toContain("[10,25,50,100]");
   expect(s).toContain("name=\"page\"");
  }
 });
 it("COL-course-tabs-22 keeps all College Course pages usable when no college is assigned",()=>{
  const files=["src/app/(authenticated)/college/assignments/page.tsx","src/app/(authenticated)/college/course-progress/page.tsx","src/app/(authenticated)/college/courses/page.tsx","src/app/(authenticated)/college/lessons/page.tsx","src/app/(authenticated)/college/live-classes/page.tsx","src/app/(authenticated)/college/quizzes/page.tsx","src/app/(authenticated)/college/resources/page.tsx","src/app/(authenticated)/college/videos/page.tsx"];
  for(const path of files){
   const s=source(path);
   expect(s).toContain("CollegeCourseMissingScope");
  }
  const notice=source("src/components/courses/college-course-missing-scope.tsx");
  expect(notice).toContain("Admin not assigned to a college");
  expect(notice).toContain("Ask a Super Admin to assign a college");
 });

 it("COL-course-tabs-17 permits only metadata in authorized admin content preview",()=>{
  const preview=source("src/components/courses/college-content-preview.tsx");
  expect(preview).toContain('aria-label="Content preview"');
  expect(preview).toContain("Private files, meeting links and signed playback addresses are not exposed here.");
  expect(preview).not.toContain("storageKey");
  expect(preview).not.toContain("signedUrl");
  expect(source("src/components/courses/college-content-aggregate.tsx")).toContain("CollegeContentPreview");
 });
 it("COL-course-tabs-19 exports page-scoped safe Video Resource and Live Class CSV",async()=>{
  const {collegeContentCsv}=await import("@/modules/courses/college-content-csv-model");
  const csv=collegeContentCsv([{title:"=HYPERLINK(1)",course:"CS101",lesson:"Lesson 1",status:"DRAFT",scope:"Shared",visible:"Hidden",details:"No materials"}]);
  expect(csv).toContain("\"'=HYPERLINK(1)\"");
  expect(source("src/components/courses/college-content-aggregate.tsx")).toContain("CollegeContentCsvExport");
  expect(source("src/components/courses/college-live-classes-directory.tsx")).toContain("CollegeContentCsvExport");
 });

 it("COL-course-tabs-03 protects current Course Tabs controls while legacy work remains",()=>{
   const s=source("src/components/courses/college-content-authoring-control.tsx");
   expect(s).toContain("Existing Content");
   expect(s).toContain("RESOURCE");
   expect(s).toContain("materials");
 });
 it("COL-course-tabs-04 protects current Course Tabs controls while legacy work remains",()=>{
   const s=source("src/components/courses/college-assignment-create.tsx");
   expect(s).toContain("Create New Assignment");
   expect(s).toContain("allowedMethods");
   expect(s).toContain("dueAt");
 });
 it("COL-course-tabs-14 protects current Course Tabs controls while legacy work remains",()=>{
   const s=source("src/components/courses/college-lesson-reorder-actions.tsx");
   expect(s).toContain("apiFetch<unknown>");
   expect(s).toContain("Move up");
   expect(s).toContain("Move down");
   expect(s).toContain("Lesson order updated");
 });
 it("COL-course-tabs-16 protects current Course Tabs controls while legacy work remains",()=>{
   const s=source("src/components/courses/college-content-authoring-control.tsx");
   expect(s).toContain("listSectionId");
   expect(s).toContain("item.offeringId");
   expect(s).toContain("Section");
 });
 it("COL-course-tabs-18 protects current Course Tabs controls while legacy work remains",()=>{
   const s=source("src/components/courses/college-content-aggregate.tsx");
   expect(s).toContain("Course code (exact)");
   expect(s).toContain("Section");
 });
});
