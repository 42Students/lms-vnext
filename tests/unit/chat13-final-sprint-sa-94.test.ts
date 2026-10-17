import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
it("SA-academics-people-94 exposes edit student from the Students roster and scoped profile mutation",()=>{
 const page=readFileSync("src/app/(authenticated)/admin/students/page.tsx","utf8");
 const action=readFileSync("src/components/college/college-person-edit-action.tsx","utf8");
 const service=readFileSync("src/modules/people/college-directory-person-editor-service.ts","utf8");
 expect(page).toContain('kind="LEARNER"');
 expect(page).toContain("CollegePersonEditAction");
 expect(page).toContain("<StudentClassMoveAction");
 const move=readFileSync("src/modules/academics/college-student-section-move-service.ts","utf8");
 expect(move).toContain('resolveActingCollege(context,"academics.manage")');
 expect(move).toContain("await ownAdmin(context)");
 expect(move).toContain("expectedSectionEnrollmentId");
 expect(move).toContain("recordActivityEventInTransaction(tx, context");
 expect(action).toContain("Edit Student");
 expect(action).toContain("method:\"PATCH\"");
 expect(service).toContain("resolveActingCollege(context,\"people.manage\")");
 expect(service).toContain("eq(collegeMemberships.collegeId,own.collegeId)");
});