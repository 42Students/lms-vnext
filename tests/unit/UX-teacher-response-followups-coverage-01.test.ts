import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-response-followups-01 /teacher/response-followups keeps report scope and state contracts",()=>{
 const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/response-followups/page.tsx"),"utf8");
 expect(s).toContain("getCurrentRequestContext");
 expect(s).toContain("<PageHeader eyebrow=\"Faculty · Assessments\" title=\"Response follow-ups\"");
 expect(s).toContain("role=\"alert\"");
 expect(s).toContain("<Pagination label=\"Assessment follow-up pages\"");
});
