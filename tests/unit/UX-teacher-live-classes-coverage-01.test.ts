import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-live-classes-01 /teacher/live-classes keeps access and honest feedback",()=>{
 const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/live-classes/page.tsx"),"utf8");
 expect(s).toContain("getCurrentRequestContext");
 expect(s).toContain("<PageHeader eyebrow=\"Faculty · Courses\" title=\"Live classes\"");
 expect(s).toContain("<EmptyState title=\"No matching live classes\"");
 expect(s).toContain("role=\"alert\"");
});
