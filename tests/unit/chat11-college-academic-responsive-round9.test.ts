import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const src=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("College Admin narrow-screen academic setup",()=>{
 it("COL-academic-setup-41 uses mobile-stacked academic forms and shared keyboard-scrollable tables",()=>{
  const academic=src("src/components/academics/college-academic-directory.tsx");
  const structure=src("src/components/academics/college-structure-directory.tsx");
  const semester=src("src/components/academics/college-semester-management.tsx");
  const batch=src("src/components/academics/college-cohort-management.tsx");
  const classes=src("src/components/academics/college-section-management.tsx");
  const table=src("src/components/ui/data-table.tsx");
  const scroll=src("src/components/ui/scroll-cue.tsx");
  expect(academic).toContain("grid min-w-0 grid-cols-1");
  expect(academic).toContain("min-[768px]:grid-cols-2");
  expect(academic).toContain("min-[992px]:grid-cols-4");
  for(const component of [semester,batch,classes]){
   expect(component).toContain("grid min-w-0 grid-cols-1");
   expect(component).toContain("min-h-11");
  }
  for(const component of [academic,structure]){
   expect(component).toContain('role="region" tabIndex={0}');
   expect(component).toContain("<DataTable");
  }
  expect(table).toContain('<ScrollCue axis="x"');
  expect(scroll).toContain('tabIndex={edges.scrollable ? 0 : -1}');
  expect(scroll).toContain('role={edges.scrollable ? "region" : undefined}');
 });
});
