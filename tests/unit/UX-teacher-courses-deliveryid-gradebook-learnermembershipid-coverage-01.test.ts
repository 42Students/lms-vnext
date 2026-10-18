import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-courses-deliveryid-gradebook-learnermembershipid-01 /teacher/courses/[deliveryId]/gradebook/[learnerMembershipId] keeps page scope and true states",()=>{
const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/page.tsx"),"utf8");
expect(s).toContain("notFound()");
expect(s).toContain("getCurrentRequestContext");
expect(s).toContain("<EmptyState title=\"No released assessment results\"");
expect(s).toContain("aria-label=\"Recorded score totals\"");
});
