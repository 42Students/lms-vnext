import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const expected=[{"page":"departments","description":"Choose a college in the header above to see its departments."},{"page":"programs","description":"Read-only program catalogue for the selected scope. Select a college before creating or editing programs."},{"page":"courses","description":"Select a college to manage Courses"},{"page":"lessons","description":"Choose a college in the header above to see its lessons."},{"page":"lecture-halls","description":"Choose a college in the header above to see its lecture halls."}];
describe("Super Admin exact dev-legacy unselected-college copy",()=>{
 for(const {page,description} of expected)it(page+" exact copy",()=>{
  const src=readFileSync(join(process.cwd(),"src/app/(authenticated)/admin",page,"page.tsx"),"utf8");
  expect(src).toContain("adminScope?.collegeId");
  expect(src).toContain(description);
 });
 it("capitalizes the legacy Lecture Halls heading",()=>{
  const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/admin/lecture-halls/page.tsx"),"utf8");
  expect(source).toContain('title="Lecture Halls"');
 });
});
