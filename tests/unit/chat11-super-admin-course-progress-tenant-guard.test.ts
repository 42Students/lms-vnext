import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {parseSuperAdminCourseProgressParams,parseSuperAdminStudentProgressParams} from "@/modules/courses/super-admin-course-progress-query";

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
 it("denies malformed, duplicated, extra-scope and missing learner offering IDs",()=>{
  const valid="11111111-1111-4111-8111-111111111111";
  expect(parseSuperAdminStudentProgressParams({offeringId:valid})).toBe(valid);
  for(const query of [
   {},{offeringId:["a","b"]},{offeringId:"../foreign"},
   {offeringId:"123"},{offeringId:""},{offeringId:valid,collegeId:valid},
   {offeringId:valid,organizationId:valid},{offeringId:valid,page:"2"},
  ])expect(parseSuperAdminStudentProgressParams(query)).toBeNull();
 });
 it("authenticates Super Admin before offering query fallback and student data retrieval",()=>{
  const source=readFileSync("src/app/(authenticated)/admin/course-progress/students/page.tsx","utf8");
  const auth=source.indexOf('requirePermission(context,"admin-scope.select")');
  const parse=source.indexOf('parseSuperAdminStudentProgressParams({offeringId:raw["offeringId"]}):null');
  const read=source.indexOf("getSuperAdminStudentCourseProgress(context,{...selection,page:requestedPage})");
  expect(auth).toBeGreaterThan(-1);
  expect(auth).toBeLessThan(parse);
  expect(parse).toBeLessThan(read);
  expect(source).toContain("Student Course Progress");
  expect(source).toContain("Not measured");
 });
});
