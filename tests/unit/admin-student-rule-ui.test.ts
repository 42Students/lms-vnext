import {describe,expect,it} from "vitest";
import {studentRulePayload,studentRuleChangeSummary,parseStudentRuleRecheck,hasStudentRuleAcknowledgement,canReviewStudentRule} from "@/modules/module-access/admin-student-rule-ui-model";
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

 it("requires exact verified module/value/lock receipt, not just HTTP 2xx",()=>{
  expect(hasStudentRuleAcknowledgement({rule:{module:"electives",enabled:true,locked:false,unchanged:false}},"projects","ON",false)).toBe(false);
  expect(hasStudentRuleAcknowledgement({rule:{module:"projects",enabled:null,locked:false}},"projects","INHERIT",false)).toBe(false);
  expect(hasStudentRuleAcknowledgement({rule:{module:"projects",enabled:false,locked:true,unchanged:false}},"projects","OFF",true)).toBe(true);
 });
 it("allows safe inherit cleanup beneath a broader lock without permitting SET",()=>{
  expect(canReviewStudentRule("INHERIT",true,false,false)).toBe(true);
  expect(canReviewStudentRule("ON",true,false,false)).toBe(false);
  expect(canReviewStudentRule("OFF",true,false,false)).toBe(false);
  expect(canReviewStudentRule("INHERIT",true,true,false)).toBe(false);
 });
});
