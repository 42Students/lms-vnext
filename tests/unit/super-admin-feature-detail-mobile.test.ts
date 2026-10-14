import {describe,expect,it} from "vitest";
import {summarizeStoredModuleOverrides,describeStoredOverride} from "@/modules/module-access/admin-read-model";
describe("Super Admin lower-level module cards",()=>{
 it("counts only explicitly stored rules in the current scoped page",()=>{
  expect(summarizeStoredModuleOverrides([
   {enabled:true,locked:true},{enabled:false,locked:false},{enabled:true,locked:false},
  ])).toEqual({rules:3,enabled:2,locked:1});
  expect(summarizeStoredModuleOverrides([])).toEqual({rules:0,enabled:0,locked:0});
 });
 it("does not confuse inheritance with stored locks",()=>{
  expect(describeStoredOverride({enabled:false,locked:true})).toBe("Off · Locked");
 });
});
