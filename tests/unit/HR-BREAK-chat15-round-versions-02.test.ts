import {describe,expect,it} from "vitest";
import {canRecruiterEditRound,hrRoundFormSchema,matchesRecruiterRoundVersion}
 from "@/modules/placements/hr-round-editor-model";

const roundId="123e4567-e89b-42d3-a456-426614174001";
const stored=new Date("2026-10-18T10:00:00.123Z");

describe("HR-BREAK-chat15-round-versions-02: versions, role checks and forbidden transitions",()=>{
 it("accepts distinct timezone offsets only when they resolve to exactly the persisted instant",()=>{
  for(const equivalent of [
   "2026-10-18T10:00:00.123Z",
   "2026-10-18T15:30:00.123+05:30",
   "2026-10-18T06:00:00.123-04:00",
  ]){
   expect(matchesRecruiterRoundVersion(stored,equivalent)).toBe(true);
   expect(hrRoundFormSchema.safeParse({
    action:"UPDATE",roundId,expectedUpdatedAt:equivalent,name:"Revised stage",
   }).success).toBe(true);
  }
 });
 it("rejects stale, unparseable and absent optimistic versions",()=>{
  for(const invalid of [
   "2026-10-18T10:00:00.122Z","2026-10-18T10:00:00.124Z",
   "2026-10-18T10:00:01.123Z","invalid","",undefined,
  ])expect(matchesRecruiterRoundVersion(stored,invalid)).toBe(false);
  expect(matchesRecruiterRoundVersion(new Date(Number.NaN),stored.toISOString())).toBe(false);
 });
 it("requires a real matching creator; absent actor IDs must never grant editing permission",()=>{
  const valid={status:"PENDING",createdByUserId:"recruiter-1",
   recruiterUserId:"recruiter-1",hasResults:false,hasSlots:false};
  expect(canRecruiterEditRound(valid)).toBe(true);
  for(const patch of [
   {createdByUserId:"",recruiterUserId:""},
   {createdByUserId:" ",recruiterUserId:" "},
   {createdByUserId:"tpo"},
   {status:"SCHEDULED"},{status:"CANCELLED"},{status:"COMPLETED"},
   {hasResults:true},{hasSlots:true},
  ])expect(canRecruiterEditRound({...valid,...patch})).toBe(false);
 });
 it("round mutation schema cannot be tricked into update/remove without identity and version",()=>{
  const base={roundId,expectedUpdatedAt:stored.toISOString()};
  expect(hrRoundFormSchema.safeParse({action:"REMOVE",...base}).success).toBe(true);
  for(const invalid of [
   {action:"UPDATE",roundId,name:"New name"},
   {action:"UPDATE",expectedUpdatedAt:stored.toISOString(),name:"New name"},
   {action:"UPDATE",...base},
   {action:"REMOVE",...base,kind:"INTERVIEW"},
   {action:"REMOVE",...base,name:"Don't quietly modify fields"},
   {action:"CREATE",kind:"INTERVIEW",name:"New",...base},
   {action:"UPDATE",...base,name:"Test",collegeId:roundId},
  ])expect(hrRoundFormSchema.safeParse(invalid).success).toBe(false);
 });
});
