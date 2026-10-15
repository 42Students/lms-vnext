import {describe,it,expect} from "vitest";
import {hrRoundFormSchema} from "@/modules/placements/hr-round-editor-model";
const draft={action:"CREATE",kind:"INTERVIEW",name:"Technical"};
describe("recruiter round duration",()=>{
 it.each([30,"30",1440,"1440"])("accepts positive minute count %s",value=>{
  expect(hrRoundFormSchema.safeParse({...draft,durationMinutes:value}).success).toBe(true);
 });
 it.each([true,false,null,0,-1,1441,1.5,""," 30 ","01","1e2","30.0",Infinity])(
  "rejects implicit or out-of-range duration %s",value=>{
   expect(hrRoundFormSchema.safeParse({...draft,durationMinutes:value}).success).toBe(false);
  });
});
