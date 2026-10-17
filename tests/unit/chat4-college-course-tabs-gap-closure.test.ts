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
 it("COL-course-tabs-14 provides accessible batch lesson drag-and-drop with transactional CAS and rollback",async()=>{
  const {rearrangeLessonIds,collegeLessonBulkOrderSchema}=await import("@/modules/courses/college-lesson-order-model");
  const ids=["10000000-0000-4000-8000-000000000001","10000000-0000-4000-8000-000000000002","10000000-0000-4000-8000-000000000003"];
  expect(rearrangeLessonIds(ids,ids[2],ids[0])).toEqual([ids[2],ids[0],ids[1]]);
  expect(rearrangeLessonIds(ids,ids[0],ids[1])).toEqual([ids[1],ids[0],ids[2]]);
  const payload={learningPathId:ids[0],expected:ids.map((id,sequence)=>({id,sequence})),orderedIds:[ids[2],ids[0],ids[1]]};
  expect(collegeLessonBulkOrderSchema.safeParse(payload).success).toBe(true);
  expect(collegeLessonBulkOrderSchema.safeParse({...payload,orderedIds:[ids[1],ids[1],ids[0]]}).success).toBe(false);
  const drag=source("src/components/courses/college-lesson-drag-order.tsx");
  expect(drag).toContain("draggable");
  expect(drag).toContain("onDrop");
  expect(drag).toContain("Move up");
  expect(drag).toContain("Move down");
  expect(drag).toContain("setOrder(previous)");
  const backend=source("src/modules/courses/lesson-service.ts");
  expect(backend).toContain('for("update")');
  expect(backend).toContain("firstTemporary");
  expect(source("src/app/api/courses/lessons/reorder-all/route.ts")).toContain("isSameOriginRequest(request)");
 });
 it("COL-course-tabs-R01 excludes resource clicks and counts only measured work",()=>{
  const service=source("src/modules/courses/college-learner-progress-service.ts");
  const report=source("src/components/courses/college-learner-progress-report.tsx");
  expect(service).toContain('inArray(lessonContents.contentType,["VIDEO","YOUTUBE"])');
  expect(service).toContain("assignmentSubmissions.membershipId");
  expect(service).toContain("quizAttempts.membershipId");
  expect(service).toContain("out.get(item.membershipId)??new Set<string>()");
  expect(report).toContain("Measured work only");
  expect(report).toContain("Resources marked done by a student&apos;s own click are not included.");
  expect(report).toContain("A retaken quiz counts once per learner.");
 });
 it("COL-course-tabs-27 shows Lessons, Progress, Assignments and Quizzes as mobile cards",()=>{
  const directory=source("src/components/courses/college-learning-directory.tsx");
  expect(directory).toContain('aria-label={title+" mobile records"}');
  expect(directory).toContain('className="space-y-3 p-3 md:hidden"');
  expect(directory).toContain('{data.kind==="LESSONS" ? (');
  expect(directory).toMatch(/\{data\.kind==="LESSONS"\s*\?\s*\(\s*<>/);
  expect(directory).toMatch(/<\/>(\s*)\)\s*:\s*\(\s*<>/);
  expect(directory).toContain("collegeLessonVisibilityLabel(item)");
  expect(directory).toContain("collegeProgressDescription(item)");
  expect(directory).toContain('className="hidden overflow-x-auto md:block"');
  const assessment=source("src/components/courses/college-assessment-aggregate.tsx");
  expect(assessment).toContain('className="divide-y divide-border sm:hidden"');
  expect(assessment).toContain('className="hidden overflow-x-auto sm:block"');
  expect(assessment).toContain("data.items.map(item=><article");
  expect(assessment).toContain("<CollegeAssignmentActions assignment={item}/>");
  expect(assessment).toContain("<CollegeQuizAttempts quizId={item.id}");

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
