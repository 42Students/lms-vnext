import {describe,it,expect} from "vitest";
import {collegeContactsHref,collegeContactsQuerySchema,parseCollegeContactsSearchParams} from "@/modules/people/college-contacts-model";
describe("Exact member Contacts navigation",()=>{
 const membershipId="00000000-0000-4000-8000-000000000145";
 it("preserves exact membership in filtered, paged and tab URLs",()=>{
  const filter=collegeContactsQuerySchema.parse({membershipId,tab:"STUDENT",page:2,q:"J"});
  const href=collegeContactsHref(filter);
  expect(href).toContain("membershipId="+membershipId);
  expect(href).toContain("page=2");
  expect(parseCollegeContactsSearchParams(Object.fromEntries(new URL(href,"https://lms.invalid").searchParams)).membershipId).toBe(membershipId);
 });
 it("rejects forged membership input",()=>expect(()=>parseCollegeContactsSearchParams({membershipId:"../../other"})).toThrow());
});
