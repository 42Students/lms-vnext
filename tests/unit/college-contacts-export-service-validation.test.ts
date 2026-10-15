import {describe,it,expect} from "vitest";
import {assertCollegeContactExportFilters,collegeContactsExportSchema} from "@/modules/people/college-contacts-export-model";
describe("Direct College Contacts export filter validation",()=>{
 const valid=(raw:Record<string,string>)=>collegeContactsExportSchema.parse(raw);
 it("rejects impossible date windows and role-audience combinations before reads",()=>{
  expect(()=>assertCollegeContactExportFilters(valid({joinedFrom:"2026-10-16",joinedThrough:"2026-10-15"}))).toThrow("INVALID_CONTACT_EXPORT");
  expect(()=>assertCollegeContactExportFilters(valid({tab:"STUDENT",audience:"FACULTY_ONLY"}))).toThrow("INVALID_CONTACT_EXPORT");
  expect(()=>assertCollegeContactExportFilters(valid({teaching:"NONE",teachingRole:"PRIMARY"}))).toThrow("INVALID_CONTACT_EXPORT");
 });
 it("preserves an authorized single-member scoped query",()=>{
  const member="00000000-0000-4000-8000-000000000099";
  expect(()=>assertCollegeContactExportFilters(valid({membershipId:member,tab:"STUDENT"}))).not.toThrow();
 });
});
