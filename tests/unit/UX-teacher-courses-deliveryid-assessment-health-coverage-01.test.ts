import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-courses-deliveryid-assessment-health-01 /teacher/courses/[deliveryId]/assessment-health enforces page access and feedback contracts",()=>{
 const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/page.tsx"),"utf8");
 expect(source).toContain("getCurrentRequestContext");
 expect(source).toContain("<PageHeader eyebrow=\"Faculty · Course Report\" title=\"Section assessment health\"");
 expect(source).toContain("<EmptyState title=\"No published assessments matched\"");
 expect(source).toContain("role=\"alert\"");
});
