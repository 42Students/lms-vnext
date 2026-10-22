import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/academics/sections/[sectionId]/page.tsx"),"utf8");
it("UX-college-college-academics-sections-section-id-01 preserves legacy copy and responsive UX contracts",()=>{
 const content=readFileSync(join(process.cwd(),
 "src/components/academics/section-operations.tsx"),"utf8");
 const table=readFileSync(join(process.cwd(),"src/components/ui/data-table.tsx"),"utf8");
 expect(route).toContain("AcademicsSectionPage");
 expect(content).toContain('className="grid min-w-0');
 expect(content).toContain("<DataTable");
 expect(table).toContain('<ScrollCue axis="x"');
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-[#26bac7]");
 
});
