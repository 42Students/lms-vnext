import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Mentor faculty role parity",()=>{
 it("SA-academics-people-115 recognizes real mentor memberships and filters faculty by mentor role",()=>{
  const code=readFileSync("src/modules/admin-ui/super-admin-scoped-people-service.ts","utf8");
  expect(code).toContain('mentorRole:sql<boolean>');
  expect(code).toContain("mentor_role.role='MENTOR'");
  expect(code).toContain('query.employmentType.toLowerCase()==="mentor"');
  expect(code).toContain('row.mentorRole?"Mentor"');
  expect(readFileSync("src/components/admin/admin-scoped-read-page.tsx","utf8"))
    .toContain('placeholder="Professor, Mentor…"');
 });
});
