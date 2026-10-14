import {describe,expect,it} from "vitest";
import {learnerAssessmentMissingSchedule} from "@/modules/placements/learner-assessment-missing-schedule-model";
describe("learner assessment no recorded schedule",()=>{
 it("does not mistake an unpublished time for a provider deadline",()=>{
  const value=learnerAssessmentMissingSchedule([
   {scheduledAt:null,exception:null,testUrl:"https://exam.example.test"},
   {scheduledAt:null,exception:null,testUrl:null},
   {scheduledAt:"2026-10-17T00:00:00Z",exception:null,testUrl:null},
  ]);
  expect(value.count).toBe(2);
  expect(value.missingLinkCount).toBe(1);
  expect(value.notice).toContain("may still set a separate deadline");
 });
 it("approved reschedule counts as dated even when original schedule is absent",()=>{
  expect(learnerAssessmentMissingSchedule([
   {scheduledAt:null,exception:{scheduledAt:"2026-10-18T00:00:00Z"},testUrl:null}
  ]).count).toBe(0);
 });
});
