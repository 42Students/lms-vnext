import {describe,it,expect} from "vitest";
import {resolveModuleAccessFromRules} from "@/modules/module-access/service";
const chain=[{scopeType:"MEMBERSHIP" as const,scopeId:"student"},
 {scopeType:"COLLEGE" as const,scopeId:"college"},
 {scopeType:"GLOBAL" as const,scopeId:null}];
describe("LEARNER-projects-24/25 module access parity",()=>{
 it("membership disabled overrides college enabled",()=>{
  const decision=resolveModuleAccessFromRules(chain,[
   {scopeType:"MEMBERSHIP",scopeId:"student",module:"projects",enabled:false,locked:false},
   {scopeType:"COLLEGE",scopeId:"college",module:"projects",enabled:true,locked:false},
  ]);
  expect(decision.projects.enabled).toBe(false);
 });
 it("locked college disable wins even if an individual enabled",()=>{
  const decision=resolveModuleAccessFromRules(chain,[
   {scopeType:"MEMBERSHIP",scopeId:"student",module:"projects",enabled:true,locked:false},
   {scopeType:"COLLEGE",scopeId:"college",module:"projects",enabled:false,locked:true},
  ]);
  expect(decision.projects.enabled).toBe(false);
 });
});
