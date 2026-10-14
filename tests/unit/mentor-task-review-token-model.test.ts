import {describe,expect,it} from "vitest";
import {mentorTaskReviewTokenSchema,mentorTaskReviewTokenMatches}
 from "@/modules/projects/mentor-task-review-token-model";
describe("Mentor task feedback optimistic token",()=>{
 it("rejects forged and unconfirmed input",()=>{
  const ok={expectedUpdatedAt:"2026-10-14T15:00:00.123Z",confirmed:true};
  expect(mentorTaskReviewTokenSchema.safeParse(ok).success).toBe(true);
  expect(mentorTaskReviewTokenSchema.safeParse({...ok,confirmed:false}).success).toBe(false);
  expect(mentorTaskReviewTokenSchema.safeParse({...ok,collegeId:"forged"}).success).toBe(false);
 });
 it("compares the JS-visible millisecond timestamp",()=>{
  const d=new Date("2026-10-14T15:00:00.123Z");
  expect(mentorTaskReviewTokenMatches(d,d.toISOString())).toBe(true);
  expect(mentorTaskReviewTokenMatches(d,"2026-10-14T15:00:00.124Z")).toBe(false);
 });
});
