import {describe,it,expect} from "vitest";
import {tpoStudentsQuerySchema} from "@/modules/placements/tpo-students-service";
const collegeId="11111111-1111-4111-8111-111111111111";
describe("TPO Students GET query round-trip stays parseable",()=>{
 it("TPO-students-20 preserves optional boolean filters on second service parse",()=>{
  const first=tpoStudentsQuerySchema.parse({collegeId,debarred:"YES",needsAttention:"NO",marksVerified:"YES",isLateralEntry:"NO",hasProfileLinks:"YES"});
  const second=tpoStudentsQuerySchema.parse(first);
  expect(second).toMatchObject({debarred:true,needsAttention:false,marksVerified:true,isLateralEntry:false,hasProfileLinks:true});
 });
 it("TPO-students-22 rejects unsupported yes/no status words",()=>{
  expect(tpoStudentsQuerySchema.safeParse({collegeId,hasProfileLinks:"MAYBE"}).success).toBe(false);
 });
 it("TPO-students-24 accepts query strings and typed values with same results",()=>{
  const url=tpoStudentsQuerySchema.parse({collegeId,needsAttention:"YES",debarred:"NO"});
  const object=tpoStudentsQuerySchema.parse({...url});
  expect(object).toMatchObject({needsAttention:true,debarred:false});
 });
 it("TPO-students-31 does not treat an absent filter as No",()=>{
  expect(tpoStudentsQuerySchema.parse({collegeId}).debarred).toBeUndefined();
 });
});
