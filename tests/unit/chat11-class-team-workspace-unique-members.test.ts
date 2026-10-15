import {expect,it} from "vitest";
import {planClassTeamWorkspaceNames} from "@/modules/projects/class-team-workspace-names";
const one="11111111-1111-4111-8111-111111111111";
const two="22222222-2222-4222-8222-222222222222";
it("rejects duplicate learners even if called without the preview verifier",()=>{
 expect(()=>planClassTeamWorkspaceNames("Capstone","capstone",[
  {name:"Team 1",membershipIds:[one]},
  {name:"Team 2",membershipIds:[one]},
 ])).toThrow(/multiple teams/);
});
it("rejects duplicate team names and accepts unique membership assignments",()=>{
 expect(()=>planClassTeamWorkspaceNames("Capstone","capstone",[
  {name:"Team A",membershipIds:[one]},
  {name:"team a",membershipIds:[two]},
 ])).toThrow(/Duplicate team name/);
 const plan=planClassTeamWorkspaceNames("Capstone","capstone",[
  {name:"Alpha",membershipIds:[one]},
  {name:"Beta",membershipIds:[two]},
 ]);
 expect(plan.map(p=>p.slug)).toEqual(["capstone-team-1","capstone-team-2"]);
 expect(plan.map(p=>p.membershipIds.length)).toEqual([1,1]);
});
