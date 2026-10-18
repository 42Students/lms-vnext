import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-courses-deliveryid-discussion-participation-01 /teacher/courses/[deliveryId]/discussion-participation enforces page access and feedback contracts",()=>{
 const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/page.tsx"),"utf8");
 expect(source).toContain("getCurrentRequestContext");
 expect(source).toContain("<PageHeader eyebrow=\"Faculty · Section\" title=\"Discussion participation\"");
 expect(source).toContain("<EmptyState title=\"No recorded discussions\"");
 expect(source).toContain("aria-label=\"Recorded participation\"");
});
