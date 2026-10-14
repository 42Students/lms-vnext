import {describe,expect,it} from "vitest";
import {projectTpoApplicantDetail,tpoApplicantDetailQuerySchema} from "@/modules/placements/tpo-applicant-detail-model";
describe("TPO applicant detail projection",()=>{
 it("uses latest APPLIED round version and never converts PASS into employer selection",()=>{
  const model=projectTpoApplicantDetail({status:"SUBMITTED",screeningStatus:"SHORTLISTED"},[
   {roundId:"r1",roundName:"Tech",kind:"INTERVIEW",version:1,outcome:"HOLD",appliedAt:null},
   {roundId:"r1",roundName:"Tech",kind:"INTERVIEW",version:2,outcome:"PASS",appliedAt:"2026-10-14T12:00:00Z"},
  ],[
   {offerId:"o1",version:1,status:"ISSUED",roleTitle:"Engineer",
    annualCtcInr:null,issuedAt:"2026-10-14T12:00:00Z",expiresAt:null,joiningStatus:"JOINED"},
  ]);
  expect(model.screening).toBe("SHORTLISTED");
  expect(model.appliedRoundResults).toHaveLength(1);
  expect(model.appliedRoundResults[0]?.outcome).toBe("PASS");
  expect(model.finalEmployerSelectionAvailable).toBe(false);
  expect(model.offers[0]?.joiningStatus).toBeNull();
 });
 it("retains withdrawn application state, honors accepted joining evidence, and rejects forged scope",()=>{
  const model=projectTpoApplicantDetail({status:"WITHDRAWN",screeningStatus:"SHORTLISTED"},[],[
   {offerId:"o1",version:2,status:"ACCEPTED",roleTitle:"Engineer",annualCtcInr:500000,
    issuedAt:"2026-10-14T12:00:00Z",expiresAt:null,joiningStatus:"JOINED"},
  ]);
  expect(model.screening).toBe("WITHDRAWN");
  expect(model.offers[0]?.joiningStatus).toBe("JOINED");
  const valid={jobId:"550e8400-e29b-41d4-a716-446655440000",applicationId:"550e8400-e29b-41d4-a716-446655440001"};
  expect(tpoApplicantDetailQuerySchema.safeParse(valid).success).toBe(true);
  expect(tpoApplicantDetailQuerySchema.safeParse({...valid,collegeId:"attacker"}).success).toBe(false);
 });
});
