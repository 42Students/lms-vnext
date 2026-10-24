import {describe,expect,it} from "vitest";
import {mentorPointStack} from "@/modules/projects/mentor-point-stack-model";
describe("Mentor performance stacked points",()=>{
 it("preserves source points and creates 100 percent proportional segments",()=>{
  const item=mentorPointStack(18,6,12);
  expect(item).toMatchObject({done:18,waiting:6,open:12,total:36,
    donePct:50,waitingPct:16.7,openPct:33.3});
  expect(item.donePct+item.waitingPct+item.openPct).toBe(100);
 });
 it("does not invent percentages when all estimates are zero",()=>{
  expect(mentorPointStack(0,0,0)).toEqual({
   done:0,waiting:0,open:0,total:0,donePct:0,waitingPct:0,openPct:0,
  });
 });
 it("does not visualize corrupt negative waiting estimates",()=>{
  const item=mentorPointStack(5,-2,5);
  expect(item).toMatchObject({done:5,waiting:0,open:5,total:10,
    donePct:50,waitingPct:0,openPct:50});
 });
});
