import {describe,expect,it} from "vitest";
import {academicModuleRuleInput,descendantRuleMatches} from "@/modules/module-access/admin-descendant-rule-model";
const id="11111111-1111-4111-8111-111111111111";
describe("SA-tenants-modules-27 academic descendant editing guards",()=>{
 it("requires explicit expected state and excludes placements while resolver ignores it",()=>{
  const base={scopeType:"COHORT",scopeId:id,module:"projects",action:"SET",enabled:false,locked:true,expected:null};
  expect(academicModuleRuleInput.safeParse(base).success).toBe(true);
  expect(academicModuleRuleInput.safeParse({...base,module:"placements"}).success).toBe(false);
  expect(academicModuleRuleInput.safeParse({...base,enabled:undefined}).success).toBe(false);
 });
 it("detects optimistic conflicts",()=>{
  expect(descendantRuleMatches(null,{enabled:true,locked:false})).toBe(false);
  expect(descendantRuleMatches({enabled:true,locked:true},{enabled:true,locked:false})).toBe(false);
  expect(descendantRuleMatches({enabled:false,locked:false},{enabled:false,locked:false})).toBe(true);
 });
});
