import {describe,expect,it} from "vitest";
import {moveMemberBalanced} from "@/modules/projects/class-team-balanced-move";
const a="11111111-1111-4111-8111-111111111111";
const b="22222222-2222-4222-8222-222222222222";
const c="33333333-3333-4333-8333-333333333333";
const d="44444444-4444-4444-8444-444444444444";
describe("class-team move roster integrity",()=>{
 it("rejects duplicate learner assignments before moving",()=>{
  expect(()=>moveMemberBalanced([{name:"Team 1",membershipIds:[a,b]},{name:"Team 2",membershipIds:[a,c]}],b,1)).toThrow("TEAM_PREVIEW_INVALID");
 });
 it("rejects an already empty team and leaves the caller untouched",()=>{
  const groups=[{name:"Team 1",membershipIds:[a,b]},{name:"Team 2",membershipIds:[]}];
  expect(()=>moveMemberBalanced(groups,a,1)).toThrow("TEAM_PREVIEW_INVALID");
  expect(groups[0].membershipIds).toEqual([a,b]);
 });
 it("preserves all learner identities on a valid balanced move",()=>{
  const groups=[{name:"Team 1",membershipIds:[a,b,c]},{name:"Team 2",membershipIds:[d]}];
  const result=moveMemberBalanced(groups,c,1);
  expect(result.map(g=>g.membershipIds.length)).toEqual([2,2]);
  expect(groups[0].membershipIds).toEqual([a,b,c]);
 });
});
