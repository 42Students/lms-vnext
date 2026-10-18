import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {adminAssessmentExportHref,adminAssessmentQuerySchema} from "@/modules/courses/admin-assessment-directory-model";

const parse=(href:string)=>new URL(href,"https://example.invalid");

describe("Super Admin assessment filtered export contracts",()=>{
 it("SA-academics-people-64 assignment CSV keeps the exact active course and audience filters, without paging",()=>{
  const filters=adminAssessmentQuerySchema.parse({
   q:"Concurrency & Locks",courseCode:"CS-401",status:"PUBLISHED",
   scope:"SECTION",page:4,
  });
  const href=parse(adminAssessmentExportHref("ASSIGNMENT",filters));
  expect(href.pathname).toBe("/api/admin/assignments/export");
  expect(Object.fromEntries(href.searchParams)).toEqual({
   q:"Concurrency & Locks",status:"PUBLISHED",courseCode:"CS-401",scope:"SECTION",
  });
  expect(href.searchParams.has("page")).toBe(false);
  expect(href.searchParams.has("results")).toBe(false);
 });
 it("SA-academics-people-65 quiz CSV carries published-results state but cannot emit stale pagination",()=>{
  const filters=adminAssessmentQuerySchema.parse({
   q:"Question set",courseCode:"CS204",status:"CLOSED",scope:"SHARED",
   results:"HIDDEN",page:9,
  });
  const href=parse(adminAssessmentExportHref("QUIZ",filters));
  expect(href.pathname).toBe("/api/admin/quizzes/export");
  expect(Object.fromEntries(href.searchParams)).toEqual({
   q:"Question set",status:"CLOSED",courseCode:"CS204",scope:"SHARED",results:"HIDDEN",
  });
  expect(href.searchParams.has("page")).toBe(false);
 });
 it("SA-academics-people-64/65 export links default to selected-college scope, not supplied IDs",()=>{
  for(const kind of ["QUIZ","ASSIGNMENT"] as const){
   const href=parse(adminAssessmentExportHref(kind,adminAssessmentQuerySchema.parse({})));
   expect(href.search).toBe("");
   expect(href.searchParams.has("collegeId")).toBe(false);
   expect(href.searchParams.has("organizationId")).toBe(false);
  }
 });
 it("SA-academics-people-64/65 pages use the shared filtered export link rather than dropping scope",()=>{
  const base=new URL("../../",import.meta.url);
  const assignment=readFileSync(new URL("src/app/(authenticated)/admin/assignments/page.tsx",base),"utf8");
  const quiz=readFileSync(new URL("src/app/(authenticated)/admin/quizzes/page.tsx",base),"utf8");
  expect(assignment).toContain('adminAssessmentExportHref("ASSIGNMENT",query.data)');
  expect(quiz).toContain('adminAssessmentExportHref("QUIZ",query.data)');
 });
});
