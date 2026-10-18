import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-courses-deliveryid-gradebook-01 /teacher/courses/[deliveryId]/gradebook keeps page scope and true states",()=>{
const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page.tsx"),"utf8");
expect(s).toContain("getCurrentRequestContext");
expect(s).toContain("<PageHeader title=\"Published gradebook\"");
expect(s).toContain("<EmptyState title=\"No current enrolled learners\"");
expect(s).toContain("role=\"alert\"");
});
