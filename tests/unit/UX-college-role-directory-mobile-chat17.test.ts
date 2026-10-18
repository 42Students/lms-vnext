import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";

describe("UX-UNOWNED-DENSE-GRID-10 college role directory mobile/desktop parity",()=>{
 it("keeps row-level private actions and membership status available without desktop table on phones",()=>{
  const source=readFileSync(join(process.cwd(),
   "src/components/college/college-role-directory-workspace.tsx"),"utf8");
  expect(source).toContain('className="space-y-3 p-3 md:hidden"');
  expect(source).toContain('className="hidden w-full min-w-[45rem] text-left text-sm md:table"');
  expect(source).toContain('<ScrollCue axis="x" label={title + " scrollable results columns"}>');
  expect(source).toContain("View contact card");
  expect(source).toContain("Profile verification");
  expect(source).toContain("StudentClassMoveAction");
  expect(source).toContain("CollegePersonAuditModal");
  expect(source).toContain("CollegeStudentLifecycleAction");
  expect(source).toContain('membershipStatus==="ACTIVE"&&item.userStatus==="ACTIVE"');
  expect(source).toContain('Export includes only current-college role memberships');
  expect(source).toContain('aria-label={title + " mobile records"}');
  expect(source).toContain('aria-label={title + " pagination"}');
 });
});
