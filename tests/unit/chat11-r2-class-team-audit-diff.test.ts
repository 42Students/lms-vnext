import {expect,it} from "vitest";
import {diffTeamMembership} from "@/modules/projects/class-team-member-diff";
const a="learner-a",b="learner-b";
it("rejects an ambiguous prechange roster rather than hiding a duplicate",()=>{
 expect(()=>diffTeamMembership([{name:"A",membershipIds:[a]},{name:"B",membershipIds:[a,b]}],[])).toThrow("TEAM_MEMBERSHIP_DUPLICATE");
});
it("rejects an ambiguous postchange roster",()=>{
 expect(()=>diffTeamMembership([],[{name:"A",membershipIds:[a,a]}])).toThrow("TEAM_MEMBERSHIP_DUPLICATE");
});
it("reports an exact transfer without inventing additions or removals",()=>{
 expect(diffTeamMembership([{name:"A",membershipIds:[a,b]}],[{name:"A",membershipIds:[a]},{name:"B",membershipIds:[b]}])).toEqual({
  added:[],removed:[],moved:[{membershipId:b,from:"A",to:"B"}],
 });
});
