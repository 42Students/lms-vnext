import {describe,expect,it} from "vitest";
import {studentRuleWriteInput} from "@/modules/module-access/admin-student-rule-write";
describe("Super Admin student rule writes",()=>{
 it("allows explicit unlocked project override only",()=>{
  expect(studentRuleWriteInput.parse({action:"SET",module:"projects",enabled:false,locked:false}).enabled).toBe(false);
  expect(studentRuleWriteInput.safeParse({action:"SET",module:"placements",enabled:true,locked:false}).success).toBe(false);
 });
 it("rejects locking and extra client scope",()=>{
  expect(studentRuleWriteInput.safeParse({action:"SET",module:"projects",enabled:true,locked:true}).success).toBe(false);
  expect(studentRuleWriteInput.safeParse({action:"SET",module:"projects",enabled:true,locked:false,collegeId:"other"}).success).toBe(false);
 });
});
