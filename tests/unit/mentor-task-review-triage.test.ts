import {describe,expect,it} from "vitest";
import {mentorTaskReviewQuerySchema,mentorTaskReviewHref}
  from "@/modules/projects/mentor-task-review-model";
describe("Mentor pending task review triage",()=>{
  it("validates and preserves priority/order selection in links",()=>{
    const q=mentorTaskReviewQuerySchema.parse({
      priority:"CRITICAL",order:"OLDEST",search:"lesson",page:"2",pageSize:"20",
    });
    expect(q).toMatchObject({priority:"CRITICAL",order:"OLDEST",page:2});
    const href=mentorTaskReviewHref(q);
    expect(href).toContain("priority=CRITICAL");
    expect(href).toContain("order=OLDEST");
    expect(mentorTaskReviewQuerySchema.safeParse({...q,collegeId:"forged"}).success).toBe(false);
    expect(mentorTaskReviewQuerySchema.safeParse({...q,priority:"DANGER"}).success).toBe(false);
  });
  it("has safe backward-compatible defaults",()=>{
    expect(mentorTaskReviewQuerySchema.parse({})).toMatchObject({
      priority:"ALL",order:"NEWEST",page:1,pageSize:20,
    });
    expect(mentorTaskReviewHref({})).toBe("/mentor/task-reviews");
  });
});
