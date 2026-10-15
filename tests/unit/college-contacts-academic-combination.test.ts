import {describe,expect,it} from "vitest";
import {collegeContactsQuerySchema,contactAcademicFiltersCompatible} from "@/modules/people/college-contacts-model";
describe("Contacts combined placement input",()=>{
 it("validates independent exact fields that must resolve on one active enrollment",()=>{
  const selected=collegeContactsQuerySchema.parse({programId:"00000000-0000-4000-8000-000000000101",cohortId:"00000000-0000-4000-8000-000000000102",sectionId:"00000000-0000-4000-8000-000000000103"});
  expect(contactAcademicFiltersCompatible(selected)).toBe(true);
  expect(contactAcademicFiltersCompatible({...selected,enrollment:"NONE"})).toBe(false);
  expect(collegeContactsQuerySchema.safeParse({programId:"cross-tenant"}).success).toBe(false);
 });
});
