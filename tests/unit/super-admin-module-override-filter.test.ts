import {describe,expect,it} from "vitest";
import {adminModuleOverrideFilterSchema} from "@/modules/module-access/admin-override-filter-model";
describe("Super Admin descendant filter",()=>{
 it("accepts source-backed modules only",()=>{
  for(const value of ["projects","placements","electives"])expect(adminModuleOverrideFilterSchema.parse(value)).toBe(value);
  expect(adminModuleOverrideFilterSchema.parse(undefined)).toBeUndefined();
 });
 it("rejects guessed and injected filters",()=>{
  for(const value of ["all","admin","placements' OR TRUE","",["projects","electives"]])expect(adminModuleOverrideFilterSchema.safeParse(value).success).toBe(false);
 });
 it("requires a recognized scope together with a filtered module",()=>{
  expect(adminModuleOverrideFilterSchema.safeParse("projects").success).toBe(true);
  expect(adminModuleOverrideFilterSchema.safeParse("GLOBAL").success).toBe(false);
 });
});
