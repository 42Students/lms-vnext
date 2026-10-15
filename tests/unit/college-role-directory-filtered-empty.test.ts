import {describe,it,expect} from "vitest";
import {collegeRoleDirectoryHasActiveFilters,collegeRoleDirectoryQuerySchema} from "@/modules/people/college-role-directory-model";
describe("College Faculty and Student empty-state recovery",()=>{
 it("distinguishes an unfiltered empty college from a no-match roster",()=>{
  expect(collegeRoleDirectoryHasActiveFilters("LEARNER",collegeRoleDirectoryQuerySchema.parse({}))).toBe(false);
  expect(collegeRoleDirectoryHasActiveFilters("LEARNER",collegeRoleDirectoryQuerySchema.parse({q:"Nobody"}))).toBe(true);
 });
 it("does not treat pagination and sort as restrictive filters",()=>{
  expect(collegeRoleDirectoryHasActiveFilters("FACULTY",collegeRoleDirectoryQuerySchema.parse({page:8,pageSize:50,sort:"OLDEST"}))).toBe(false);
 });
 it("recognizes role-specific facets",()=>{
  expect(collegeRoleDirectoryHasActiveFilters("FACULTY",collegeRoleDirectoryQuerySchema.parse({teaching:"NONE"}))).toBe(true);
  expect(collegeRoleDirectoryHasActiveFilters("LEARNER",collegeRoleDirectoryQuerySchema.parse({enrollment:"NONE"}))).toBe(true);
 });
});
