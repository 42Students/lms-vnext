import {describe,expect,it} from "vitest";
import {recruiterTeamDriveCounts,hrTeamAvatarInitial} from "@/modules/placements/recruiter-team-drive-count-model";
import {hrTeamRosterMessage} from "@/modules/placements/hr-team-roster-message-model";
describe("REC-calendar-messages-profile-34 recruiter team drive summary",()=>{
 const team=[{userId:"a"},{userId:"b"}];
 it("counts in-scope authoring and pending requests without double-counting approvals",()=>{
  const counts=recruiterTeamDriveCounts(team,[{id:"one",createdByUserId:"a"}],[
   {id:"r1",recruiterUserId:"a",approvedJobId:"one"},
   {id:"r2",recruiterUserId:"a",approvedJobId:null},
   {id:"r3",recruiterUserId:"b",approvedJobId:"two"},
   {id:"r4",recruiterUserId:"other",approvedJobId:null},
  ]);
  expect(counts.get("a")).toBe(2);
  expect(counts.get("b")).toBe(1);
  expect(counts.has("other")).toBe(false);
 });
 it("uses the legacy initial and single-colleague empty copy",()=>{
  expect(hrTeamAvatarInitial("Ada","ada@company.test")).toBe("A");
  expect(hrTeamAvatarInitial(null,"bob@company.test")).toBe("B");
  expect(hrTeamAvatarInitial(null,null)).toBe("R");
  expect(hrTeamRosterMessage([{isYou:true}],1,"",1)).toBe("Only you so far");
 });
});
