import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-profile-teaching-01 /teacher/profile/teaching keeps access and honest feedback",()=>{
 const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/profile/teaching/page.tsx"),"utf8");
 expect(s).toContain("getCurrentRequestContext");
 expect(s).toContain("<PageHeader eyebrow=\"Faculty · Self Profile\" title=\"Current teaching assignments\"");
 expect(s).toContain("<EmptyState title=\"No current teaching assignments\"");
 expect(s).toContain("role=\"alert\"");
});
