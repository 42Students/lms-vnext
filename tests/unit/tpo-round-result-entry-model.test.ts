import {describe,expect,it} from "vitest";
import {tpoRoundResultEntryFormSchema} from "@/modules/placements/tpo-round-result-entry-model";
const base={applicationId:"550e8400-e29b-41d4-a716-446655440000",expectedCurrentResultId:null,
 outcome:"PASS",note:"  Meets requirements  ",waitlistRank:""};
describe("TPO round result form boundary",()=>{
 it("preserves the optimistic identity and keeps pass notes internal",()=>{
  const result=tpoRoundResultEntryFormSchema.parse(base);
  expect(result.expectedCurrentResultId).toBeNull();
  expect(result.result).toMatchObject({outcome:"PASS",internalComment:"Meets requirements"});
  expect(result.result.candidateMessage).toBeUndefined();
 });
 it("requires positive bounded integer HOLD ranks and candidate-visible non-pass feedback",()=>{
  for(const rank of ["","0","1.5","100001","NaN"])
   expect(tpoRoundResultEntryFormSchema.safeParse({...base,outcome:"HOLD",waitlistRank:rank}).success).toBe(false);
  expect(tpoRoundResultEntryFormSchema.parse({...base,outcome:"HOLD",waitlistRank:"2"}).result)
   .toMatchObject({waitlistRank:2,candidateMessage:"Meets requirements"});
  expect(tpoRoundResultEntryFormSchema.safeParse({...base,note:"   "}).success).toBe(false);
  expect(tpoRoundResultEntryFormSchema.safeParse({...base,collegeId:"forged"}).success).toBe(false);
 });
});
