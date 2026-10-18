import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-courses-deliveryid-notices-01 /teacher/courses/[deliveryId]/notices keeps page scope and true states",()=>{
const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/courses/[deliveryId]/notices/page.tsx"),"utf8");
expect(s).toContain("redirect(\"/teacher/courses/\"+encodeURIComponent(deliveryId)+\"/discussions\")");
expect(s).toContain("getCurrentRequestContext");
});
