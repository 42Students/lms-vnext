import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {superAdminCourseBulkSchema} from "@/modules/courses/super-admin-course-bulk-visibility";
import {safeCourseVisibilityFailure} from "@/modules/courses/bulk-visibility-failure-model";
import {adminContentQuerySchema,adminContentHref,adminContentPages,adminContentTypeLabel,
 contentTypesForKind,ADMIN_CONTENT_PAGE_SIZE} from "@/modules/courses/super-admin-content-directory-model";
import {studentCourseCompletion} from "@/modules/courses/super-admin-student-progress-model";

const id="11111111-1111-4111-8111-111111111111";
const source=(p:string)=>readFileSync("src/modules/courses/"+p+".ts","utf8");
describe("SA-academics-people-52/53 GR-COURSES-TENANT-01 safe scoped Super Admin visibility and progress",()=>{
 it("bulk visibility requires unique UUIDs, bounded selection, explicit confirmation; cannot pass arbitrary college",()=>{
  const valid={courseIds:[id],visibleToStudents:true,confirmed:true};
  expect(superAdminCourseBulkSchema.safeParse(valid).success).toBe(true);
  for(const input of [
   {...valid,courseIds:[]},{...valid,courseIds:[id,id]},
   {...valid,courseIds:["foreign"]},{...valid,courseIds:Array(26).fill(id)},
   {...valid,confirmed:false},{...valid,collegeId:id},
   {...valid,visibleToStudents:"yes"},
  ])expect(superAdminCourseBulkSchema.safeParse(input).success).toBe(false);
 });
 it("the initial lesson-content query filters both college-owned departments and periods to acting scope before counting matches",()=>{
  const sqlScope=source("super-admin-lesson-bulk-visibility");
  expect(sqlScope).toContain('const acting=await resolveActingCollege(context,"courses.manage")');
  expect(sqlScope).toContain("eq(departments.collegeId,acting.collegeId)");
  expect(sqlScope).toContain("eq(academicPeriods.collegeId,acting.collegeId)");
  expect(sqlScope).toContain("eq(courseOfferings.id,courseLearningPaths.offeringId)");
  expect(sqlScope).toContain("for(const lessonId of input.lessonIds)");
  expect(sqlScope).toContain("eq(courseLessons.id,lessonId)");
  expect(sqlScope).toContain("eq(academicPeriods.collegeId,acting.collegeId)");
  expect(sqlScope).toContain("assertPersistedPlatformPermission(tx,context");
  expect(sqlScope).toContain("tx.update(courseLessons).set({");
  expect(sqlScope).toContain("eq(courseLessons.id,lesson.id),eq(courseLessons.version,lesson.version)");
  expect(sqlScope).toContain("eventType:ACTIVITY_EVENT_TYPES.COURSES_LESSON_UPDATED");
  const course=source("super-admin-course-bulk-visibility");
  expect(course).toContain("eq(departments.collegeId,acting.collegeId)");
  expect(course).toContain("const unauthorizedIds=input.courseIds.filter(id=>!validIds.includes(id))");
  expect(course).toContain("const failedCourses=new Set<string>(unauthorizedIds)");
  expect(course).toContain("validIds.filter(id=>!failedCourses.has(id))");
  // The selected course count bounds writes, while every scoped lesson is
  // processed in limited batches rather than silently dropped at lesson 501.
  expect(course).toContain("for(let offset=0;offset<ids.length;offset+=100)");
  expect(course).toContain("ids.slice(offset,offset+100)");
  expect(course).toContain("for(let i=0;i<ids.length;i+=25)");
  expect(course).toContain("lessonIds:slice");
  expect(course).not.toContain("lessons.length>500");
 });
 it("never propagates raw database, SQL, secret or permission exceptions in per-item results",()=>{
  for(const cause of [
   new Error("postgres://user:secret@db-internal"),new Error("SELECT * FROM private_table"),
   {message:"cross-tenant permission details"},null,undefined,
  ]) {
   const safe=safeCourseVisibilityFailure(cause);
   expect(safe).toContain("Refresh the page and retry");
   expect(safe).not.toMatch(/postgres|secret|SELECT|private_table|permission details/i);
  }
  for(const mod of ["super-admin-course-bulk-visibility","super-admin-lesson-bulk-visibility",
    "college-lesson-visibility-service"]){
   const c=source(mod);
   if(mod==="super-admin-lesson-bulk-visibility"){
    expect(c).toContain('"Lesson could not be updated. Refresh and retry."');
    expect(c).toContain("error instanceof CoursesServiceError");
   }else expect(c).toContain("safeCourseVisibilityFailure(error)");
   expect(c).not.toMatch(/reason\s*:\s*error instanceof Error\s*\?\s*error\.message/);
  }
 });
 it("content directory query validates UUID, status, page and rejects unrecognized filters",()=>{
  expect(adminContentQuerySchema.safeParse({q:"  Lesson ",page:"25",status:"PUBLISHED"}).success).toBe(true);
  for(const bad of [
   {offeringId:"another-college"},{page:-1},{page:1001},{status:"SHIPPED"},
   {scope:"PRIVATE"},{deliveryId:42},{q:"x".repeat(101)},
   {unknown:"x"},
  ])expect(adminContentQuerySchema.safeParse(bad).success).toBe(false);
 });
 it("builds only matching content route with bounded filter state and known content kind",()=>{
  for(const [kind,base,type] of [
   ["VIDEOS","/admin/videos","VIDEO"],["RESOURCES","/admin/resources","RESOURCE"],
   ["LIVE_CLASSES","/admin/live-classes","LIVE_CLASS"],
  ] as const){
   expect(adminContentHref(kind,{})).toBe(base);
   expect(contentTypesForKind(kind)).toContain(type);
   const url=adminContentHref(kind,{q:"A&B",status:"PUBLISHED",page:"3",scope:"SECTION"});
   expect(url.startsWith(base+"?")).toBe(true);
   const params=new URL(url,"https://local.invalid").searchParams;
   expect(params.get("q")).toBe("A&B");
   expect(params.get("page")).toBe("3");
   expect(params.get("scope")).toBe("SECTION");
  }
  expect(adminContentTypeLabel("YOUTUBE")).toContain("YouTube");
  expect(adminContentTypeLabel("OTHER")).toBe("Unknown content");
  expect(ADMIN_CONTENT_PAGE_SIZE).toBe(10);
  expect(adminContentPages(0)).toBe(1);
  expect(adminContentPages(26)).toBe(3);
 });
 it("Super Admin student progress never invents percent with no denominator; clamps malformed completed counts",()=>{
  const base={videos:0,assignments:0,quizzes:0,totalVideos:0,totalAssignments:0,totalQuizzes:0};
  expect(studentCourseCompletion(base)).toBeNull();
  expect(studentCourseCompletion({...base,totalVideos:-1})).toBeNull();
  expect(studentCourseCompletion({...base,totalVideos:NaN})).toBeNull();
  expect(studentCourseCompletion({...base,totalVideos:2,videos:2})).toBe(100);
  expect(studentCourseCompletion({...base,totalVideos:2,videos:100})).toBe(100);
  expect(studentCourseCompletion({...base,totalVideos:2,videos:-1})).toBe(0);
  expect(studentCourseCompletion({...base,totalVideos:3,videos:1})).toBe(33);
 });
});
