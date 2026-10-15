import {describe,it,expect} from "vitest";
import {collegeContactFilterMessage,parseCollegeContactsSearchParams} from "@/modules/people/college-contacts-model";
describe("College contact invalid-filter recovery messages",()=>{
 it("explains a reversed joined-date window without fetching contacts",()=>{
  expect(()=>parseCollegeContactsSearchParams({joinedFrom:"2026-11-02",joinedThrough:"2026-10-15"})).toThrow("INVALID_CONTACT_DATE_WINDOW");
  expect(collegeContactFilterMessage(new Error("INVALID_CONTACT_DATE_WINDOW"))).toMatch(/start date must be on or before/);
 });
 it("explains contradictory roles and academic selectors",()=>{
  expect(collegeContactFilterMessage(new Error("INVALID_CONTACT_ROLE_AUDIENCE"))).toMatch(/incompatible/);
  expect(collegeContactFilterMessage(new Error("INVALID_CONTACT_ACADEMIC_COMBINATION"))).toMatch(/cannot be combined/);
 });
 it("never exposes arbitrary raw values in an error screen",()=>{
  expect(collegeContactFilterMessage(new Error("internal college secret abc123"))).not.toContain("abc123");
  expect(collegeContactFilterMessage({privateId:"sensitive"})).toMatch(/invalid/);
 });
});
