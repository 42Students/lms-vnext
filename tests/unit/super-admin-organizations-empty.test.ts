import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const page=readFileSync("src/app/(authenticated)/admin/organizations/page.tsx","utf8");
describe("Super Admin organization directory",()=>{
 it("has a scoped empty state",()=>{
  expect(page).toContain("organizations.length===0");
  expect(page).toContain("No organizations in this scope");
 });
 it("does not expose create form without permission",()=>{
  expect(page).toContain("canCreate ? <section");
  expect(page).toContain("<OrganizationCreateForm />");
 });
});
