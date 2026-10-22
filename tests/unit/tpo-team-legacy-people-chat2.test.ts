import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const src=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("TPO People roster legacy copy",()=>{
 it("TPO-inbox-team-37 stops representing historical drive-day coordinators as permanent team members",()=>{
  const page=src("src/app/(authenticated)/tpo/settings/team/page.tsx");
  expect(page).toContain("TPO_TEAM_ROLE_LABELS[role]");
  expect(page).toContain('hasMembershipRole(context, "TPO")');
  expect(page).toContain("summary.tpoMemberships");
  expect(page).toContain("Only active college memberships");
  expect(page).toContain("String(summary.total)");
 });
 it("TPO-inbox-team-32 keeps the number of displayed team members consistent with the filtered roster",()=>{
  const page=src("src/app/(authenticated)/tpo/settings/team/page.tsx");
  const legacy=src("src/app/(authenticated)/tpo/team/page.tsx");
  expect(legacy).toContain('if (tab === "people" || tab === "members" || tab === "roster")');
  expect(legacy).toContain('redirect("/tpo/settings/team")');
  expect(page).toContain("rows={sortedMembers}");
  expect(page).toContain("sortedMembers=sortTpoPeople(members.map");
  expect(page).toContain("getRowKey={member=>member.membershipId}");
  expect(page).toContain("String(summary.total)");
  expect(page).toContain('caption="Active team memberships"');
 });
});
