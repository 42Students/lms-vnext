import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {
 COLLEGE_APPLICATION_TRANSITIONS,COLLEGE_APPLICATION_CORRECTIONS,
 LEGACY_APPLICATION_STAGE_SOURCE,collegeStageOptionsForLegacyStatus,
 collegeStageCommandSchema,
} from "@/modules/placements/college-stage-action-model";

describe("college applicant status transition and evidence parity",()=>{
 it("preserves legacy forward statuses while restricting exceptional reversals",()=>{
  expect(COLLEGE_APPLICATION_TRANSITIONS.APPLIED).toEqual(["SHORTLISTED","REJECTED"]);
  expect(COLLEGE_APPLICATION_TRANSITIONS.INTERVIEW).toEqual([
   "SHORTLISTED","ASSESSMENT","OFFERED","WAITLISTED","REJECTED"]);
  expect(COLLEGE_APPLICATION_TRANSITIONS.OFFERED).toContain("HIRED");
  expect(COLLEGE_APPLICATION_TRANSITIONS.HIRED).toEqual(["OFFERED"]);
  expect(COLLEGE_APPLICATION_CORRECTIONS.SHORTLISTED).toContain("APPLIED");
  expect(collegeStageOptionsForLegacyStatus("WITHDRAWN").move).toEqual([]);
  expect(collegeStageOptionsForLegacyStatus("unknown")).toEqual({move:[],correct:[]});
 });
 it("keeps accepted offers and confirmed joining as the persisted source of truth",()=>{
  expect(LEGACY_APPLICATION_STAGE_SOURCE.OFFERED).toContain("placement_offers");
  expect(LEGACY_APPLICATION_STAGE_SOURCE.HIRED).toContain("placement_joining_outcomes");
  const service=readFileSync("src/modules/placements/college-application-stage-service.ts","utf8");
  expect(service).toContain("Issue an actual offer before moving this application to Offered.");
  expect(service).toContain("Confirm an accepted offer's joining outcome before marking Hired.");
  expect(service).toContain("placementCollegeApplicationStageHistory");
  expect(service).toContain("placementApplicationScreeningHistory");
 });
 it("retains explicit confirmation and default in-app learner notice, not silent email delivery",()=>{
  const id="00000000-0000-4000-8000-000000000011";
  const command=collegeStageCommandSchema.safeParse({
   action:"MOVE",applicationIds:[id],stage:"INTERVIEW",confirmed:true,
  });
  expect(command.success).toBe(true);
  if(command.success){
   expect(command.data.notifyLearnerInApp).toBe(true);
   expect(command.data.notifyByEmail).toBe(false);
  }
  expect(collegeStageCommandSchema.safeParse({
   action:"MOVE",applicationIds:[id],stage:"WITHDRAWN",confirmed:true,
  }).success).toBe(false);
 });
});
