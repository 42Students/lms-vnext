import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Super Admin Organizations exact dev-legacy copy",()=>{
 it("matches section headings and table headers in legacy Organizations.js",()=>{
  const page=read("src/app/(authenticated)/admin/organizations/page.tsx");
  for(const str of ["Create New Organization","Existing Organizations",'header: "Name"','title="Organizations"'])
    expect(page).toContain(str);
  expect(page).toContain('{canCreateGlobal?<section aria-label="Create New Organization"');
 });
 it("retains exact legacy create control and example",()=>{
  const form=read("src/components/admin/organization-create-form.tsx");
  expect(form).toContain("Organization name");
  expect(form).toContain('placeholder="e.g., ABC University"');
  expect(form).toContain('pending ? "Creating…" : "Create Organization"');
  expect(form).toContain("disabled={pending || !name.trim()}");
 });
});
