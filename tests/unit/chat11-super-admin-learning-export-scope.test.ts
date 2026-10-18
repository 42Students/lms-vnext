import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {can} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";
const id="11111111-1111-4111-8111-111111111111";
const org="22222222-2222-4222-8222-222222222222";
const activeCollegeAdmin:RequestContext={
 user:{id:"33333333-3333-4333-8333-333333333333",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"44444444-4444-4444-8444-444444444444",collegeId:id,organizationId:org,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
 adminScope:null,
};
describe("SA-tenants-modules-COURSE-EXPORT-09 authenticated Super Admin CSV only",()=>{
 it("a College Admin membership is not a Super Admin system role",()=>{
  expect(can(activeCollegeAdmin,"admin-scope.select")).toBe(false);
  const superAdmin:RequestContext={
   user:{...activeCollegeAdmin.user,systemRoles:["SUPER_ADMIN"]},
   membership:null,adminScope:{collegeId:id,organizationId:org},
  };
  expect(can(superAdmin,"admin-scope.select")).toBe(true);
  const disabled:RequestContext={
   ...superAdmin,user:{...superAdmin.user,platformStatus:"DISABLED"},
  };
  expect(can(disabled,"admin-scope.select")).toBe(false);
 });
 it("requires Super Admin permission before query parsing and before reads for all four export kinds",()=>{
  const source=readFileSync("src/modules/admin-ui/super-admin-learning-csv-service.ts","utf8");
  const ctx=source.indexOf("const context=await getCurrentRequestContext()");
  const auth=source.indexOf('requirePermission(context,"admin-scope.select")');
  const parse=source.indexOf("const searchParams=new URL(request.url).searchParams");
  const rows=source.indexOf("listCollegeCourseProgress(context");
  expect(ctx).toBeGreaterThan(-1);
  expect(ctx).toBeLessThan(auth);
  expect(auth).toBeLessThan(parse);
  expect(parse).toBeLessThan(rows);
  expect(source).toContain('type Kind="LESSONS"|"PROGRESS"|"ASSIGNMENT"|"QUIZ"');
  expect(source).toContain("searchParams.getAll(key).length!==1");
  expect(source).toContain('headers:');
  expect(source).toContain("private, no-store");
  expect(source).toContain("X-Export-Truncated");
 });
});
