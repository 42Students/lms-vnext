import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/course-progress/page.tsx"),"utf8");
it("UX-college-college-course-progress-01 verifies scoped responsive details",()=>{
 expect(route).toContain("min-w-0 max-w-full");
 expect(route).toContain("<CollegeProgressCapture>");
 expect(route).toContain("CollegeLearnerProgressReport");
 const report=readFileSync(join(process.cwd(),"src/components/courses/college-learner-progress-report.tsx"),"utf8");
 expect(report).toContain('mobileMode="scroll"');
 const table=readFileSync(join(process.cwd(),"src/components/ui/data-table.tsx"),"utf8");
 expect(table).toContain('<ScrollCue axis="x"');
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-[#26bac7]");
 
});
