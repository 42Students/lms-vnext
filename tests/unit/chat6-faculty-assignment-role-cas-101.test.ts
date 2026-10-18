import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {changeCourseTeachingAssignmentRoleInputSchema} from "@/modules/courses/validation";
import {teachingAssignmentRevisionMatches,nextTeachingAssignmentRevision} from "@/modules/courses/teaching-assignment-revision";
const assignmentId="11111111-1111-4111-8111-111111111111";
const token="2026-10-18T12:34:56.789Z";
const source=(path:string)=>readFileSync(path,"utf8");

describe("SA-academics-people-101 teaching role concurrency",()=>{
 it("rejects missing revision, invented fields, unsupported roles and malformed timestamps",()=>{
  const input={role:"PRIMARY",expectedUpdatedAt:token};
  expect(changeCourseTeachingAssignmentRoleInputSchema.safeParse(input).success).toBe(true);
  for(const invalid of [{role:"PRIMARY"},{...input,collegeId:assignmentId},{...input,role:"ADMIN"},
    {...input,expectedUpdatedAt:"not a timestamp"},{...input,expectedUpdatedAt:null}]){
    expect(changeCourseTeachingAssignmentRoleInputSchema.safeParse(invalid).success).toBe(false);
  }
 });
 it("refuses a stale saved revision even if two writes share the same millisecond",()=>{
  const start=new Date(token);
  expect(teachingAssignmentRevisionMatches(start,token)).toBe(true);
  const next=nextTeachingAssignmentRevision(start,new Date(token));
  expect(next.getTime()).toBe(start.getTime()+1);
  expect(teachingAssignmentRevisionMatches(next,token)).toBe(false);
  expect(teachingAssignmentRevisionMatches(next,next.toISOString())).toBe(true);
  const later=nextTeachingAssignmentRevision(next,new Date("2026-10-18T12:34:50.000Z"));
  expect(later.getTime()).toBe(next.getTime()+1);
  expect(teachingAssignmentRevisionMatches(later,next.toISOString())).toBe(false);
  expect(teachingAssignmentRevisionMatches(new Date(Number.NaN),token)).toBe(false);
  expect(teachingAssignmentRevisionMatches(start,"invalid")).toBe(false);
  expect(()=>nextTeachingAssignmentRevision(new Date(Number.NaN))).toThrow("Invalid teaching assignment revision");
 });
 it("retains exact scope, row locks, active membership and primary-teacher uniqueness in the same transaction",()=>{
  const service=source("src/modules/courses/teaching-assignment-service.ts");
  const change=service.slice(service.indexOf("export async function changeCourseTeachingAssignmentRole("));
  expect(change).toContain("changeCourseTeachingAssignmentRoleInputSchema.parse(roleInput)");
  expect(change).toContain("requirePermission(context,\"courses.manage\"");
  expect(change).toContain(".for(\"update\")");
  expect(change).toContain("teachingAssignmentRevisionMatches(locked.updatedAt,expectedUpdatedAt)");
  expect(change).toContain("nextTeachingAssignmentRevision(locked.updatedAt)");
  expect(change).toContain("scope.collegeId!==current.collegeId");
  expect(change).toContain("scope.organizationId!==current.organizationId");
  expect(change).toContain("member.status!==\"ACTIVE\"");
  expect(change).toContain("FACULTY_ROLE_REQUIRED");
  expect(change).toContain("teachingAssignmentConflict(");
  expect(change).toContain("if(locked.role===role)return locked");
  expect(change).toContain("recordActivityEventInTransaction(tx,context");
  expect(change.indexOf("teachingAssignmentRevisionMatches(")).toBeLessThan(change.indexOf(".update(courseTeachingAssignments)"));
  expect(change.indexOf(".update(courseTeachingAssignments)")).toBeLessThan(change.indexOf("recordActivityEventInTransaction(tx,context"));
  const schema=source("src/db/schema/courses.ts");
  expect(schema).toContain("course_teaching_assignments_active_primary_uq");
 });
 it("passes only the persisted version from directory into a single guarded UI PATCH",()=>{
  const page=source("src/app/(authenticated)/admin/faculty-assignment/page.tsx");
  const readService=source("src/modules/admin-ui/super-admin-faculty-assignments-service.ts");
  const ui=source("src/components/admin/super-admin-faculty-assignment-create.tsx");
  expect(readService).toContain("revision:row.updatedAt.toISOString()");
  expect(page).toContain("role&&row.revision?");
  expect(page).toContain("revision={row.revision}");
  expect(ui).toContain("useGuardedAction");
  expect(ui).toContain("body:JSON.stringify({role,expectedUpdatedAt:revision})");
  expect(ui).toContain("This teaching assignment changed in another tab. Refresh before editing again.");
 });
});
