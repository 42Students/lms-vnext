import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
it("SA-academics-people-94 exposes edit student from the Students roster and scoped profile mutation",()=>{
 const page=readFileSync("src/app/(authenticated)/admin/students/page.tsx","utf8");
 const action=readFileSync("src/components/college/college-person-edit-action.tsx","utf8");
 const service=readFileSync("src/modules/people/college-directory-person-editor-service.ts","utf8");
 expect(page).toContain('kind="LEARNER"');
 expect(page).toContain("CollegePersonEditAction");
 expect(action).toContain("Edit Student");
 expect(action).toContain("method:\"PATCH\"");
 expect(service).toContain("resolveActingCollege(context,\"people.manage\")");
 expect(service).toContain("eq(collegeMemberships.collegeId,own.collegeId)");
});