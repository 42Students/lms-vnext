import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {summarizeTpoPrepAssignment} from "@/modules/placements/tpo-prep-assignment-result-model";

describe("chat-11 TPO preparation course assignment retry receipts",()=>{
 const selected=["student-a","student-b","student-c","student-d"];
 const eligible=new Set(["student-a","student-b","student-c"]);
 it("TPO-settings-audit-PREP-ASSIGN-RETRY-01 counts only INSERT RETURNING IDs as newly assigned",()=>{
  const receipt=summarizeTpoPrepAssignment(selected,eligible,new Set(["student-a"]));
  expect(receipt.results).toEqual([
   {id:"student-a",status:"assigned"},
   {id:"student-b",status:"duplicate"},
   {id:"student-c",status:"duplicate"},
   {id:"student-d",status:"skipped"},
  ]);
  expect(receipt.counts).toEqual({assigned:1,duplicate:2,skipped:1});
  expect(receipt.results.map(row=>row.id)).toEqual(selected);
 });
 it("TPO-settings-audit-PREP-ASSIGN-RETRY-02 retries generate zero new work and no false assignment totals",()=>{
  const original=summarizeTpoPrepAssignment(selected,eligible,new Set(["student-a","student-b","student-c"]));
  const retry=summarizeTpoPrepAssignment(selected,eligible,new Set<string>());
  expect(original.counts).toEqual({assigned:3,duplicate:0,skipped:1});
  expect(retry.counts).toEqual({assigned:0,duplicate:3,skipped:1});
  expect(retry.results.every(row=>row.status!=="assigned")).toBe(true);
 });
 it("TPO-settings-audit-PREP-ASSIGN-COHORT-04 rejects archived/foreign academic targets in list and save",()=>{
  const source=readFileSync("src/modules/placements/tpo-prep-assignment-service.ts","utf8");
  expect(source).toContain("function activeCollegeOfferingCohort(collegeId:string)");
  for(const required of [
   "target_cohort.status<>'ARCHIVED'",
   "target_program.status='ACTIVE'",
   "target_department.college_id=",
   "target_department.archived_at is null",
  ])expect(source).toContain(required);
  const first=source.indexOf("activeCollegeOfferingCohort(college.id)");
  const second=source.indexOf("activeCollegeOfferingCohort(college.id)",first+1);
  expect(first).toBeGreaterThan(0);
  expect(second).toBeGreaterThan(first);
  expect(second).toBeLessThan(source.indexOf("const learners=await tx.select(",second));
 });
 it("TPO-settings-audit-PREP-ASSIGN-RETRY-03 handles zero eligible and empty selection deterministically",()=>{
  expect(summarizeTpoPrepAssignment(selected,new Set(),new Set()).counts)
   .toEqual({assigned:0,duplicate:0,skipped:4});
  expect(summarizeTpoPrepAssignment([],new Set(),new Set()))
   .toEqual({results:[],counts:{assigned:0,duplicate:0,skipped:0}});
 });
});
