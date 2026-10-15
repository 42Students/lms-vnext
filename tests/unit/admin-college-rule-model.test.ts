import {describe,it,expect} from "vitest";
import {collegeRuleWriteSchema,collegeRuleSame,collegeRuleNoChange,collegeRulePreview,collegeRuleReadSnapshot} from "@/modules/module-access/admin-college-rule-model";
describe("college feature policy model",()=>{
 it("accepts only validated optimistic SET or INHERIT inputs",()=>{
  expect(collegeRuleWriteSchema.safeParse({action:"SET",module:"placements",enabled:false,locked:true,expected:null}).success).toBe(true);
  expect(collegeRuleWriteSchema.safeParse({action:"SET",module:"placements",enabled:false,locked:true,expected:null,collegeId:"foreign"}).success).toBe(false);
  expect(collegeRuleWriteSchema.safeParse({action:"INHERIT",module:"projects",expected:null,enabled:false}).success).toBe(false);
  expect(collegeRuleWriteSchema.safeParse({action:"SET",module:"unknown",enabled:true,locked:false,expected:null}).success).toBe(false);
 });
 it("distinguishes no stored rule, Off and unchanged locked state",()=>{
  expect(collegeRuleSame(null,{enabled:false,locked:false})).toBe(false);
  expect(collegeRuleNoChange(null,{action:"INHERIT",module:"projects",expected:null})).toBe(true);
  expect(collegeRuleNoChange({enabled:false,locked:true},{action:"SET",module:"projects",enabled:false,locked:true,expected:null})).toBe(true);
  expect(collegeRulePreview("placements",{action:"INHERIT",module:"placements",expected:null})).toContain("inheriting");
 });
 it("returns all three modules without private fields",()=>{
  expect(collegeRuleReadSnapshot([{module:"projects",enabled:false,locked:true}])).toEqual([
   {module:"projects",stored:{enabled:false,locked:true}},
   {module:"placements",stored:null},{module:"electives",stored:null}
  ]);
 });
});