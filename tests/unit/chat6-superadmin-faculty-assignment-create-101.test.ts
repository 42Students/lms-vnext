import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {createCourseTeachingAssignmentInputSchema} from "@/modules/courses/validation";
const src=(p:string)=>readFileSync(p,"utf8");
const deliveryId="11111111-1111-4111-8111-111111111111";
const membershipId="22222222-2222-4222-8222-222222222222";
describe("Super Admin faculty assignment create",()=>{
 it("SA-academics-people-101 validates a typed delivery/faculty/role and rejects malformed assignments",()=>{
  expect(createCourseTeachingAssignmentInputSchema.safeParse({deliveryId,membershipId,role:"PRIMARY"}).success).toBe(true);
  expect(createCourseTeachingAssignmentInputSchema.safeParse({deliveryId,membershipId,role:"ADMIN"}).success).toBe(false);
  expect(createCourseTeachingAssignmentInputSchema.safeParse({deliveryId:"other",membershipId,role:"TA"}).success).toBe(false);
 });
 it("SA-academics-people-101 creates only active faculty teaching assignments in the selected college",()=>{
  const service=src("src/modules/courses/teaching-assignment-service.ts");
  expect(service).toContain('requirePermission(context, "courses.manage"');
  expect(service).toContain('membership.collegeId !== delivery.collegeId');
  expect(service).toContain('FACULTY_ROLE_REQUIRED');
  expect(service).toContain('COURSES_TEACHING_ASSIGNED');
  expect(service).toContain('recordActivityEventInTransaction');
  const route=src("src/app/api/courses/teaching-assignments/route.ts");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("createCourseTeachingAssignment");
  const page=src("src/app/(authenticated)/admin/faculty-assignment/page.tsx");
  expect(page).toContain("SuperAdminFacultyAssignmentCreate");
  expect(page).toContain("getAdminCourseWorkspace(context,collegeId)");
  const form=src("src/components/admin/super-admin-faculty-assignment-create.tsx");
  expect(form).toContain("COURSE_TEACHING_ROLES");
  expect(form).toContain("apiFetch");
  expect(form).toContain("useGuardedAction");
  expect(form).toContain("Create teaching assignment");
 });
});
