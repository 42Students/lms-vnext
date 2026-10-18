import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-courses-deliveryid-session-coverage-01 /teacher/courses/[deliveryId]/session-coverage keeps page scope and true states",()=>{
const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/page.tsx"),"utf8");
expect(s).toContain("getCurrentRequestContext");
expect(s).toContain("<PageHeader title=\"Attendance session coverage\"");
expect(s).toContain("<EmptyState title=\"No scheduled sessions\"");
expect(s).toContain("role=\"status\"");
});
