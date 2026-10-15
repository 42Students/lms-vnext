import {describe,expect,it} from "vitest";
import {studentRuleWriteInput} from "@/modules/module-access/admin-student-rule-write";
import {studentRuleMatches} from "@/modules/module-access/admin-student-rule-model";
describe("Super Admin student rule writes",()=>{
 it("rejects stale stored states, including lock changes",()=>{
  expect(studentRuleMatches(null,{enabled:true,locked:false})).toBe(false);
  expect(studentRuleMatches({enabled:true,locked:false},{enabled:true,locked:true})).toBe(false);
  expect(studentRuleMatches({enabled:false,locked:true},{enabled:false,locked:true})).toBe(true);
 });
 it("allows explicit unlocked project override only",()=>{
  expect(studentRuleWriteInput.parse({action:"SET",module:"projects",enabled:false,locked:false,expected:null}).enabled).toBe(false);
  expect(studentRuleWriteInput.safeParse({action:"SET",module:"placements",enabled:true,locked:false,expected:null}).success).toBe(false);
 });
 it("supports inherit without a fabricated Off rule",()=>{
  expect(studentRuleWriteInput.parse({action:"INHERIT",module:"projects",expected:null})).toEqual({action:"INHERIT",module:"projects",expected:null});
  expect(studentRuleWriteInput.safeParse({action:"INHERIT",module:"projects",expected:null,enabled:false}).success).toBe(false);
 });
 it("accepts explicit member locks independently of enabled state",()=>{
  expect(studentRuleWriteInput.parse({action:"SET",module:"electives",enabled:false,locked:true,expected:null})).toMatchObject({locked:true,enabled:false});
 });
 it("rejects unsafe client scope",()=>{
  expect(studentRuleWriteInput.safeParse({action:"SET",module:"placements",enabled:true,locked:true,expected:null}).success).toBe(false);
  expect(studentRuleWriteInput.safeParse({action:"SET",module:"projects",enabled:true,locked:false,collegeId:"other"}).success).toBe(false);
 });
});
