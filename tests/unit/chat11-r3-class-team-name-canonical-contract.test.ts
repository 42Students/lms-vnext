import {expect,it} from "vitest";
import {planClassTeamWorkspaceNames} from "@/modules/projects/class-team-workspace-names";
const a="11111111-1111-4111-8111-111111111111",b="22222222-2222-4222-8222-222222222222";
it("rejects Unicode-equivalent names even if preview validation was skipped",()=>{
 expect(()=>planClassTeamWorkspaceNames("Capstone","capstone",[
  {name:"Team One",membershipIds:[a]},{name:"Ｔeam  One",membershipIds:[b]},
 ])).toThrow("Duplicate team name");
});
it("accepts unique workspace names with deterministic slugs",()=>{
 expect(planClassTeamWorkspaceNames("Capstone","capstone",[
  {name:"North",membershipIds:[a]},{name:"South",membershipIds:[b]},
 ]).map(x=>x.slug)).toEqual(["capstone-team-1","capstone-team-2"]);
});
