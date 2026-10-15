import { describe,expect,it } from "vitest";
import { RECRUITER_STAGE_LEGACY_LABELS as stage, deriveTpoRecruiterLeadStage } from "@/modules/placements/tpo-recruiter-lead-policy";
describe("T-S1-02 exact recruiter stage wording",()=>{
 it("matches the legacy dev labels",()=>{
  expect(stage).toEqual({
   NEW:"New", CONTACTED:"Contacted", INVITED:"Invited", JOINED:"Joined",
   DRIVE_PLANNED:"Drive planned", RECRUITED:"Recruited", NOT_NOW:"Not now",
  });
 });
 it("recruited overrides planned, and NOT_NOW overrides all",()=>{
  const facts={manualStage:"NEW",hasRecruitedFact:true,hasPlannedDriveFact:true,
   recruiterUserId:"r",inviteSentAt:new Date("2026-10-01T00:00:00Z")};
  expect(deriveTpoRecruiterLeadStage(facts)).toBe("RECRUITED");
  expect(deriveTpoRecruiterLeadStage({...facts,manualStage:"NOT_NOW"})).toBe("NOT_NOW");
  expect(deriveTpoRecruiterLeadStage({...facts,hasRecruitedFact:false})).toBe("DRIVE_PLANNED");
 });
});
