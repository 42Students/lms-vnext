import {describe,it,expect} from "vitest";
import {parseCollegeContactsExportParams} from "@/modules/people/college-contacts-export-model";
import {collegeContactsQuerySchema,collegeContactsHref} from "@/modules/people/college-contacts-model";
describe("College Contacts member-specific CSV",()=>{
 const id="00000000-0000-4000-8000-000000000181";
 it("preserves exact member constraint across list and export parsers",()=>{
  const href=collegeContactsHref(collegeContactsQuerySchema.parse({membershipId:id,tab:"STUDENT"}));
  expect(href).toContain(id);
  expect(parseCollegeContactsExportParams(new URLSearchParams({membershipId:id,tab:"STUDENT"})).membershipId).toBe(id);
 });
 it("rejects arbitrary tenant and repeated member IDs",()=>{
  expect(()=>parseCollegeContactsExportParams(new URLSearchParams("membershipId=../../other"))).toThrow();
  expect(()=>parseCollegeContactsExportParams(new URLSearchParams("membershipId="+id+"&membershipId="+id))).toThrow();
 });
});
