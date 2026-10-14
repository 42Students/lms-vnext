import {describe,expect,it} from "vitest";
import {hrTeamSearchSchema,searchHrTeam} from "@/modules/placements/hr-team-search-model";
const team=[{displayName:"Asha Rao",title:"Talent Lead",email:"asha@company.test"},
 {displayName:"Ravi",title:"Recruiter",email:"ravi@company.test"}];
describe("HR team filter",()=>{
 it("matches only authorized team entries by name, role or email",()=>{
  expect(searchHrTeam(team,"TALENT")).toEqual([team[0]]);
  expect(searchHrTeam(team,"ravi@")).toEqual([team[1]]);
  expect(searchHrTeam(team,"  ")).toEqual(team);
 });
 it("bounds input length",()=>{
  expect(hrTeamSearchSchema.safeParse("x".repeat(121)).success).toBe(false);
 });
});
