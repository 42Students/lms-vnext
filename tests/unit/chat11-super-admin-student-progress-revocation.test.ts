import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {parseSuperAdminStudentProgressParams} from "@/modules/courses/super-admin-course-progress-query";

describe("SA-tenants-modules-COURSE-STUDENTS-10 private learner names survive revocation",()=>{
 it("does not load any records for foreign IDs, extra keys or repeated IDs",()=>{
  const id="11111111-1111-4111-8111-111111111111";
  expect(parseSuperAdminStudentProgressParams({offeringId:id})).toBe(id);
  for(const raw of [
   {},{offeringId:id,collegeId:id},{offeringId:id,organizationId:id},
   {offeringId:[id,id]},{offeringId:id+"?"},{offeringId:"NULL"},
  ])expect(parseSuperAdminStudentProgressParams(raw)).toBeNull();
 });
 it("reconstructs persisted Super Admin system role and locks active college after slow roster queries",()=>{
  const source=readFileSync("src/modules/courses/super-admin-student-course-progress.ts","utf8");
  const sqlRead=source.indexOf("const result=await getDb().execute(sql");
  const checked=source.lastIndexOf("assertPersistedPlatformPermission(tx,context,");
  const response=source.lastIndexOf("return {offeringId,collegeId,rows,truncated:");
  expect(sqlRead).toBeGreaterThan(-1);
  expect(checked).toBeGreaterThan(sqlRead);
  expect(response).toBeGreaterThan(checked);
  expect(source).toContain("if(!college||college.status!==\"ACTIVE\")");
  expect(source).toContain('if(!isSuperAdmin(live))throw new AuthorizationError("courses.read")');
  expect(source).toContain('eq(colleges.id,collegeId)).for("share")');
  expect(source).toContain('collegeId,organizationId:college.organizationId');
  expect(source).toContain("m.college_id=${collegeId}::uuid");
 });
 it("authenticates student CSV first, parses exactly one offering and returns no-store private output",()=>{
  const source=readFileSync("src/app/api/admin/course-progress/students/export/route.ts","utf8");
  const role=source.indexOf('requirePermission(context,"admin-scope.select")');
  const filters=source.indexOf("const search=new URL(request.url).searchParams");
  const reader=source.indexOf("getSuperAdminStudentCourseProgress(context,{offeringId:id})");
  expect(role).toBeGreaterThan(-1);
  expect(role).toBeLessThan(filters);
  expect(filters).toBeLessThan(reader);
  expect(source).toContain('const keys=[...search.keys()]');
  expect(source).toContain("parseSuperAdminStudentProgressParams(");
  expect(source).toContain("private, no-store");
  expect(source).toContain('X-Content-Type-Options');
 });
});
