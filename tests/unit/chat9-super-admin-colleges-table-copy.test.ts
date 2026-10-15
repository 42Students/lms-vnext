import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
describe("Super Admin Colleges legacy exact table headings",()=>{
 const source=readFileSync(join(process.cwd(),
  "src/app/(authenticated)/admin/colleges/page.tsx"),"utf8");
 it("has Name Organization Unique ID City State headers in legacy order",()=>{
  const labels=["Name","Organization","Unique ID","City","State"];
  const positions=labels.map(label=>source.indexOf('header: "'+label+'"'));
  expect(positions.every(n=>n>=0)).toBe(true);
  expect([...positions].sort((a,b)=>a-b)).toEqual(positions);
 });
 it("displays real scoped college organization and code, not guessed fields",()=>{
  expect(source).toContain("organizationNames.get(college.organizationId)");
  expect(source).toContain("cell: (college) => college.code");
  expect(source).toContain("canManageCollegeDirectoryRow(context,college)");
  expect(source).toContain('title="Colleges"');
 });
});
