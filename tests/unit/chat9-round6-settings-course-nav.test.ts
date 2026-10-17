import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("TPO settings responsive navigation and course policy",()=>{
 it("TPO-settings-audit-42 loads the entire authorized active-college preparation course list, not first 200",()=>{
  const s=source("src/modules/placements/tpo-configuration-read-service.ts");
  const p=s.slice(s.indexOf("export async function listTpoPrepCourses"));
  expect(p).toContain("eq(departments.collegeId,collegeId)");
  expect(p).toContain('eq(courses.status,"ACTIVE")');
  expect(p).not.toContain("limit(200)");
  expect(source("src/components/tpo/tpo-prep-readiness-editor.tsx")).toContain("search");
  expect(source("src/app/(authenticated)/tpo/settings/prep-readiness/page.tsx")).toContain("coursesResult.ok");
 });
 it("TPO-settings-audit-07 offers vertical sticky grouped sections on desktop while retaining mobile wrapping and aria-current",()=>{
  const s=source("src/components/placements/tpo-settings-nav.tsx");
  expect(s).toContain("md:sticky md:top-4");
  expect(s).toContain("md:float-left md:mr-6 md:w-56");
  expect(s).toContain("md:flex-col md:items-stretch");
  expect(s).toContain('aria-current={active===item.id?"page":undefined}');
  expect(s).toContain("flex flex-wrap gap-2");
 });
});
