import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {moveCourseDepartmentInputSchema} from "@/modules/courses/validation";
const id="11111111-1111-4111-8111-111111111111";
describe("same-college course move",()=>{
 it("rejects missing, malformed or extra department and version fields",()=>{
  expect(moveCourseDepartmentInputSchema.safeParse({
    departmentId:id,expectedUpdatedAt:"2026-10-22T12:00:00.000Z",
  }).success).toBe(true);
  for(const input of [
    {departmentId:"not-uuid",expectedUpdatedAt:"2026-10-22T12:00:00.000Z"},
    {departmentId:id,expectedUpdatedAt:"yesterday"},
    {departmentId:id,expectedUpdatedAt:"2026-10-22T12:00:00.000Z",collegeId:id},
  ])expect(moveCourseDepartmentInputSchema.safeParse(input).success).toBe(false);
 });
 it("checks origin, tenant scope and historical offering guard at the route/service boundary",()=>{
  const route=readFileSync("src/app/api/courses/[courseId]/department/route.ts","utf8");
  const service=readFileSync("src/modules/courses/course-service.ts","utf8");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("moveCourseDepartmentInputSchema.parse(body)");
  expect(route).toContain("moveCourseDepartment(context,courseId,");
  expect(service).toContain("target.collegeId!==scope.collegeId");
  expect(service).toContain("requireCourseWrite(context,scope.organizationId,scope.collegeId)");
  expect(service).toContain('throw new CoursesServiceError("COURSE_HAS_ACTIVE_OFFERINGS")');
 });
});
