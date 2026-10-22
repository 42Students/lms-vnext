import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const page=readFileSync("src/app/(authenticated)/admin/organizations/page.tsx","utf8");
describe("Super Admin organization directory",()=>{
 it("has a scoped empty state",()=>{
  expect(page).toContain('rows={visible}');
  expect(page).toContain("No organizations found.");
 });
 it("does not expose create form without permission",()=>{
  expect(page).toContain('{canCreateGlobal?<section aria-label="Create New Organization"');
  expect(page).toContain("<OrganizationCreateForm />");
 });
});
