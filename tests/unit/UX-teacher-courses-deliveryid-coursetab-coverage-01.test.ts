import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-courses-deliveryid-coursetab-01 /teacher/courses/[deliveryId]/[...courseTab] enforces page access and feedback contracts",()=>{
 const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx"),"utf8");
 expect(source).toContain('redirect(facultyCourseTabHref(deliveryId,requestedContent?"blueprint":"home")+');
 expect(source).toContain('if(filter!=="ALL")safe.set("filter",filter)');
 expect(source).toContain("notFound()");
 expect(source).toContain("getCurrentRequestContext");
});
