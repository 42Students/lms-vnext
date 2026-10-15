import {describe,it,expect} from "vitest";
import {collegeContactsQuerySchema,contactRoleAudienceCompatible,parseCollegeContactsSearchParams} from "@/modules/people/college-contacts-model";
import {parseCollegeContactsExportParams} from "@/modules/people/college-contacts-export-model";
describe("College Contacts tab versus membership role-audience",()=>{
 it("rejects impossible role-only combinations before querying",()=>{
  for(const value of [{tab:"STUDENT",audience:"FACULTY_ONLY"},{tab:"FACULTY",audience:"LEARNER_ONLY"}]){
   expect(contactRoleAudienceCompatible(value)).toBe(false);
   expect(()=>parseCollegeContactsSearchParams(value)).toThrow("INVALID_CONTACT_ROLE_AUDIENCE");
   expect(()=>parseCollegeContactsExportParams(new URLSearchParams(value))).toThrow("INVALID_CONTACT_EXPORT");
  }
 });
 it("still allows dual-role memberships and a general All tab",()=>{
  expect(contactRoleAudienceCompatible(collegeContactsQuerySchema.parse({tab:"STUDENT",audience:"DUAL"}))).toBe(true);
  expect(contactRoleAudienceCompatible(collegeContactsQuerySchema.parse({tab:"ALL",audience:"FACULTY_ONLY"}))).toBe(true);
 });
});
