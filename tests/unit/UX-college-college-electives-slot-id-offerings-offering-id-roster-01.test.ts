import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx"),"utf8");
it("UX-college-college-electives-slot-id-offerings-offering-id-roster-01 provides keyboard-scrolling wide roster with fixed identity",()=>{
 const table=readFileSync(join(process.cwd(),"src/components/ui/data-table.tsx"),"utf8");
 const scroll=readFileSync(join(process.cwd(),"src/components/ui/scroll-cue.tsx"),"utf8");
 expect(source).toContain("<DataTable");
 expect(table).toContain('<ScrollCue axis="x"');
 expect(table).toContain("sm:first:sticky sm:first:left-0");
 expect(scroll).toContain("tabIndex={edges.scrollable ? 0 : -1}");
 expect(scroll).toContain("role={edges.scrollable");
 expect(scroll).toContain('focus-visible:outline-[var(--lms-teal-deep)]');
 expect(source).toContain('min-h-11');
 expect(source).not.toContain("text-on-primary");
});
