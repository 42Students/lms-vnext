import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const src=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("TPO People roster legacy copy",()=>{
 it("TPO-inbox-team-37 stops representing historical drive-day coordinators as permanent team members",()=>{
  const page=src("src/app/(authenticated)/tpo/team/page.tsx");
  expect(page).toContain('member.roles.includes("TPO_ADMIN")');
  expect(page).toContain('member.roles.includes("TPO")');
  expect(page).toContain('role==="TPO"||role==="TPO_ADMIN"');
  expect(page).toContain("Everyone in it can do everything in placements.");
  expect(page).toContain("{people.length} people");
 });
 it("TPO-inbox-team-32 keeps the number of displayed team members consistent with the filtered roster",()=>{
  const page=src("src/app/(authenticated)/tpo/team/page.tsx");
  expect(page).toContain("sortTpoPeople(activeTeam,peopleSort)");
  expect(page).toContain('role="status" className="text-sm text-body">{people.length} people');
  expect(page).toContain('aria-label="Sort team people"');
 });
});
