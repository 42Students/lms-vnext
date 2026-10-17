import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";

const src=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("College Admin narrow-screen academic setup",()=>{
 it("COL-academic-setup-41 stacks create and filter forms at 375px and preserves scrollable tables",()=>{
  const academic=src("src/components/academics/college-academic-directory.tsx");
  const structure=src("src/components/academics/college-structure-directory.tsx");
  const semester=src("src/components/academics/college-semester-management.tsx");
  const batch=src("src/components/academics/college-cohort-management.tsx");
  const classes=src("src/components/academics/college-section-management.tsx");
  expect(academic).toContain('grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4');
  for(const source of [semester,batch,classes]){
   expect(source).toContain('grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5');
   expect(source).toContain('className="space-y-3"');
  }
  for(const source of [academic,structure]){
   expect(source).toContain('role="region" tabIndex={0}');
   expect(source).toContain("overflow-x-auto");
   expect(source).toContain("sm:hidden");
   expect(source).toContain("Scroll sideways to view all");
  }
 });
});
