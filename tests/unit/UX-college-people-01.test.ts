import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/people/page.tsx"),"utf8");
describe("/college/people UX",()=>{
 it("UX-college-people-01 serves the canonical college People workspace",()=>{
  expect(source).toContain('import CollegeContactsPage from "../contacts/page"');
  expect(source).toContain("export default async function CollegePeoplePage");
  expect(source).toContain("return CollegeContactsPage({searchParams})");
 });
 it("UX-college-people-02 preserves the selected role and college scope",()=>{
  expect(source).toContain("selected active COLLEGE_ADMIN membership");
  expect(source).toContain("searchParams");
  expect(source).not.toContain('redirect("/admin/people/directory")');
 });
});
