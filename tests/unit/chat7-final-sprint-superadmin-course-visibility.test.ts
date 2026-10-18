import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("Final sprint Super Admin course student visibility",()=>{
 it("SA-academics-people-52 bulk Show/Hide confirms, reports partial failures and offers Retry failed",()=>{
  const ui=read("src/components/courses/super-admin-course-bulk-visibility.tsx");
  const page=read("src/components/courses/admin-course-overview.tsx");
  expect(page).toContain("<SuperAdminCourseBulkVisibility");
  expect(page).toContain('courseBasePath.startsWith("/admin/")');
  for(const word of ["Show to students","Hide from students","Retry failed","Select all courses on this page"]){
   expect(ui).toContain(word);
  }
  expect(ui).toContain("window.confirm(");
  expect(ui).toContain('"/api/admin/courses/bulk-status"');
  expect(ui).toContain("report.failures.length");
 });
 it("SA-academics-people-53 guards college scope and preserves published lesson state when toggling student visibility",()=>{
  const service=read("src/modules/courses/super-admin-course-bulk-visibility.ts");
  const leaf=read("src/modules/courses/super-admin-lesson-bulk-visibility.ts");
  const item=read("src/modules/courses/college-content-visibility-service.ts");
  const api=read("src/app/api/admin/courses/bulk-status/route.ts");
  expect(service).toContain('resolveActingCollege(context,"courses.manage")');
  expect(service).toContain("eq(departments.collegeId,acting.collegeId)");
  expect(service).toContain('eq(courses.status,"ACTIVE")');
  expect(service).toContain('eq(courseLessons.status,"ACTIVE")');
  expect(service).toContain("bulkSuperAdminLessonVisibility(context");
  expect(leaf).toContain("updateCollegeContentStudentVisibility(context");
  expect(item).toContain("isSuperAdmin(context)");
  expect(item).toContain("requirePermission(context");
  expect(api).toContain("isSameOriginRequest(request)");
 });
});


describe("SA-academics-people-52/53 selected-course retry integrity",()=>{
 it("SA-academics-people-52 sends only failed courses on retry instead of reapplying successful changes",()=>{
  const client=read("src/components/courses/super-admin-course-bulk-visibility.tsx");
  const service=read("src/modules/courses/super-admin-course-bulk-visibility.ts");
  const lesson=read("src/modules/courses/super-admin-lesson-bulk-visibility.ts");
  expect(client).toContain("void apply(lastAction,report.failedCourseIds)");
  expect(client).toContain("ids=ids.filter(id=>currentIds.has(id))");
  expect(service).toContain("failedCourseIds:input.courseIds.filter(id=>failedCourses.has(id))");
  expect(service).toContain("lessonCourseIds.get(failure.lessonId)");
  expect(service).toContain("lessonCourseIds.get(id)");
  expect(lesson).toContain("lessonId:row.lessonId,reason:safeCourseVisibilityFailure(error)");
 });
 it("SA-academics-people-52 accepts the 100-course page but refuses unbounded bulk actions",()=>{
  const service=read("src/modules/courses/super-admin-course-bulk-visibility.ts");
  expect(service).toContain("courseIds:z.array(z.uuid()).min(1).max(100)");
  expect(service).toContain(".limit(501)");
  expect(service).toContain("COURSE_VISIBILITY_BULK_TOO_LARGE");
  expect(service).toContain("selected.length!==input.courseIds.length");
 });
});
