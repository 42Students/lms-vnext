import {describe,expect,it} from "vitest";
import {collegeContactsHref,collegeContactsQuerySchema,parseCollegeContactsSearchParams} from "@/modules/people/college-contacts-model";
describe("College contacts boundary",()=>{
 it("validates tabs, server pagination and eliminates unknown tenant overrides",()=>{
  expect(collegeContactsQuerySchema.parse({})).toMatchObject({tab:"ALL",page:1,status:"ACTIVE"});
  expect(collegeContactsQuerySchema.safeParse({collegeId:"foreign"}).success).toBe(false);
  expect(collegeContactsQuerySchema.safeParse({tab:"MENTOR"}).success).toBe(false);
  expect(collegeContactsQuerySchema.safeParse({page:0}).success).toBe(false);
  expect(()=>parseCollegeContactsSearchParams({tab:["ALL","FACULTY"]})).toThrow("INVALID_CONTACT_FILTERS");
 });
 it("keeps tab and status in navigation and encodes search",()=>{
  expect(collegeContactsHref(collegeContactsQuerySchema.parse({tab:"FACULTY",q:"A&B",page:2})))
   .toBe("/college/contacts?tab=FACULTY&q=A%26B&page=2");
 });
});