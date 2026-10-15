import {describe,expect,it} from "vitest";
import {studentRulePayload,studentRuleChangeSummary,parseStudentRuleRecheck} from "@/modules/module-access/admin-student-rule-ui-model";
describe("Student override controls",()=>{
 it("distinguishes inheritance from storing Off",()=>{
  expect(studentRulePayload("projects","INHERIT",true,null)).toEqual({action:"INHERIT",module:"projects",expected:null});
  expect(studentRulePayload("projects","OFF",false,null)).toEqual({action:"SET",module:"projects",enabled:false,locked:false,expected:null});
 });
 it("previews the selected lock consequences",()=>{
  expect(studentRuleChangeSummary("electives","ON",true)).toContain("membership lock");
 });
 it("rejects malformed, duplicate and falsely inherited recheck states",()=>{
  expect(parseStudentRuleRecheck({rules:[{module:"projects",enabled:null,locked:true}]},"projects")).toBeUndefined();
  expect(parseStudentRuleRecheck({rules:[{module:"projects",enabled:true,locked:false},{module:"projects",enabled:false,locked:false}]},"projects")).toBeUndefined();
  expect(parseStudentRuleRecheck({rules:[{module:"projects",enabled:null,locked:false}]},"projects")).toBeNull();
  expect(parseStudentRuleRecheck({rules:[{module:"projects",enabled:false,locked:true}]},"projects")).toEqual({enabled:false,locked:true});
 });

});
