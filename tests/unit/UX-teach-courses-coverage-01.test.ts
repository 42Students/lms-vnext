import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teach-courses-01 /teach/courses keeps report scope and state contracts",()=>{
 const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/teach/courses/page.tsx"),"utf8");
 expect(s).toContain("getCurrentRequestContext");
 expect(s).toContain("<PageHeader\n        eyebrow=\"Faculty\"\n        title=\"My Teaching Courses\"");
});
