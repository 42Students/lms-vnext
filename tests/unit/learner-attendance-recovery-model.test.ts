import {describe,it,expect} from "vitest";
import {learnerAttendanceRecoveryProjection as recover} from "@/modules/attendance/learner-attendance-recovery-model";
describe("learner attendance mathematically bounded recovery",()=>{
 it("counts the minimum future present marks needed to reach the real threshold",()=>{
  expect(recover(10,6,75)).toBe(6); // (6+n)/(10+n) >= .75
  expect(recover(10,8,75)).toBe(0);
  expect(recover(10,9,95)).toBe(10);
 });
 it("never invents a projection from no marks or invalid counts",()=>{
  expect(recover(0,0,75)).toBeNull();
  expect(recover(10,11,75)).toBeNull();
  expect(recover(10,5,100)).toBe(Infinity);
 });
});
