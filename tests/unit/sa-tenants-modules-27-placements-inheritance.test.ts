import {describe,it,expect} from "vitest";
import {academicModuleRuleInput} from "@/modules/module-access/admin-descendant-rule-model";
import {resolveModuleAccessFromRules,isModuleScopeIgnored} from "@/modules/module-access/service";
const id=(i:number)=>"00000000-0000-4000-8000-"+String(i).padStart(12,"0");
describe("SA-tenants-modules-27 academic Placements module policies",()=>{
 const chain=[
  {scopeType:"SECTION" as const,scopeId:id(1)},
  {scopeType:"COHORT" as const,scopeId:id(2)},
  {scopeType:"PROGRAM" as const,scopeId:id(3)},
  {scopeType:"DEPARTMENT" as const,scopeId:id(4)},
  {scopeType:"COLLEGE" as const,scopeId:id(5)},
  {scopeType:"ORGANIZATION" as const,scopeId:id(6)},
  {scopeType:"GLOBAL" as const,scopeId:null},
 ];
 it("keeps Placements governed at college level instead of descendant scopes",()=>{
  expect(academicModuleRuleInput.safeParse({
   scopeType:"SECTION",scopeId:id(1),module:"placements",action:"SET",
   enabled:true,locked:false,expected:null,
  }).success).toBe(false);
  expect(isModuleScopeIgnored("placements","COHORT")).toBe(true);
 });
 it("ignores stored lower-level placement toggles without inverting college policy",()=>{
  const result=resolveModuleAccessFromRules(chain,[
   {scopeType:"COLLEGE",scopeId:id(5),module:"placements",enabled:false,locked:false},
   {scopeType:"COHORT",scopeId:id(2),module:"placements",enabled:true,locked:false},
  ]);
  expect(result.placements).toMatchObject({enabled:false,level:"COLLEGE"});
 });
 it("a locked college ancestor defeats a section rule",()=>{
  const result=resolveModuleAccessFromRules(chain,[
   {scopeType:"COLLEGE",scopeId:id(5),module:"placements",enabled:false,locked:true},
   {scopeType:"SECTION",scopeId:id(1),module:"placements",enabled:true,locked:false},
  ]);
  expect(result.placements).toMatchObject({enabled:false,level:"COLLEGE",locked:true});
 });
});
