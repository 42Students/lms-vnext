import {describe,expect,it} from "vitest";
import {studentRuleWriteInput} from "@/modules/module-access/admin-student-rule-write";
describe("Super Admin student rule writes",()=>{
 it("allows explicit unlocked project override only",()=>{
  expect(studentRuleWriteInput.parse({action:"SET",module:"projects",enabled:false,locked:false}).enabled).toBe(false);
  expect(studentRuleWriteInput.safeParse({action:"SET",module:"placements",enabled:true,locked:false}).success).toBe(false);
 });
 it("supports inherit without a fabricated Off rule",()=>{
  expect(studentRuleWriteInput.parse({action:"INHERIT",module:"projects"})).toEqual({action:"INHERIT",module:"projects"});
  expect(studentRuleWriteInput.safeParse({action:"INHERIT",module:"projects",enabled:false}).success).toBe(false);
 });
 it("accepts explicit member locks independently of enabled state",()=>{
  expect(studentRuleWriteInput.parse({action:"SET",module:"electives",enabled:false,locked:true})).toMatchObject({locked:true,enabled:false});
 });
 it("rejects unsafe client scope",()=>{
  expect(studentRuleWriteInput.safeParse({action:"SET",module:"placements",enabled:true,locked:true}).success).toBe(false);
  expect(studentRuleWriteInput.safeParse({action:"SET",module:"projects",enabled:true,locked:false,collegeId:"other"}).success).toBe(false);
 });
});
