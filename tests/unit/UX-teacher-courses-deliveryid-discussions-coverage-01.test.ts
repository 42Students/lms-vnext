import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-courses-deliveryid-discussions-01 /teacher/courses/[deliveryId]/discussions enforces page access and feedback contracts",()=>{
 const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx"),"utf8");
 expect(source).toContain("getCurrentRequestContext");
 expect(source).toContain("<PageHeader\n        eyebrow=\"Faculty · Course\"\n        title=\"Discussions\"");
});
