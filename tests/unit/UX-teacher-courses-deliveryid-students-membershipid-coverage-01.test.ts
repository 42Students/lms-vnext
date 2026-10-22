import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-courses-deliveryid-students-membershipid-01 /teacher/courses/[deliveryId]/students/[membershipId] keeps page scope and true states",()=>{
const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/page.tsx"),"utf8");
expect(s).toContain("getCurrentRequestContext");
expect(s).toContain("<EmptyState title=\"No scheduled sessions\"");
expect(s).toContain('aria-label="Student Details"');
expect(s).toContain("<DataTable caption=\"Session history\" rows={data.sessions} getRowKey={row=");
});
