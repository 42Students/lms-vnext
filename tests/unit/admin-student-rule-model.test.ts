import {describe,expect,it} from "vitest";
import {studentRuleCards} from "@/modules/module-access/admin-student-rule-model";
import type {LearnerModuleTrace} from "@/modules/module-access/admin-trace-model";
const modules=[{module:"projects",label:"Projects",enabled:false,winnerLevel:"COLLEGE",winnerLocked:true,
 explanation:"",steps:[{level:"MEMBERSHIP",scopeId:"m",inChain:true,value:true,locked:false,source:"PERSISTED",ignored:false,winner:false,reason:""}]}] as LearnerModuleTrace[];
describe("Student rule inspection",()=>{
 it("does not confuse stored On with effective access",()=>{
  expect(studentRuleCards(modules)).toMatchObject([{state:"On",winner:false,consequence:"Inherits or is masked by another rule"}]);
 });
 it("reports inherit for a missing member rule",()=>{
  expect(studentRuleCards([{...modules[0],steps:[]}])[0].state).toBe("Inherit");
 });
});
