import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
describe("Super Admin create-college exact legacy labels",()=>{
 const source=readFileSync(join(process.cwd(),
  "src/components/admin/college-create-form.tsx"),"utf8");
 it("preserves exact legacy create labels and examples",()=>{
  for(const text of ["College Name","Unique ID / Code",
   "e.g., Engineering College","e.g., nsrit or eng-college",
   'pending ? "Creating…" : "Create College"'])
    expect(source).toContain(text);
 });
 it("retains scope-controlled organization ID and required fields",()=>{
  expect(source).toMatch(/const \{\s*organizationId,\s*name,\s*code,/);
  expect(source).toContain('apiFetch<unknown>("/api/colleges"');
  expect(source).toContain("!organizationId");
  expect(source).toContain("!code.trim()");
 });
});
