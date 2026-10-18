import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
 clampHrActivityPage,hrActivityQuerySchema,hrActivityHasNext,
} from "@/modules/placements/hr-job-activity-model";

describe("HR-BREAK-ACTIVITY-PAGE-13: stale HR activity page and scoped count",()=>{
 it.each([
  {page:1,total:0,limit:40,expected:1},
  {page:9000,total:0,limit:40,expected:1},
  {page:2,total:1,limit:40,expected:1},
  {page:9000,total:40,limit:40,expected:1},
  {page:9000,total:41,limit:40,expected:2},
  {page:2,total:41,limit:40,expected:2},
  {page:9000,total:105,limit:40,expected:3},
 ])("recovers page $page among $total scoped events",({page,total,limit,expected})=>{
  expect(clampHrActivityPage(page,total,limit)).toBe(expected);
 });
 it("keeps strict incoming query validation before data access",()=>{
  expect(hrActivityQuerySchema.safeParse({page:10001}).success).toBe(false);
  expect(hrActivityQuerySchema.safeParse({page:0}).success).toBe(false);
  expect(hrActivityQuerySchema.safeParse({q:["owner","foreign"]}).success).toBe(false);
  expect(hrActivityHasNext(41,40)).toBe(true);
  expect(hrActivityHasNext(40,40)).toBe(false);
 });
 it("treats NaN, unsafe counts and invalid limits as a bounded first page",()=>{
  expect(clampHrActivityPage(Infinity,41,40)).toBe(1);
  expect(clampHrActivityPage(-100,41,40)).toBe(1);
  expect(clampHrActivityPage(999,Number.NaN,40)).toBe(1);
  expect(clampHrActivityPage(999,-1,0)).toBe(1);
 });
 it("only the authorized employer's selected college and job IDs enter both count and page queries",()=>{
  const source=readFileSync("src/modules/placements/hr-job-activity-service.ts","utf8");
  expect(source).toContain("context.recruiter!.companyId");
  expect(source).toContain("eq(activityEvents.collegeId,collegeId)");
  expect(source).toContain("inArray(activityEvents.subjectId,ids)");
  expect(source).toContain("clampHrActivityPage(query.page,Number(count?.total??0),query.limit)");
  expect(source).toContain("(effectivePage-1)*query.limit");
  expect(source).toContain("page:effectivePage");
  const page=readFileSync("src/app/(authenticated)/hr/activity/page.tsx","utf8");
  expect(page).toContain("Page {result.page}");
  expect(page).not.toContain("input.data.page+1");
 });
});
