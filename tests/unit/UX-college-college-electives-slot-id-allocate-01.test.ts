import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx"),"utf8");
it("UX-college-college-electives-slot-id-allocate-01 provides keyboard-scrolling wide roster with fixed identity",()=>{
 const selection=readFileSync(join(process.cwd(),"src/components/academics/elective-eligible-selection.tsx"),"utf8");
 expect(source).toContain("<ElectiveEligibleSelection");
 const table=readFileSync(join(process.cwd(),"src/components/ui/data-table.tsx"),"utf8");
 const scroll=readFileSync(join(process.cwd(),"src/components/ui/scroll-cue.tsx"),"utf8");
 expect(selection).toContain("<DataTable");
 expect(table).toContain('<ScrollCue axis="x"');
 expect(table).toContain("md:first:sticky md:first:left-0");
 expect(table).toContain("md:first:z-10");
 expect(scroll).toContain("tabIndex={edges.scrollable ? 0 : -1}");
 expect(scroll).toContain("role={edges.scrollable");
 expect(scroll).toContain('focus-visible:outline-[var(--lms-primary-text)]');
 expect(source).toContain('min-h-11');
 expect(source).not.toContain("text-on-primary");
});
