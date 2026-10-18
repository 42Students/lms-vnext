import {describe,expect,it} from "vitest";
import {hrDriveDraftSchema,hrDriveDraftQuerySchema,emptyHrDriveDraft}
 from "@/modules/placements/hr-drive-draft-model";
const id="123e4567-e89b-42d3-a456-426614174001";
const draft=()=>({...emptyHrDriveDraft(),title:"Graduate engineer",
 description:"College approved technical drive",
 ctcLpa:"10",rounds:[{kind:"TEST" as const,name:"Technical round"}]});
describe("HR-DRIVES-82 safe recruiter hiring draft round names",()=>{
 it("rejects mixed full-width and ASCII versions of the same round name",()=>{
  const input={...draft(),rounds:[
   {kind:"TEST" as const,name:"Technical round"},
   {kind:"INTERVIEW" as const,name:"Ｔｅｃｈｎｉｃａｌ   ROUND"},
  ]};
  const parsed=hrDriveDraftSchema.safeParse(input);
  expect(parsed.success).toBe(false);
  if(!parsed.success)expect(parsed.error.issues.some(issue=>issue.path.join(".")==="rounds.1.name"))
   .toBe(true);
 });
 it("rejects embedded linebreaks, tabs and NUL in persisted round labels",()=>{
  for(const name of ["First\nRound","First\rRound","First\tRound","First\u0000Round"]){
   const parsed=hrDriveDraftSchema.safeParse({...draft(),rounds:[{
    kind:"INTERVIEW" as const,name,
   }]});
   expect(parsed.success).toBe(false);
  }
 });
 it("allows normal Unicode round names and different legitimate stages",()=>{
  const input={...draft(),rounds:[
   {kind:"TEST" as const,name:"Évaluation technique"},
   {kind:"INTERVIEW" as const,name:"Panel interview"},
  ]};
  expect(hrDriveDraftSchema.safeParse(input).success).toBe(true);
 });
 it("does not allow guessed HR URL IDs to combine editing, copying and source drive modes",()=>{
  expect(hrDriveDraftQuerySchema.safeParse({from:id,copy:id}).success).toBe(false);
  expect(hrDriveDraftQuerySchema.safeParse({edit:id,fix:id}).success).toBe(false);
  expect(hrDriveDraftQuerySchema.safeParse({copy:id,from:id}).success).toBe(false);
  expect(hrDriveDraftQuerySchema.safeParse({edit:id}).success).toBe(true);
 });
});