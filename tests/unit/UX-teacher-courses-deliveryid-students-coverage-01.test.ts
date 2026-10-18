import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-courses-deliveryid-students-01 /teacher/courses/[deliveryId]/students keeps page scope and true states",()=>{
const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx"),"utf8");
expect(s).toContain("redirect(\"/teacher/courses/\"+encodeURIComponent(target.deliveryId)+\"/students\")");
expect(s).toContain("notFound()");
expect(s).toContain("getCurrentRequestContext");
expect(s).toContain("<PageHeader\n        eyebrow=\"Faculty · Course\"\n        title=\"Students\"");
});
