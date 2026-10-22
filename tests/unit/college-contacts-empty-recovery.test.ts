import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {clearedCollegeContactsHref} from "@/modules/people/college-contacts-model";
describe("College Contacts filtered-empty recovery",()=>{
 it("clears filters while keeping the selected contact category",()=>{
  expect(clearedCollegeContactsHref("STUDENT")).toBe("/college/contacts?tab=STUDENT");
  const page=readFileSync("src/app/(authenticated)/college/contacts/page.tsx","utf8");
  expect(page).toContain("No contacts match your search");
  expect(page).toContain("No contacts match your filters");
  expect(page).toContain("Clear filters in this tab");
  expect(page).toContain("clearedCollegeContactsHref(filter.tab)");
 });
});
