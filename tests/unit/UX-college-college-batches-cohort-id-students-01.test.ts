import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx"),"utf8");
it("UX-college-college-batches-cohort-id-students-01 provides keyboard-scrolling wide roster with fixed identity",()=>{
 expect(source).toContain("tabIndex={0}");
 expect(source).toContain("sticky left-0");
 expect(source).toContain('focus-visible:outline-[var(--lms-teal-deep)]');
 expect(source).toContain('min-h-11');
 expect(source).not.toContain("text-on-primary");
});
