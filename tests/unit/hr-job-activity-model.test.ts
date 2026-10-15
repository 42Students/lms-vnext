import {describe,expect,it} from "vitest";
import {hrActivityQuerySchema,projectHrJobActivity,hrActivityEventFilter,hrActivityHasNext,searchHrActivityJobs} from "@/modules/placements/hr-job-activity-model";
describe("HR hiring activity",()=>{
 it("filters cross-company and private event types without projecting sensitive summaries",()=>{
  const events=[
   {id:"a",subjectId:"owned",eventType:"placements.job.published",occurredAt:new Date("2026-10-14T00:00Z")},
   {id:"b",subjectId:"foreign",eventType:"placements.job.closed",occurredAt:new Date("2026-10-14T01:00Z")},
   {id:"c",subjectId:"owned",eventType:"placements.applicant.reviewed",occurredAt:new Date("2026-10-14T02:00Z")},
  ];
  expect(projectHrJobActivity(events,[{id:"owned",title:"Software Engineer"}])).toEqual([
   {id:"a",jobId:"owned",title:"Software Engineer",status:"Published",occurredAt:events[0]!.occurredAt},
  ]);
 });
 it("bounds read filters",()=>{
  expect(hrActivityQuerySchema.safeParse({limit:"101"}).success).toBe(false);
  expect(hrActivityQuerySchema.safeParse({collegeId:"bad"}).success).toBe(false);
  expect(hrActivityQuerySchema.safeParse({kind:"STUDENT"}).success).toBe(false);
  expect(hrActivityEventFilter("CLOSED")).toEqual(["placements.job.closed"]);
  expect(hrActivityEventFilter("ALL")).toHaveLength(2);
  expect(hrActivityQuerySchema.safeParse({page:0}).success).toBe(false);
  expect(hrActivityQuerySchema.safeParse({page:"2",kind:"PUBLISHED"}).success).toBe(true);
  expect(hrActivityQuerySchema.safeParse({page:"not-a-number"}).success).toBe(false);
  expect(hrActivityHasNext(41,40)).toBe(true);
  expect(hrActivityHasNext(40,40)).toBe(false);
  expect(hrActivityQuerySchema.safeParse({q:"x".repeat(121)}).success).toBe(false);
  expect(searchHrActivityJobs([{title:"Engineer"},{title:"Designer"}],"engi"))
    .toEqual([{title:"Engineer"}]);
 });
});
