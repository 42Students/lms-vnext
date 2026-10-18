import {describe,expect,it} from "vitest";
import {
  previewClassTeams,movePreviewMember,type ProjectTeam,
} from "@/modules/projects/class-team-split-model";
import {
  verifyClassTeamPreview,classTeamPreviewSchema,
} from "@/modules/projects/class-team-preview-validation";
import {
  previewVersion,assertPreviewVersion,previewVersionSchema,
} from "@/modules/projects/class-team-preview-token";

const learners=[
 "11111111-1111-4111-8111-111111111111",
 "22222222-2222-4222-8222-222222222222",
 "33333333-3333-4333-8333-333333333333",
 "44444444-4444-4444-8444-444444444444",
];
const groups:ProjectTeam[]=[
 {name:"Team 1",membershipIds:[learners[0]!,learners[1]!] },
 {name:"Team 2",membershipIds:[learners[2]!,learners[3]!] },
];
const clone=()=>groups.map(g=>({name:g.name,membershipIds:[...g.membershipIds]}));
describe("PROJ-BREAK-TEAM-PREVIEW-01: IIT Dharwad safe planner and roster integrity",()=>{
 it("round-trips a legitimate roster preview without losing or duplicating learners",()=>{
  const planned=previewClassTeams({mode:"TEAMS",order:"ROLL",seed:"fixed",teamSize:2,
   students:learners.map((membershipId,i)=>({membershipId,rollNumber:String(i+1)}))});
  expect(planned).toEqual(groups);
  expect(verifyClassTeamPreview(planned,learners)).toEqual(groups);
  expect(classTeamPreviewSchema.safeParse(planned).success).toBe(true);
 });
 it.each([
  ["missing learner",[{name:"Team 1",membershipIds:[learners[0]!,learners[1]!] }] ],
  ["duplicate across teams",[
   {name:"Team 1",membershipIds:[learners[0]!,learners[1]!] },
   {name:"Team 2",membershipIds:[learners[1]!,learners[2]!,learners[3]!] },
  ]],
  ["forged learner id",[
   {name:"Team 1",membershipIds:[learners[0]!,learners[1]!] },
   {name:"Team 2",membershipIds:[learners[2]!, "55555555-5555-4555-8555-555555555555"] },
  ]],
  ["empty team",[
   {name:"Team 1",membershipIds:[] },
   {name:"Team 2",membershipIds:learners },
  ]],
  ["Unicode normalized duplicate team name",[
   {name:"Team 1",membershipIds:[learners[0]!,learners[1]!] },
   {name:"Ｔｅａｍ １",membershipIds:[learners[2]!,learners[3]!] },
  ]],
 ])("rejects %s before creating workspaces",(_why,preview)=>{
  expect(()=>verifyClassTeamPreview(preview,learners)).toThrow();
 });
 it("rejects malformed JSON payload, hidden fields and duplicate authorized roster IDs",()=>{
  expect(classTeamPreviewSchema.safeParse([{...groups[0],collegeId:"foreign"}]).success).toBe(false);
  expect(()=>verifyClassTeamPreview(groups,[learners[0]!,learners[0]!])).toThrow();
  expect(()=>verifyClassTeamPreview(null,learners)).toThrow();
  expect(()=>verifyClassTeamPreview([],learners)).toThrow();
  expect(()=>verifyClassTeamPreview(groups,[])).toThrow();
 });
 it("prevents moving the last learner out of a group and does not change original state",()=>{
  const lone:ProjectTeam[]=[
   {name:"A",membershipIds:[learners[0]!] },
   {name:"B",membershipIds:[learners[1]!,learners[2]!,learners[3]!] },
  ];
  const snapshot=JSON.stringify(lone);
  expect(()=>movePreviewMember(lone,learners[0]!,1)).toThrow("TEAM_PREVIEW_EMPTY_TEAM");
  expect(JSON.stringify(lone)).toBe(snapshot);
  expect(movePreviewMember(lone,learners[0]!,0)).toEqual(lone);
 });
 it("permits a valid immutable move while preserving exact learner cardinality",()=>{
  const current=clone(),snapshot=JSON.stringify(current);
  const moved=movePreviewMember(current,learners[0]!,1);
  expect(current).toEqual(groups);
  expect(JSON.stringify(current)).toBe(snapshot);
  expect(moved[0]?.membershipIds).toEqual([learners[1]]);
  expect(moved[1]?.membershipIds).toEqual([learners[2],learners[3],learners[0]]);
  expect(verifyClassTeamPreview(moved,learners)).toEqual(moved);
 });
 it("rejects invalid targets and unrecognized learner, rather than shifting silently",()=>{
  for(const target of [-1,2,0.5,NaN,Infinity]){
    expect(()=>movePreviewMember(groups,learners[0]!,target)).toThrow();
  }
  expect(()=>movePreviewMember(groups,"55555555-5555-4555-8555-555555555555",0)).toThrow();
 });
 it("rejects stale or forged preview-version tokens after a learner move",()=>{
  const initial=previewVersion(groups),moved=movePreviewMember(groups,learners[0]!,1);
  expect(previewVersionSchema.safeParse(initial).success).toBe(true);
  expect(previewVersion(moved)).not.toBe(initial);
  expect(()=>assertPreviewVersion(groups,initial)).not.toThrow();
  expect(()=>assertPreviewVersion(moved,initial)).toThrow("TEAM_PREVIEW_STALE");
  for(const bad of ["","0000000","not-a-hash","FFFFFFFF","../../admin"]){
    expect(()=>assertPreviewVersion(groups,bad)).toThrow();
  }
 });
});
