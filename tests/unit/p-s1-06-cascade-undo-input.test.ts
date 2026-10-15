import {describe,expect,it} from "vitest";
import {z} from "zod";
const body=z.object({cascadeId:z.string().uuid(),confirmed:z.literal(true)}).strict();
describe("P-S1-06 confirm cascade undo input",()=>{
 it("requires an explicit decision and only the known cascade ID",()=>{
  const id="e40a9a25-1cb4-4bc9-94b6-1e0ded906d33";
  expect(body.safeParse({cascadeId:id,confirmed:true}).success).toBe(true);
  expect(body.safeParse({cascadeId:id}).success).toBe(false);
  expect(body.safeParse({cascadeId:id,confirmed:true,collegeId:"other"}).success).toBe(false);
 });
});
