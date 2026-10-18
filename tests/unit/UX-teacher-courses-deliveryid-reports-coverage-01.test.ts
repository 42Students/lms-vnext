import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-courses-deliveryid-reports-01 /teacher/courses/[deliveryId]/reports keeps page scope and true states",()=>{
const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/courses/[deliveryId]/reports/page.tsx"),"utf8");
expect(s).toContain("getCurrentRequestContext");
expect(s).toContain("<PageHeader title=\"Section reports\"");
expect(s).toContain("<EmptyState title=\"No published assessment reports\"");
expect(s).toContain("role=\"alert\"");
});
