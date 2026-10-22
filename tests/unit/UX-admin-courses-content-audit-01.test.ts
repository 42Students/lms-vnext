import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("UX-admin-courses-content-audit-01 Super Admin scoped courses and content",()=>{
 const home=read("src/app/(authenticated)/admin/courses/page.tsx");
 const offering=read("src/app/(authenticated)/admin/courses/offerings/[offeringId]/page.tsx");
 const offeringView=read("src/components/courses/admin-offering-learning-page.tsx");
 const offeringTabs=read("src/components/courses/admin-offering-section-tabs.tsx");
 const courses=read("src/components/courses/admin-course-overview.tsx");
 it("SA-academics-people-77 /admin/courses rejects invalid filters and requires selected college before data fetch",()=>{
  expect(home).toContain("parseSuperAdminCourseQuery(query)");
  expect(home).toContain("if (!collegeId)");
  expect(home).toContain("listSuperAdminGlobalCourses(context");
  expect(home).toContain("Select a college to manage Courses");
  expect(home).toContain("<ErrorState");
  expect(home).toContain("getAdminCourseWorkspace(context,collegeId)");
  for(const href of ["/admin/lessons","/admin/videos","/admin/resources","/admin/live-classes",
    "/admin/course-progress","/admin/assignments","/admin/quizzes"]){
    expect(home).toContain(href);
  }
 });
 it("UX-admin-courses-actions-01 keeps every course lifecycle action visible on phone rather than collapsed",()=>{
  const matches=courses.match(/key: "actions",\s*mobilePriority: "action"/g)??[];
  expect(matches).toHaveLength(4);
  expect(courses).toContain("<DataTable");
  expect(courses).toContain("CourseActions");
  expect(courses).toContain("OfferingActions");
  expect(courses).toContain("DeliveryActions");
  expect(courses).toContain("TeachingAssignmentActions");
  expect(courses).toContain('empty={<p');
 });
 it("UX-admin-courses-offering-touch-01 /admin/courses/offerings/[offeringId] denies cross-college invalid detail and uses 44px tabs",()=>{
  expect(offering).toContain("resolveSuperAdminOfferingDetail(context, offeringId)");
  expect(offering).toContain("notFound()");
  expect(offering).toContain('redirect("/admin/courses")');
  // The accessible Home/Syllabus tab strip supersedes section anchors.
  expect(offeringView).toContain("<AdminOfferingSectionTabs");
  expect(offeringTabs).toContain('ariaLabel="Course detail tabs"');
  expect(offeringTabs).toContain('href:pathname+"#"+item.value');
  expect(offeringTabs).toContain('role="tabpanel"');
  expect(offeringTabs).toContain('id="course-syllabus"');
  expect(offeringView).toContain("<AdminOfferingLearningOverview");
 });
 const directories=[
  ["videos","VIDEOS"],["resources","RESOURCES"],["live-classes","LIVE_CLASSES"],
 ] as const;
 for(const [path,kind] of directories)it(`UX-admin-content-${path}-01 scopes /admin/${path} through one guarded directory`,()=>{
  const route=read(`src/app/(authenticated)/admin/${path}/page.tsx`);
  expect(route).toContain(`kind="${kind}"`);
  expect(route).toContain("SuperAdminContentDirectoryPage");
  const shared=read("src/components/courses/super-admin-content-directory-page.tsx");
  expect(shared).toContain("adminContentQuerySchema.safeParse");
  expect(shared).toContain("if(!context.adminScope?.collegeId)");
  expect(shared).toContain("<ErrorState");
  expect(shared).toContain("<EmptyState");
  expect(shared).toContain("listSuperAdminContentDirectory(context,kind,parsed.data)");
  expect(shared).toContain("SuperAdminContentAuthoring");
  expect(shared).toContain("min-h-11");
 });
 it("UX-admin-assignments-quizzes-01 requires scoped college and preserves builder/editor and failure states",()=>{
  for(const [path,kind] of [["assignments","ASSIGNMENT"],["quizzes","QUIZ"]] as const){
   const src=read(`src/app/(authenticated)/admin/${path}/page.tsx`);
   expect(src).toContain(kind==="ASSIGNMENT"?
    "parseSuperAdminAssignmentQuery(raw)":"parseSuperAdminQuizQuery(raw)");
   expect(src).toContain("if (!context.adminScope?.collegeId)");
   expect(src).toContain("isSuperAdmin(context)");
   expect(src).toContain("<ErrorState");
   expect(src).toMatch(new RegExp(`listCollegeAssessmentAggregate\\(context,\\s*"${kind}"`));
   expect(src).toContain("AdminAssessmentDirectory");
  }
  const ui=read("src/components/courses/admin-assessment-read-directory.tsx");
  expect(ui).toContain("Open offering builder / submissions");
  expect(ui).toContain("AdminQuizResultsActions");
  expect(ui).toContain("CollegeAssignmentReview");
  expect(ui).toContain("CollegeQuizAttempts");
 });
 it("UX-admin-course-progress-01 distinguishes measured activity from fabricated completion",()=>{
  const overview=read("src/app/(authenticated)/admin/course-progress/page.tsx");
  const students=read("src/app/(authenticated)/admin/course-progress/students/page.tsx");
  expect(overview).toContain("parseSuperAdminCourseProgressParams(await searchParams)");
  expect(overview).toContain("Select a college to view course progress");
  expect(overview).toContain("a learner completion percentage is available only");
  expect(students).toContain("studentCourseCompletion");
  expect(students).toContain("No completion percentage is available until work is assigned.");
  expect(students).toContain('aria-label="Per student progress table"');
  expect(students).toContain('className="w-full min-w-[860px] border-collapse text-left text-sm tabular-nums"');
  expect(students).toContain("No students in this section.");
  expect(students).toContain('aria-label="Student course progress pages"');
 });
});
