import {describe,expect,it} from "vitest";
import {canRecruiterEditRound,duplicateRecruiterRoundName,hrRoundFormSchema,
 matchesRecruiterRoundVersion}
 from "@/modules/placements/hr-round-editor-model";

const id="123e4567-e89b-42d3-a456-426614174001";
const stamp="2099-05-01T10:00:00.000+05:30";
describe("HR-ROUND-DEPTH-64: author and version gates for round editing",()=>{
 it("requires the author even when a different recruiter belongs to the same employer",()=>{
  for(const status of ["PENDING","SCHEDULED","COMPLETED","CANCELLED"]){
   const allowed=canRecruiterEditRound({status,createdByUserId:"alice",
    recruiterUserId:"bob",hasResults:false,hasSlots:false});
   expect(allowed).toBe(false);
  }
  expect(canRecruiterEditRound({status:"PENDING",createdByUserId:"alice",
   recruiterUserId:"alice",hasResults:false,hasSlots:false})).toBe(true);
 });
 it("does not allow past submissions or allocated interview slots to mutate their round",()=>{
  for(const scenario of [
   {hasResults:true,hasSlots:false},{hasResults:false,hasSlots:true},
   {hasResults:true,hasSlots:true},
  ]){
   expect(canRecruiterEditRound({status:"PENDING",createdByUserId:"alice",
    recruiterUserId:"alice",...scenario})).toBe(false);
  }
 });
 it("never treats malformed timestamp, absent token, or a one millisecond stale tab as equal",()=>{
  const stored=new Date("2099-05-01T04:30:00.000Z");
  expect(matchesRecruiterRoundVersion(stored,stamp)).toBe(true);
  for(const value of [undefined,"", "stale", "2099-05-01T04:30:00.001Z",
   "2099-05-01T04:29:59.999Z"]){
   expect(matchesRecruiterRoundVersion(stored,value)).toBe(false);
  }
 });
 it("prevents Unicode and whitespace duplicate live round names while allowing canceled history",()=>{
  const rows=[{id:"first",name:" Technical  Round ",status:"PENDING"},
   {id:"retired",name:"Old round",status:"CANCELLED"}];
  expect(duplicateRecruiterRoundName(rows,"technical round")).toBe(true);
  expect(duplicateRecruiterRoundName(rows,"Ｔｅｃｈｎｉｃａｌ round")).toBe(true);
  expect(duplicateRecruiterRoundName(rows,"Old round")).toBe(false);
  expect(duplicateRecruiterRoundName(rows,"Technical Round","first")).toBe(false);
 });
 it("rejects unknown command fields, remove field forgery, missing versions, and zero durations",()=>{
  const changes=[
   {action:"CREATE",kind:"TEST",name:"Test",roundId:id},
   {action:"CREATE",kind:"TEST",name:"Test",adminOverride:true},
   {action:"CREATE",kind:"TEST",name:"\u0000"},
   {action:"REMOVE",roundId:id,expectedUpdatedAt:stamp,mode:"VIRTUAL"},
   {action:"UPDATE",roundId:id,expectedUpdatedAt:stamp},
   {action:"UPDATE",roundId:id,name:"Corrected"},
   {action:"UPDATE",roundId:id,expectedUpdatedAt:stamp,durationMinutes:0},
   {action:"CREATE",kind:"TEST",name:"Test",durationMinutes:1441},
  ];
  for(const input of changes)expect(hrRoundFormSchema.safeParse(input).success).toBe(false);
  expect(hrRoundFormSchema.safeParse({
   action:"UPDATE",roundId:id,expectedUpdatedAt:stamp,name:"Corrected",
  }).success).toBe(true);
 });
});
