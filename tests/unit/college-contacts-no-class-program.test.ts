import {describe,it,expect} from "vitest";
import {collegeContactsQuerySchema,contactAcademicFiltersCompatible,parseCollegeContactsSearchParams} from "@/modules/people/college-contacts-model";
describe("College Contacts absent class scoped to selected enrollment",()=>{
 const id="00000000-0000-4000-8000-000000000004";
 it("permits class-absence in a chosen program, but rejects contradictory section ID",()=>{
  expect(contactAcademicFiltersCompatible(collegeContactsQuerySchema.parse({programId:id,classPresence:"NONE"}))).toBe(true);
  expect(()=>parseCollegeContactsSearchParams({programId:id,classPresence:"NONE",sectionId:id})).toThrow();
  expect(()=>parseCollegeContactsSearchParams({programId:id,classPresence:"NONE",enrollment:"NONE"})).not.toThrow();
 });
});
