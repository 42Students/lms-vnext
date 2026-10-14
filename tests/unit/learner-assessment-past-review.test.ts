import {describe,expect,it} from "vitest";
import {learnerAssessmentPastReview} from "@/modules/placements/learner-assessment-past-review-model";
const at=(time:string|null)=>({scheduledAt:time,exception:null});
describe("learner past assessments are not automatic overdue decisions",()=>{
 it("counts only past UTC instants, including rescheduled events",()=>{
  const now=Date.parse("2026-10-16T08:00:00Z");
  const rows=[at("2026-10-16T07:59:59Z"),at("2026-10-16T08:00:00Z"),at(null),
    {scheduledAt:"2026-10-15T08:00:00Z",exception:{scheduledAt:"2026-10-17T08:00:00Z"}}];
  expect(learnerAssessmentPastReview(rows,now).count).toBe(1);
 });
 it("does not claim a submitted, missed or completed result",()=>{
  const notice=learnerAssessmentPastReview([at("2026-10-15T08:00:00Z")],Date.parse("2026-10-16T08:00:00Z")).notice;
  expect(notice).toContain("does not establish");
  expect(notice).toContain("Official outcomes");
 });
});
