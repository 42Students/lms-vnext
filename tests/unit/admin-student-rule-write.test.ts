import {describe,expect,it} from "vitest";
import {studentRuleWriteInput} from "@/modules/module-access/admin-student-rule-write";
import {studentRuleMatches,isStudentRuleNoop,hasPersistedAncestorLock} from "@/modules/module-access/admin-student-rule-model";
describe("Super Admin student rule writes",()=>{
 it("rejects a persisted parent lock at update time",()=>{
  expect(hasPersistedAncestorLock([{locked:false},{locked:true}])).toBe(true);
  expect(hasPersistedAncestorLock([{locked:false}])).toBe(false);
 });
 it("does not create new audit records for a genuinely unchanged rule",()=>{
  expect(isStudentRuleNoop(null,{action:"INHERIT"})).toBe(true);
  expect(isStudentRuleNoop({enabled:false,locked:true},{action:"SET",enabled:false,locked:true})).toBe(true);
  expect(isStudentRuleNoop({enabled:false,locked:true},{action:"SET",enabled:false,locked:false})).toBe(false);
  expect(isStudentRuleNoop(null,{action:"SET",enabled:false,locked:false})).toBe(false);
 });
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
