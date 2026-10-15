import {describe,expect,it} from "vitest";
import {hrTeamRosterMessage} from "@/modules/placements/hr-team-roster-message-model";
describe("HR company team empty state distinctions",()=>{
 it("shows only-you only with persisted self as sole team member",()=>{
  expect(hrTeamRosterMessage([{isYou:true}],1,"",1)).toContain("Only you so far");
  expect(hrTeamRosterMessage([{isYou:false}],1,"",1)).toBeNull();
  expect(hrTeamRosterMessage([],0,"",0)).toContain("No active teammates");
 });
 it("does not mistake a search miss or empty offset page for only-you",()=>{
  expect(hrTeamRosterMessage([{isYou:true},{isYou:false}],0,"no match",0))
   .toContain("match this search");
  expect(hrTeamRosterMessage([{isYou:true},{isYou:false}],2,"",0))
   .toContain("earlier page");
 });
});
