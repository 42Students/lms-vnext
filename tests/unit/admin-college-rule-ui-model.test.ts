import {describe,it,expect} from "vitest";
import {collegeRulePayload,isCollegeRuleDirty,collegeRuleReceipt,collegeRuleSelection,parseCollegeRuleRecheck} from "@/modules/module-access/admin-college-rule-ui-model";
describe("Super Admin college policy editor client payloads",()=>{
 it("requires a human-readable difference before enabling a write",()=>{
  expect(isCollegeRuleDirty("INHERIT",false,null)).toBe(false);
  expect(isCollegeRuleDirty("OFF",false,null)).toBe(true);
  expect(collegeRuleSelection({enabled:false,locked:true})).toBe("OFF");
 });
 it("keeps Off different from Inherit and includes expected state",()=>{
  expect(collegeRulePayload("projects","OFF",false,null)).toEqual({action:"SET",module:"projects",enabled:false,locked:false,expected:null});
  expect(collegeRulePayload("projects","INHERIT",true,{enabled:false,locked:true})).toEqual({action:"INHERIT",module:"projects",expected:{enabled:false,locked:true}});
 });
 it("requires a complete acknowledgement rather than HTTP 2xx",()=>{
  expect(collegeRuleReceipt({rule:{module:"projects",enabled:false,locked:true,unchanged:false}},"projects","OFF",true)).toBe(true);
  expect(collegeRuleReceipt({rule:{module:"placements",enabled:true,locked:false,unchanged:false}},"projects","ON",false)).toBe(false);
 });
 it("rejects malformed or duplicated recheck states without losing optimistic state",()=>{
  expect(parseCollegeRuleRecheck({rules:[{module:"projects",stored:null}]},"projects")).toBeNull();
  expect(parseCollegeRuleRecheck({rules:[{module:"projects",stored:{enabled:false,locked:true}}]},"projects")).toEqual({enabled:false,locked:true});
  expect(parseCollegeRuleRecheck({rules:[{module:"projects",stored:null},{module:"projects",stored:null}]},"projects")).toBeUndefined();
  expect(parseCollegeRuleRecheck({rules:[{module:"projects",stored:{enabled:"false",locked:true}}]},"projects")).toBeUndefined();
 });
});
