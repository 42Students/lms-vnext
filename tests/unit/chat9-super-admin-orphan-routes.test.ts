import {describe,expect,it} from "vitest";
import {existsSync,readFileSync} from "node:fs";
import {join} from "node:path";
describe("Super Admin sidebar consolidation retains orphan routes",()=>{
 const root=join(process.cwd(),"src/app/(authenticated)");
 it("keeps domains, academics overview and audit findings reachable",()=>{
  const pairs=[
    ["admin/tenants/page.tsx","/admin/domains"],
    ["admin/departments/page.tsx","/admin/academics"],
    ["admin/audit/page.tsx","/tracker/audit-findings"],
  ];
  for(const [page,target] of pairs)
   expect(readFileSync(join(root,page),"utf8")).toContain('href="'+target+'"');
  expect(existsSync(join(root,"admin/domains/page.tsx"))).toBe(true);
  expect(existsSync(join(root,"admin/academics/page.tsx"))).toBe(true);
  expect(existsSync(join(root,"tracker/audit-findings/page.tsx"))).toBe(true);
 });
 it("keeps the existing dedicated account controls available",()=>{
  expect(existsSync(join(root,"admin/features/[collegeId]/page.tsx"))).toBe(true);
  expect(existsSync(join(root,"admin/people/directory/page.tsx"))).toBe(true);
 });
});
