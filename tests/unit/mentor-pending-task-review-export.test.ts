import {describe,expect,it} from "vitest";
import {mentorPendingTaskReviewCsv} from "@/modules/projects/mentor-pending-task-review-export";
describe("Mentor pending task review CSV privacy",()=>{
 it("neutralizes unsafe registered titles and omits private submissions",()=>{
  const csv=mentorPendingTaskReviewCsv([{
   id:"review",projectTitle:"=Injected",taskTitle:"+bad",priority:"HIGH",version:1,
   submittedAt:new Date("2026-10-14T05:30:00Z"),
  }],0);
  expect(csv).toContain("'=Injected");
  expect(csv).toContain("'+bad");
  expect(csv).toContain("IST");
  expect(csv).not.toContain("submission_url");
  expect(csv).not.toContain("learner_email");
 });
 it("marks omitted rows",()=>{
  expect(mentorPendingTaskReviewCsv([],4)).toContain("4 additional matching reviews");
 });
});
