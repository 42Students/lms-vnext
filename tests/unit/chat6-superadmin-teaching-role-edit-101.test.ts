import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {createCourseTeachingAssignmentInputSchema} from "@/modules/courses/validation";
const read=(p:string)=>readFileSync(p,"utf8");
const deliveryId="11111111-1111-4111-8111-111111111111";
const membershipId="22222222-2222-4222-8222-222222222222";
describe("SA-academics-people-101 role edit transactional contract",()=>{
 it("SA-academics-people-101 refuses invalid roles at the model boundary",()=>{
  expect(createCourseTeachingAssignmentInputSchema.shape.role.safeParse("PRIMARY").success).toBe(true);
  expect(createCourseTeachingAssignmentInputSchema.shape.role.safeParse("CO_TEACHER").success).toBe(true);
  expect(createCourseTeachingAssignmentInputSchema.shape.role.safeParse("TA").success).toBe(true);
  expect(createCourseTeachingAssignmentInputSchema.shape.role.safeParse("SUPER_ADMIN").success).toBe(false);
  expect(createCourseTeachingAssignmentInputSchema.safeParse({deliveryId,membershipId,role:"PRIMARY"}).success).toBe(true);
 });
 it("SA-academics-people-101 edits in-place only on the locked scoped active delivery and records an audit event",()=>{
  const source=read("src/modules/courses/teaching-assignment-service.ts");
  const block=source.slice(source.indexOf("export async function changeCourseTeachingAssignmentRole("));
  expect(block).toContain('requirePermission(context,"courses.manage"');
  expect(block).toContain('for("update")');
  expect(block).toContain('eq(courseTeachingAssignments.id,assignmentId)');
  expect(block).toContain('isNull(courseTeachingAssignments.endedAt)');
  expect(block).toContain('eq(colleges.status,"ACTIVE")');
  expect(block).toContain('scope.collegeId!==current.collegeId');
  expect(block).toContain('FACULTY_ROLE_REQUIRED');
  expect(block).toContain('teachingAssignmentConflict');
  expect(block).toContain('COURSES_TEACHING_ASSIGNED');
  expect(block).toContain('recordActivityEventInTransaction');
  expect(block).toContain('mapTeachingConstraint(error)');
  expect(block).not.toContain('tx.insert(courseTeachingAssignments)');
 });
 it("SA-academics-people-101 guards PATCH origin and offers create, edit, and end actions on the tab",()=>{
  const route=read("src/app/api/courses/teaching-assignments/[assignmentId]/route.ts");
  expect(route).toContain("export async function PATCH");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("changeCourseTeachingAssignmentRole(context,assignmentId,body.role)");
  const page=read("src/app/(authenticated)/admin/faculty-assignment/page.tsx");
  expect(page).toContain("SuperAdminFacultyAssignmentCreate");
  expect(page).toContain("SuperAdminTeachingRoleEdit");
  expect(page).toContain("TeachingAssignmentActions");
  expect(page).toContain('row.status!=="ACTIVE"');
  const controls=read("src/components/admin/super-admin-faculty-assignment-create.tsx");
  expect(controls).toContain("Save role");
  expect(controls).toContain('method:"PATCH"');
 });
});
