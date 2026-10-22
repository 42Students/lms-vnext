import {describe,expect,it} from "vitest";
import {addDescriptivePoints,descriptiveAssignmentPointsSchema}
 from "@/modules/courses/assignment-descriptive-points-model";

describe("G2-2-014 descriptive points parity",()=>{
 it("adds points to the ungraded existing score without replacing it",()=>{
  expect(addDescriptivePoints(3,2,10)).toBe(5);
  expect(addDescriptivePoints(0,10,10)).toBe(10);
 });
 it("requires a positive integer increment and optimistic version",()=>{
  expect(descriptiveAssignmentPointsSchema.safeParse({
   expectedVersion:1,pointsToAdd:2,
  }).success).toBe(true);
  for(const pointsToAdd of [0,-1,1.5,10001]){
   expect(descriptiveAssignmentPointsSchema.safeParse({
    expectedVersion:1,pointsToAdd,
   }).success).toBe(false);
  }
  expect(descriptiveAssignmentPointsSchema.safeParse({
   pointsToAdd:3,
  }).success).toBe(false);
 });
 it("rejects an increment exceeding the submission-time ceiling",()=>{
  expect(()=>addDescriptivePoints(9,2,10)).toThrow("assignment maximum");
  expect(()=>addDescriptivePoints(10,1,10)).toThrow("assignment maximum");
  expect(()=>addDescriptivePoints(0,1,0)).toThrow("assignment maximum");
  expect(()=>addDescriptivePoints(Number.NaN,1,10)).toThrow("assignment maximum");
 });
});
