import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {parseSuperAdminLearningQuery} from "@/modules/admin-ui/super-admin-learning-query-model";
import {adminLearningHref,adminLessonStats,adminProgressStats} from "@/modules/courses/admin-learning-read-model";

const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");

describe("SA-COURSES-CONTENT-AUDIT-03 lessons and progress list resilience",()=>{
 it("rejects duplicated, forged, overflowing and non-canonical admin lesson URL filters",()=>{
  const valid=parseSuperAdminLearningQuery({
   q:"  physics  ",status:"ALL",page:"2",courseCode:"CS101",cohortCode:"B2026",
  });
  expect(valid.success).toBe(true);
  if(!valid.success)return;
  expect(valid.data).toMatchObject({
   q:"physics",status:"ALL",page:2,courseCode:"CS101",cohortCode:"B2026",
  });
  const url=adminLearningHref("LESSONS",valid.data);
  expect(url).toContain("page=2");
  expect(url).toContain("cohortCode=B2026");
  for(const invalid of [
   {q:["bad"]},{page:["2"]},{page:"-1"},{page:"1.3"},
   {page:"1001"},{page:"Infinity"},{status:"GARBAGE"},
   {offeringId:"11111111-1111-4111-8111-111111111111"},
   {tenant:"other"},{cohortCode:"x".repeat(65)},
  ])expect(parseSuperAdminLearningQuery(invalid).success).toBe(false);
 });
 it("preserves an authorized directory after optional picker outage, but never presents failed data as empty",()=>{
  const lesson=read("src/app/(authenticated)/admin/lessons/page.tsx");
  const progress=read("src/app/(authenticated)/admin/course-progress/page.tsx");
  for(const page of [lesson,progress]){
   expect(page).toContain("parseSuperAdminLearningQuery(raw)");
   expect(page).toContain("Promise.allSettled([");
   expect(page).toContain('if(dataResult.status==="rejected")');
   expect(page).toContain('filtersResult.status==="rejected"');
   expect(page).toContain("Your selected filters are still applied");
  }
  expect(lesson).toContain('pathsResult.status==="fulfilled"');
  expect(lesson).toContain("Existing lessons remain visible");
  expect(lesson).toContain("Retry loading lessons");
  expect(progress).toContain("Retry loading course progress");
  expect(progress).not.toContain("throw dataResult.reason");
 });
 it("retains meaning of per-offering progress, never sums distinct students",()=>{
  const metrics=adminProgressStats([
   {recordedRows:4,completedRows:2,learnersWithRecords:3},
   {recordedRows:5,completedRows:4,learnersWithRecords:3},
  ]);
  expect(metrics).toMatchObject({
   offerings:2,contentRecords:9,completedContentRecords:6,
   perOfferingLearnerCounts:[3,3],
  });
  expect(adminLessonStats([])).toEqual({lessons:0,authored:0,published:0});
 });
});
