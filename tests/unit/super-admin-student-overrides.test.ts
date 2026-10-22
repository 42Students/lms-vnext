import {describe,it,expect} from "vitest";
import {explainLearnerModuleAccess,membershipOverrideSummary} from "@/modules/module-access/admin-trace-model";
describe("student overrides and locks summary",()=>{
 it("labels stored disabled rule separately from effective access",()=>{
  const chain=[{scopeType:"MEMBERSHIP" as const,scopeId:"m"},{scopeType:"COLLEGE" as const,scopeId:"c"},{scopeType:"GLOBAL" as const,scopeId:null}];
  const modules=explainLearnerModuleAccess(chain,[
   {scopeType:"MEMBERSHIP",scopeId:"m",module:"projects",enabled:false,locked:false},
   {scopeType:"GLOBAL",scopeId:null,module:"projects",enabled:true,locked:true},
   {scopeType:"MEMBERSHIP",scopeId:"m",module:"placements",enabled:true,locked:false},
  ]);
  const summary=membershipOverrideSummary(modules);
  expect(summary.find(x=>x.module==="projects")).toMatchObject({stored:false,winner:false});
  expect(summary.find(x=>x.module==="placements")).toMatchObject({stored:true,ignored:true,winner:false});
  expect(summary.find(x=>x.module==="electives")).toMatchObject({stored:null,locked:false});
 });
});
