import {describe,expect,it} from "vitest";
import {hrActivityQuerySchema,projectHrJobActivity,hrActivityEventFilter} from "@/modules/placements/hr-job-activity-model";
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
 });
});
