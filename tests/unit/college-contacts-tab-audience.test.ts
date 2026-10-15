import {describe,it,expect} from "vitest";
import {collegeContactsQuerySchema,collegeContactsTabHref} from "@/modules/people/college-contacts-model";
describe("College Contacts tab changes",()=>{
 it("drops Faculty-only audience on Student tab and resets pagination",()=>{
  const filter=collegeContactsQuerySchema.parse({tab:"FACULTY",audience:"FACULTY_ONLY",q:"Ada",page:4});
  const url=new URL(collegeContactsTabHref(filter,"STUDENT"),"https://college.example");
  expect(url.searchParams.get("tab")).toBe("STUDENT");
  expect(url.searchParams.has("audience")).toBe(false);
  expect(url.searchParams.has("page")).toBe(false);
  expect(url.searchParams.get("q")).toBe("Ada");
 });
 it("keeps dual-role audience when compatible",()=>{
  const filter=collegeContactsQuerySchema.parse({audience:"DUAL",status:"SUSPENDED"});
  const url=new URL(collegeContactsTabHref(filter,"FACULTY"),"https://college.example");
  expect(url.searchParams.get("audience")).toBe("DUAL");
  expect(url.searchParams.get("status")).toBe("SUSPENDED");
 });
});
