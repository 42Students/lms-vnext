import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";

describe("UX-UNOWNED-DENSE-GRID-10 college role directory mobile/desktop parity",()=>{
 it("keeps row-level private actions and membership status available without desktop table on phones",()=>{
  const source=readFileSync(join(process.cwd(),
   "src/components/college/college-role-directory-workspace.tsx"),"utf8");
  expect(source).toContain('aria-label={title + " mobile records"}');
  expect(source).toContain('className="space-y-2 md:hidden"');
  expect(source).toContain("<StatusBadge");
  expect(source).toContain('className="hidden md:block"');
  expect(source).toContain("<DataTable");
  const sharedTable=readFileSync(join(process.cwd(),"src/components/ui/data-table.tsx"),"utf8");
  expect(sharedTable).toContain('<ScrollCue axis="x"');
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
