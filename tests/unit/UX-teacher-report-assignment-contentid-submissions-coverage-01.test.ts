import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-report-assignment-contentid-submissions-01 /teacher/report/assignment/[contentId]/submissions keeps access and honest feedback",()=>{
 const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/page.tsx"),"utf8");
 expect(s).toContain("getCurrentRequestContext");
 expect(s).toContain("<PageHeader title=\"Assignment submissions\"");
 expect(s).toContain("role=\"alert\"");
 expect(s).toContain('<Tabs ariaLabel="Submission grading filters"');
});
