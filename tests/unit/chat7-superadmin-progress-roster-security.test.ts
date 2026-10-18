import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {studentCourseCompletion} from "@/modules/courses/super-admin-student-progress-model";

const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");

describe("SA-academics-people-67 selected-college learner progress hardening",()=>{
 it("SA-academics-people-67 uses only active LEARNER membership in the exact offering cohort, period and section",()=>{
  const source=read("src/modules/courses/super-admin-student-course-progress.ts");
  for(const guard of [
   "d.offering_id=${offeringId}::uuid",
   "d.ended_at is null",
   "s.cohort_id=o.cohort_id",
   "s.academic_period_id=o.academic_period_id",
   "se.academic_period_id=o.academic_period_id",
   "e.cohort_id=o.cohort_id",
   "m.college_id=${collegeId}::uuid",
   "m.status='ACTIVE'",
   "role.role='LEARNER'",
   "u.platform_status='ACTIVE'",
  ])expect(source).toContain(guard);
  expect(source).toContain('requirePermission(context,"courses.read"');
  expect(source).toContain("if(count!==1)throw new AuthorizationError");
 });
 it("SA-academics-people-67 fetches a sentinel row before marking the 500-row export/page as truncated",()=>{
  const source=read("src/modules/courses/super-admin-student-course-progress.ts");
  expect(source).toMatch(/limit\s+501\s*`\)/);
  expect(source).toContain(".slice(0,500).map(");
  expect(source).toContain("truncated:result.rows.length>500");
  expect(source).not.toContain("truncated:rows.length===500");
 });
 it("SA-academics-people-67 never invents a 0% completion rate for a course with no measurable content",()=>{
  expect(studentCourseCompletion({videos:0,assignments:0,quizzes:0,
   totalVideos:0,totalAssignments:0,totalQuizzes:0})).toBeNull();
  expect(studentCourseCompletion({videos:2,assignments:1,quizzes:1,
   totalVideos:2,totalAssignments:1,totalQuizzes:1})).toBe(100);
  expect(studentCourseCompletion({videos:0,assignments:0,quizzes:0,
   totalVideos:2,totalAssignments:1,totalQuizzes:1})).toBe(0);
 });
});
