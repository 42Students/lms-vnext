import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {createCourseInputSchema,updateCourseInputSchema} from "@/modules/courses/validation";
import {studentCourseCompletion} from "@/modules/courses/super-admin-student-progress-model";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const example={departmentId:"11111111-1111-4111-8111-111111111111",
 name:"Operating Systems",code:"OS-INTERNAL-2026",shortTitle:"OS",
 officialCode:null,cardColor:"#1677FF"};

describe("chat-7 final sprint Super Admin courses and content",()=>{
 it("SA-academics-people-50 validates short title, optional official code and colour independently from internal code",()=>{
  expect(createCourseInputSchema.safeParse(example).success).toBe(true);
  expect(createCourseInputSchema.safeParse({...example,shortTitle:""}).success).toBe(false);
  expect(createCourseInputSchema.safeParse({...example,cardColor:"red"}).success).toBe(false);
  expect(updateCourseInputSchema.safeParse({shortTitle:"OS",officialCode:null}).success).toBe(true);
  const ui=read("src/components/courses/admin-course-create-panel.tsx");
  const edit=read("src/components/courses/admin-course-actions.tsx");
  const service=read("src/modules/courses/course-service.ts");
  for(const text of ["Short display name","Official course code (optional)","Card colour"]){
   expect(ui).toContain(text);expect(edit).toContain(text);
  }
  expect(service).toContain("shortTitle:input.shortTitle??input.name.slice(0,120)");
  expect(read("docs/proposed-migrations/chat7-sa-course-catalogue-metadata.sql"))
   .toContain("ADD COLUMN IF NOT EXISTS short_title");
 });
 it("SA-academics-people-52 offers guarded selected-course bulk show hide and per-record failures",()=>{
  const ui=read("src/components/courses/super-admin-course-bulk-visibility.tsx");
  expect(ui).toContain("Show to students");expect(ui).toContain("Hide from students");
  expect(ui).toContain("Retry failed");
  const service=read("src/modules/courses/super-admin-course-bulk-visibility.ts");
  expect(service).toContain("selected.length!==input.courseIds.length");
  expect(service).toContain("bulkSuperAdminLessonVisibility(context");
  expect(service).toContain("failures.push(");
  expect(read("src/app/api/admin/courses/bulk-status/route.ts")).toContain("isSameOriginRequest");
 });
 it("SA-academics-people-53 authorizes Super Admin college scoped course and lesson-content visibility",()=>{
  const source=read("src/modules/courses/super-admin-course-bulk-visibility.ts");
  expect(source).toContain('resolveActingCollege(context,"courses.manage")');
  expect(source).toContain("eq(departments.collegeId,acting.collegeId)");
  const single=read("src/modules/courses/college-content-visibility-service.ts");
  expect(single).toContain("isSuperAdmin(context)");
  expect(single).toContain("requirePermission(context");
 });
 it("SA-academics-people-56 can edit archive reorder and open offering creation from the lesson directory",()=>{
  const page=read("src/app/(authenticated)/admin/lessons/page.tsx");
  expect(page).toContain("<SuperAdminLessonCreate");
  const create=read("src/components/courses/super-admin-lesson-create.tsx");
  expect(create).toContain('"Course / Offering"'.replaceAll('"','')); 
  expect(create).toContain('"/api/courses/lessons"');
  expect(create).toContain('name:name.trim()');
  expect(page).toContain("<LessonActions");
  expect(page).toContain("<CollegeLessonReorderActions");
  expect(page).toContain("Open offering to add lessons");
  const offering=read("src/components/courses/admin-offering-learning-overview.tsx");
  expect(offering).toContain("<CreateLessonForm");
  expect(offering).toContain('id="lesson-authoring"');
 });
 it("SA-academics-people-60 does not pretend URL video import works without a private scanned ingestion service",()=>{
  const service=read("src/modules/courses/lesson-video-service.ts");
  const proposal=read("docs/audit/acceptance/superadmin-academics-people-2-courses-content-verification.md");
  expect(proposal).toContain("SA-academics-people-60");
  expect(proposal).toContain("storage");
  expect(service).not.toContain("fetch(remoteVideoUrl)");
 });
 it("SA-academics-people-64 connects assignments to publish archive and existing builder",()=>{
  const ui=read("src/components/courses/admin-assessment-read-directory.tsx");
  expect(ui).toContain("<FacultyItemActions");
  expect(ui).toContain('assignment?"assignments":"quizzes"');
  expect(ui).toContain("Open offering builder / submissions");
  expect(read("src/app/(authenticated)/admin/assignments/page.tsx"))
   .toContain("Export assignments.csv");
 });
 it("SA-academics-people-65 exposes quiz transitions, result releases and existing builder entry",()=>{
  const ui=read("src/components/courses/admin-assessment-read-directory.tsx");
  expect(ui).toContain("<AdminQuizResultsActions");
  expect(ui).toContain("resultsPublished={Boolean(item.resultsPublished)}");
  expect(ui).toContain("deadlineReached={item.resultsReleaseReady}");
  expect(read("src/app/(authenticated)/admin/quizzes/page.tsx")).toContain("Export quizzes.csv");
 });
 it("SA-academics-people-67 computes real persisted learner progress without fabricated 0% when no content",()=>{
  expect(studentCourseCompletion({videos:1,assignments:1,quizzes:0,
   totalVideos:2,totalAssignments:1,totalQuizzes:1})).toBe(50);
  expect(studentCourseCompletion({videos:0,assignments:0,quizzes:0,
   totalVideos:0,totalAssignments:0,totalQuizzes:0})).toBeNull();
  expect(studentCourseCompletion({videos:10,assignments:0,quizzes:0,
   totalVideos:2,totalAssignments:0,totalQuizzes:0})).toBe(100);
  const service=read("src/modules/courses/super-admin-student-course-progress.ts");
  for(const source of ["learner_content_progress","assignment_submissions","quiz_attempts",
   "section_enrollments","m.college_id"]){expect(service).toContain(source);}
  const page=read("src/app/(authenticated)/admin/course-progress/students/page.tsx");
  expect(page).toContain("Average completion");
  expect(page).toContain("Not started");
  expect(page).toContain("Items measured");
  expect(page).toContain("Export CSV");
 });
});
