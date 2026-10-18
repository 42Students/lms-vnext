import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-report-assignment-contentid-01 /teacher/report/assignment/[contentId] keeps access and honest feedback",()=>{
 const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx"),"utf8");
 expect(s).toContain("notFound()");
 expect(s).toContain("getCurrentRequestContext");
 expect(s).toContain("role=\"status\"");
});
