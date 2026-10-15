import {describe,expect,it} from "vitest";
import {studentRulePayload,studentRuleChangeSummary} from "@/modules/module-access/admin-student-rule-ui-model";
describe("Student override controls",()=>{
 it("distinguishes inheritance from storing Off",()=>{
  expect(studentRulePayload("projects","INHERIT",true,null)).toEqual({action:"INHERIT",module:"projects",expected:null});
  expect(studentRulePayload("projects","OFF",false,null)).toEqual({action:"SET",module:"projects",enabled:false,locked:false,expected:null});
 });
 it("previews the selected lock consequences",()=>{
  expect(studentRuleChangeSummary("electives","ON",true)).toContain("membership lock");
 });
});
