import {describe,expect,it} from "vitest";
import {mentorTaskReviewLiteralSearch,mentorTaskReviewSummary,mentorTaskReviewTargetHref}
 from "@/modules/projects/mentor-task-review-model";
describe("Mentor task review queue model",()=>{
 it("clamps out-of-range pages after counting",()=>{
  expect(mentorTaskReviewSummary({total:21,page:999,pageSize:20}))
   .toEqual({total:21,page:2,pageSize:20,totalPages:2,first:21,last:21});
  expect(mentorTaskReviewSummary({total:0,page:999,pageSize:20}))
   .toMatchObject({page:1,first:0,last:0});
 });
 it("escapes wildcard search and creates a validated exact-task link",()=>{
  expect(mentorTaskReviewLiteralSearch("100%_")).toBe("100\\%\\_");
  const a="00000000-0000-4000-8000-000000000001";
  const b="00000000-0000-4000-8000-000000000002";
  expect(mentorTaskReviewTargetHref(a,b)).toBe(
   "/mentor/projects/"+a+"?tab=board#mentor-task-"+b);
  expect(()=>mentorTaskReviewTargetHref(a,"wrong")).toThrow();
 });
});
