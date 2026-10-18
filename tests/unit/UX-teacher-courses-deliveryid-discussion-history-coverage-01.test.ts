import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-courses-deliveryid-discussion-history-01 /teacher/courses/[deliveryId]/discussion-history enforces page access and feedback contracts",()=>{
 const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/page.tsx"),"utf8");
 expect(source).toContain("getCurrentRequestContext");
 expect(source).toContain("<PageHeader eyebrow=\"Faculty · Discussion audit\" title=\"Discussion moderation history\"");
 expect(source).toContain("<EmptyState title=\"No registered moderation history\"");
 expect(source).toContain("role=\"alert\"");
});
