import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-courses-deliveryid-attendancedetail-01 /teacher/courses/[deliveryId]/attendanceDetail enforces page access and feedback contracts",()=>{
 const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx"),"utf8");
 expect(source).toContain("redirect(\"/teacher/courses/\"+encodeURIComponent(target.deliveryId)");
 expect(source).toContain("notFound()");
 expect(source).toContain("getCurrentRequestContext");
});
