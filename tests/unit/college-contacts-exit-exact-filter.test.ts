import {describe,it,expect} from "vitest";
import {collegeContactsQuerySchema,collegeContactsWithoutMemberHref} from "@/modules/people/college-contacts-model";
describe("College Contacts exact-person navigation",()=>{
 it("removes one bookmarked ID and stale pagination, preserving context filters",()=>{
  const id="11111111-1111-4111-8111-111111111111";
  const filter=collegeContactsQuerySchema.parse({membershipId:id,page:7,tab:"STUDENT",q:"Anu",status:"ACTIVE"});
  const url=new URL(collegeContactsWithoutMemberHref(filter),"https://college.example");
  expect(url.searchParams.has("membershipId")).toBe(false);
  expect(url.searchParams.has("page")).toBe(false);
  expect(url.searchParams.get("tab")).toBe("STUDENT");
  expect(url.searchParams.get("q")).toBe("Anu");
 });
});
