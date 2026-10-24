import {describe,expect,it} from "vitest";
import {mentorSubmissionIdentity} from
 "@/modules/projects/mentor-submission-attribution-model";
describe("Mentor final-delivery attribution",()=>{
 it("shows the recorded current submitter and revision number",()=>{
  const result=mentorSubmissionIdentity({
   version:2,status:"SUBMITTED",submittedByMembershipId:"member-1",
   submittedAt:"2026-10-24T11:20:00Z",legacySubmittedByName:null,
  },[{membershipId:"member-1",displayName:"Maya"}]);
  expect(result).toEqual({
   attempt:"Attempt 2 · revised delivery",submitter:"Maya",
   source:"CURRENT_MEMBER",submittedAt:"2026-10-24T11:20:00.000Z",
  });
 });
 it("keeps verified imported author name when removed from the roster",()=>{
  const result=mentorSubmissionIdentity({
   version:1,status:"APPROVED",submittedByMembershipId:null,
   submittedAt:null,legacySubmittedByName:"Former Team Lead",
  },[]);
  expect(result).toEqual({
   attempt:"First attempt",submitter:"Former Team Lead",
   source:"HISTORIC",submittedAt:null,
  });
 });
 it("never invents a team-lead designation or submission time",()=>{
  const result=mentorSubmissionIdentity({
   version:3,status:"DRAFT",submittedByMembershipId:"former",
   submittedAt:null,legacySubmittedByName:null,
  },[]);
  expect(result.submitter).toBe("Submitter not recorded");
  expect(result.source).toBe("UNKNOWN");
  expect(result.submittedAt).toBeNull();
 });
 it("ignores malformed imported date instead of rendering Invalid Date",()=>{
  const result=mentorSubmissionIdentity({
   version:1,status:"SUBMITTED",submittedByMembershipId:null,
   submittedAt:"not-a-date",legacySubmittedByName:null,
  },[]);
  expect(result.submittedAt).toBeNull();
 });
});
