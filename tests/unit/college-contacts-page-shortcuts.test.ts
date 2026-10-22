import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {collegeContactsHref,collegeContactsQuerySchema} from "@/modules/people/college-contacts-model";
describe("College Contacts first and last page navigation",()=>{
 it("retains all active scoped filters while changing only pagination",()=>{
  const filter=collegeContactsQuerySchema.parse({q:"Anu",tab:"STUDENT",page:4,pageSize:20});
  const first=new URL(collegeContactsHref({...filter,page:1}),"https://college.example");
  const last=new URL(collegeContactsHref({...filter,page:12}),"https://college.example");
  expect(first.searchParams.get("q")).toBe("Anu");
  expect(last.searchParams.get("tab")).toBe("STUDENT");
  expect(first.searchParams.has("page")).toBe(false);
  expect(last.searchParams.get("page")).toBe("12");
  expect(last.searchParams.get("pageSize")).toBe("20");
 });
 it("renders boundary shortcuts conditionally in the contact pager",()=>{
  const page=readFileSync("src/app/(authenticated)/college/contacts/page.tsx","utf8");
  expect(page).toContain("filter.page>2");
  expect(page).toContain("filter.page<pageCount-1");
  expect(page).toContain(">First</Link>");
  expect(page).toContain(">Last</Link>");
 });
});
