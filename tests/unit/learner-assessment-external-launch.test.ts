import {describe,expect,it} from "vitest";
import {learnerAssessmentExternalLaunch} from "@/modules/placements/learner-assessment-external-launch-model";
const input={href:"https://exam.example.test/start",roundName:"Aptitude",scheduledAt:"2026-10-16T08:00:00Z"};
describe("external assessment exit confirmation",()=>{
 it("warns only within inclusive 30 minute fixed-clock window",()=>{
  expect(learnerAssessmentExternalLaunch(input,Date.parse("2026-10-16T07:30:00Z"))?.urgent).toBe(true);
  expect(learnerAssessmentExternalLaunch(input,Date.parse("2026-10-16T07:29:59Z"))?.urgent).toBe(false);
  expect(learnerAssessmentExternalLaunch(input,Date.parse("2026-10-16T08:00:00Z"))?.urgent).toBe(true);
  expect(learnerAssessmentExternalLaunch(input,Date.parse("2026-10-16T08:00:01Z"))?.urgent).toBe(false);
 });
 it("refuses dangerous URLs and treats unspecified schedule as no known deadline",()=>{
  expect(learnerAssessmentExternalLaunch({...input,href:"javascript:alert(1)"},0)).toBeNull();
  expect(learnerAssessmentExternalLaunch({...input,scheduledAt:null},0)?.urgent).toBe(false);
 });
});
