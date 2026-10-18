import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("Super Admin courses and content page-level scope, recovery and mobile access gates",()=>{
 it("SA-academics-people-50/54 selected-college catalogue exposes real create/search/error/empty states",()=>{
  const page=read("src/app/(authenticated)/admin/courses/page.tsx");
  const overview=read("src/components/courses/admin-course-overview.tsx");
  for(const word of ["getCurrentRequestContext","Select a college to continue",
   "Invalid course filters","Clear filters","getAdminCourseWorkspace",
   "getSuperAdminCourseDependencyCounts","<AdminCourseOverview"]){
   expect(page).toContain(word);
  }
  for(const text of ["Search courses","Per page","Export CSV","Refresh",
   "<SuperAdminCourseBulkVisibility","No courses match these filters"]){
   expect(overview).toContain(text);
  }
  expect(page).not.toContain("collegeId:raw.collegeId");
 });
 it("SA-academics-people-56/57 lessons guard invalid filters, no-college and explicit authoring",()=>{
  const page=read("src/app/(authenticated)/admin/lessons/page.tsx");
  for(const word of ["adminLearningQuerySchema.safeParse",
   "Select a college to continue","Invalid lesson filters",
   "<SuperAdminLessonCreate","<SuperAdminLessonBulkVisibility",
   "<CollegeLessonVisibilityControl","<LessonActions",
   "<CollegeLessonReorderActions","Open offering to add lessons"]){
   expect(page).toContain(word);
  }
 });
 it("SA-academics-people-61/62 video, resource and live-class surfaces keep safe previews and disabled source edit state",()=>{
  const content=read("src/components/courses/super-admin-content-directory-page.tsx");
  for(const word of ["adminContentQuerySchema.safeParse",
   "Invalid content filters","Select a college to continue",
   "<SuperAdminContentAuthoring","<SuperAdminContentActions",
   "studentContentVisible(item)","safePublicCourseContentUrl",
   "Content editing is unavailable for an inactive offering or lesson.",
   "<Pagination"]){
   expect(content).toContain(word);
  }
  for(const route of ["videos","resources","live-classes"]){
   const page=read("src/app/(authenticated)/admin/"+route+"/page.tsx");
   expect(page).toContain("SuperAdminContentDirectoryPage");
  }
 });
 it("SA-academics-people-64/65 assignments and quizzes preserve validation, scoped reads and interactive submissions",()=>{
  for(const kind of ["assignments","quizzes"]){
   const page=read("src/app/(authenticated)/admin/"+kind+"/page.tsx");
   expect(page).toContain("adminAssessmentQuerySchema.safeParse");
   expect(page).toContain("Select a college to continue");
   expect(page).toContain("listCollegeAssessmentAggregate(context");
   expect(page).toContain("Export "+kind+".csv");
   expect(page).toContain("<AdminAssessmentDirectory");
  }
  const directory=read("src/components/courses/admin-assessment-read-directory.tsx");
  for(const component of ["<CollegeAssignmentReview","<CollegeAssignmentActions",
   "<CollegeQuizActions","<CollegeQuizAttempts","<AdminQuizResultsActions",
   "<FacultyItemActions"]){
   expect(directory).toContain(component);
  }
 });
 it("SA-academics-people-67 progress directory and per-student details keep scoped recovery and export parity",()=>{
  const page=read("src/app/(authenticated)/admin/course-progress/page.tsx");
  const students=read("src/app/(authenticated)/admin/course-progress/students/page.tsx");
  for(const word of ["Invalid course progress filters","Select a college to continue",
   "listCollegeCourseProgress(context","View student progress"]){
   expect(page).toContain(word);
  }
  for(const word of ["getSuperAdminStudentCourseProgress",
   "Unable to read course progress","studentCourseCompletion(row)",
   "row.totalVideos","Export CSV","Showing the first 500 students"]){
   expect(students).toContain(word);
  }
  expect(students).not.toContain("report.totals");
 });
});
