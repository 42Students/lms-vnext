import {describe,expect,it} from "vitest";
import {scopedMentorInviteeEmails} from
 "@/modules/projects/mentor-google-invitee-selection-model";
const a="11111111-1111-4111-8111-111111111111";
const b="22222222-2222-4222-8222-222222222222";
const members=[
 {membershipId:a,email:"Mentor@school.edu",displayName:"Mentor"},
 {membershipId:b,email:"student@school.edu",displayName:"Student"},
];
describe("scoped calendar invitee selection",()=>{
 it("takes all or only authorized membership IDs, not caller addresses",()=>{
  expect(scopedMentorInviteeEmails(members))
   .toEqual(["mentor@school.edu","student@school.edu"]);
  expect(scopedMentorInviteeEmails(members,[b]))
   .toEqual(["student@school.edu"]);
 });
 it("never reuses a pre-revocation recipient list after draft promotion",()=>{
  const previouslyEligible=scopedMentorInviteeEmails(members,[b]);
  expect(previouslyEligible).toEqual(["student@school.edu"]);
  const currentRoster=members.filter(member=>member.membershipId!==b);
  // Explicit selected members who lost access must cause a retry state,
  // not a fallback to inviting the old address or the whole project.
  expect(()=>scopedMentorInviteeEmails(currentRoster,[b]))
   .toThrow("INVALID_GOOGLE_INVITEE_SELECTION");
  expect(scopedMentorInviteeEmails(currentRoster))
   .toEqual(["mentor@school.edu"]);
 });
 it("deduplicates case-insensitive current-recipient addresses",()=>{
  expect(scopedMentorInviteeEmails([
   ...members,{membershipId:"33333333-3333-4333-8333-333333333333",
    email:"STUDENT@SCHOOL.EDU ",displayName:"Duplicate address"},
   {membershipId:"44444444-4444-4444-8444-444444444444",
    email:null,displayName:"No provider email"},
  ])).toEqual(["mentor@school.edu","student@school.edu"]);
 });
 it("rejects duplicate, empty, out-of-roster, or unbounded selected lists",()=>{
  for(const ids of [[],[a,a],[a,"not-present"]]){
   expect(()=>scopedMentorInviteeEmails(members,ids))
    .toThrow("INVALID_GOOGLE_INVITEE_SELECTION");
  }
  expect(()=>scopedMentorInviteeEmails(members,
   Array.from({length:101},(_,i)=>String(i))))
   .toThrow("INVALID_GOOGLE_INVITEE_SELECTION");
 });
});
