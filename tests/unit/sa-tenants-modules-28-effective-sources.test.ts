import {describe,it,expect} from "vitest";
import {resolveModuleAccessFromRules} from "@/modules/module-access/service";
import {readFileSync} from "node:fs";
describe("SA-tenants-modules-28 effective hierarchy inventory",()=>{
 it("uses the live resolver; a locked college shadows section placements",()=>{
  const result=resolveModuleAccessFromRules([
   {scopeType:"SECTION",scopeId:"child"},{scopeType:"COLLEGE",scopeId:"parent"},
   {scopeType:"GLOBAL",scopeId:null},
  ],[
   {scopeType:"SECTION",scopeId:"child",module:"placements",enabled:true,locked:false},
   {scopeType:"COLLEGE",scopeId:"parent",module:"placements",enabled:false,locked:true},
  ]);
  expect(result.placements).toMatchObject({enabled:false,level:"COLLEGE",scopeId:"parent"});
 });
 it("renders effective source and shadowed configured values separately",()=>{
  const service=readFileSync(new URL("../../src/modules/module-access/admin-descendant-rule-write.ts",import.meta.url),"utf8");
  const view=readFileSync(new URL("../../src/components/admin/academic-module-scope-inventory.tsx",import.meta.url),"utf8");
  expect(service).toContain("resolveModuleAccessFromRules(chain");
  expect(view).toContain("scope.placementsEffective");
  expect(view).toContain("scope.placementsShadowed");
 });
});
