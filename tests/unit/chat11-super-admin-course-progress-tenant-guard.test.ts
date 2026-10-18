import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {parseSuperAdminCourseProgressParams} from "@/modules/courses/super-admin-course-progress-query";

describe("SA-tenants-modules-COURSE-PROGRESS-07 authoritative scope and strict URL state",()=>{
 it("retains supported user filters with safe defaults",()=>{
  expect(parseSuperAdminCourseProgressParams({}))
   .toMatchObject({q:"",status:"ACTIVE",page:1});
  expect(parseSuperAdminCourseProgressParams({
   q:"  Algorithms  ",status:"ARCHIVED",page:"3",courseCode:"CS101",cohortCode:"2026",
  })).toMatchObject({
   q:"Algorithms",status:"ARCHIVED",page:3,courseCode:"CS101",cohortCode:"2026",
  });
 });
 it("rejects duplicated, unknown and forged college/organization filters",()=>{
  for(const input of [
   {page:["1","2"]},{status:["ALL","ACTIVE"]},{q:["abc","def"]},
   {collegeId:"other"},{organizationId:"other"},{offeringId:"foreign"},
   {tab:"unknown"},{page:"0"},{page:"-1"},{page:"+1"},
   {page:"1e3"},{page:"0x10"},{page:" 2 "},{page:"02"},
   {page:"1001"},{page:"Infinity"},{status:"DELETED"},
  ]){
   expect(parseSuperAdminCourseProgressParams(input)).toBeNull();
  }
 });
 it("keeps Super Admin role gate ahead of bad-filter recovery and data access",()=>{
  const source=readFileSync("src/app/(authenticated)/admin/course-progress/page.tsx","utf8");
  const role=source.indexOf('requirePermission(context,"admin-scope.select")');
  const filters=source.indexOf("parseSuperAdminCourseProgressParams(await searchParams)");
  const invalid=source.indexOf("if (!parsed)");
  const data=source.indexOf("listCollegeCourseProgress(context, parsed)");
  expect(role).toBeGreaterThan(-1);
  expect(role).toBeLessThan(filters);
  expect(filters).toBeLessThan(invalid);
  expect(invalid).toBeLessThan(data);
  expect(source).toContain('if (!context.adminScope?.collegeId)');
  expect(source).toContain("getSuperAdminLearningFilterOptions(context)");
 });
});
