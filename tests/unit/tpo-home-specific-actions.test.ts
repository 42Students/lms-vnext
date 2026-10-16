import {describe,expect,it} from "vitest";
import {operationalHomeNeeds,buildTpoLegacyNextUp} from "@/modules/placements/tpo-home-next-up";
const q=(code:string,count=2)=>({code,priority:"MEDIUM" as const,jobId:"job-id",jobTitle:"Engineer",companyName:"Orbit",count});
describe("TPO-home-R03 precise Next up action semantics",()=>{
 it.each([
  ["SCREENING_PENDING","Review applications","Screen 2 applications"],
  ["RESULTS_AWAITING_APPLY","Apply results","2 round results are ready"],
  ["OFFERS_AWAITING_RESPONSE","Check offers","Follow up on 2 offers"],
  ["JOINING_OUTCOME_PENDING","Record joining","Record joining for 2 students"],
  ["DRIVE_NOT_SCHEDULED","Schedule rounds","Schedule 2 rounds"],
  ["EVALUATION_PLAN_MISSING","Set evaluation plan","Add an evaluation plan"],
 ])("%s has a fitting action and title", (code,action,title)=>{
  const [need]=operationalHomeNeeds([q(code)]);
  expect(need.title).toContain(title);
  expect(buildTpoLegacyNextUp({needsYou:[need],batches:[],checklist:[]})?.action).toBe(action);
  expect(need.link).toBe("/tpo/placements/jobs/job-id");
 });
 it("does not promote forgotten draft drives to the Next up card",()=>{
  expect(operationalHomeNeeds([q("JOB_DRAFT")])).toEqual([]);
  expect(buildTpoLegacyNextUp({needsYou:operationalHomeNeeds([q("JOB_DRAFT")]),batches:[],checklist:[]})).toBeNull();
 });
});
