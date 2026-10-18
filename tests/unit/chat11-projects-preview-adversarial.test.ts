import {describe,expect,it} from "vitest";
import {
 verifyClassTeamPreview,classTeamPreviewSchema,
} from "@/modules/projects/class-team-preview-validation";
import {previewVersion,assertPreviewVersion} from "@/modules/projects/class-team-preview-token";
import {mayBeginClassTeamCreation} from "@/modules/projects/class-team-create-once-model";
const a="11111111-1111-4111-8111-111111111111";
const b="22222222-2222-4222-8222-222222222222";
const foreign="33333333-3333-4333-8333-333333333333";

describe("PROJ-BREAK-COL-TEAM-01 class-team preview integrity",()=>{
 const eligible=[a,b];
 const groups=[{name:"Team Alpha",membershipIds:[a]},{name:"Team Beta",membershipIds:[b]}];
 it("commits only a complete exactly-once partition of active eligible learners",()=>{
  expect(verifyClassTeamPreview(groups,eligible)).toEqual(groups);
  for(const invalid of [
   [{name:"One",membershipIds:[a]}],
   [{name:"One",membershipIds:[a]},{name:"Two",membershipIds:[a]}],
   [{name:"One",membershipIds:[a,foreign]}],
   [{name:"One",membershipIds:[a,b,foreign]}],
   [{name:"One",membershipIds:[]}],
  ])expect(()=>verifyClassTeamPreview(invalid,eligible)).toThrow();
  expect(()=>verifyClassTeamPreview(groups,[a,a])).toThrow("Duplicate eligible membership");
 });
 it("treats Unicode-equivalent names as duplicates before saving any team",()=>{
  expect(()=>verifyClassTeamPreview([
   {name:"Ａlpha",membershipIds:[a]},
   {name:"Alpha",membershipIds:[b]},
  ],eligible)).toThrow("Duplicate team name");
  expect(()=>verifyClassTeamPreview([
   {name:"Team  Alpha",membershipIds:[a]},
   {name:"team alpha",membershipIds:[b]},
  ],eligible)).toThrow("Duplicate team name");
 });
 it("rejects malformed nested team fields, invalid UUIDs and oversized input",()=>{
  expect(classTeamPreviewSchema.safeParse(groups).success).toBe(true);
  for(const value of [
   [{name:"x",membershipIds:[a],collegeId:foreign}],
   [{name:"x",membershipIds:["../foreign"]}],
   [{name:"",membershipIds:[a]}],
   Array.from({length:2001},(_,index)=>({name:"T"+index,membershipIds:[a]})),
  ])expect(classTeamPreviewSchema.safeParse(value).success).toBe(false);
 });
 it("refuses stale, altered or duplicate submissions before the service creates teams",()=>{
  const token=previewVersion(groups);
  expect(()=>assertPreviewVersion(groups,token)).not.toThrow();
  expect(()=>assertPreviewVersion([...groups].reverse(),token)).toThrow("TEAM_PREVIEW_STALE");
  expect(()=>assertPreviewVersion([{name:"Team Alpha",membershipIds:[a,b]}],token))
   .toThrow("TEAM_PREVIEW_STALE");
  expect(mayBeginClassTeamCreation(false,true)).toBe(true);
  expect(mayBeginClassTeamCreation(true,true)).toBe(false);
  expect(mayBeginClassTeamCreation(false,false)).toBe(false);
 });
});
