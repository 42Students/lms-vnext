import {describe,it,expect} from "vitest";
import {collegePeopleHasFilters,collegePeopleDirectoryFilterSchema} from "@/modules/people/college-people-directory-model";
describe("College People zero-state semantics",()=>{
 it("distinguishes no-membership setup from filter exclusion",()=>{
  expect(collegePeopleHasFilters(collegePeopleDirectoryFilterSchema.parse({}))).toBe(false);
  expect(collegePeopleHasFilters(collegePeopleDirectoryFilterSchema.parse({role:"LEARNER"}))).toBe(true);
  expect(collegePeopleHasFilters(collegePeopleDirectoryFilterSchema.parse({q:"none",status:"ACTIVE"}))).toBe(true);
 });
 it("ignores page number",()=>expect(collegePeopleHasFilters(collegePeopleDirectoryFilterSchema.parse({page:5}))).toBe(false));
});
