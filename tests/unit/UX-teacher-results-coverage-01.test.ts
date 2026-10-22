import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-results-01 /teacher/results keeps report scope and state contracts",()=>{
 const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/results/page.tsx"),"utf8");
 expect(s).toContain("getCurrentRequestContext");
 expect(s).toContain("<PageHeader title=\"Assessment results\"");
 expect(s).toContain("role=\"alert\"");
 expect(s).toContain("role=\"status\"");
});
