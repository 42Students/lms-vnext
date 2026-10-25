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
