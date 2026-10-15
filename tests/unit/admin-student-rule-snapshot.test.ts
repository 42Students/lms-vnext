import {describe,expect,it} from "vitest";
import {studentRuleSnapshot} from "@/modules/module-access/admin-student-rule-snapshot";
import type {LearnerModuleTrace} from "@/modules/module-access/admin-trace-model";
describe("Super Admin restricted student rule snapshot",()=>{
 it("returns only persisted membership rule fields, not student profile data",()=>{
  const input=[{module:"projects",label:"Projects",enabled:true,winnerLevel:"MEMBERSHIP",winnerLocked:false,
   explanation:"",steps:[{level:"MEMBERSHIP",scopeId:"member",inChain:true,value:false,locked:true,
   source:"PERSISTED",ignored:false,winner:true,reason:""}]}] as LearnerModuleTrace[];
  expect(studentRuleSnapshot(input)).toEqual([{module:"projects",enabled:false,locked:true,ignored:false,winner:true}]);
  expect(JSON.stringify(studentRuleSnapshot(input))).not.toContain("member");
 });
});
