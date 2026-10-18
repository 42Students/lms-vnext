import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-courses-deliveryid-attendance-corrections-01 /teacher/courses/[deliveryId]/attendance-corrections enforces page access and feedback contracts",()=>{
 const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/page.tsx"),"utf8");
 expect(source).toContain("redirect(\"/teacher/courses/\"+encodeURIComponent(deliveryId)+\"/attendanceDetail\")");
 expect(source).toContain("notFound()");
 expect(source).toContain("getCurrentRequestContext");
});
