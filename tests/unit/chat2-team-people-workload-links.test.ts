import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=(p:string)=>readFileSync(p,"utf8");
describe("Team People persisted workload destinations",()=>{
 it("TPO-inbox-team-31 keeps historical team bookmarks in scoped canonical workspaces",()=>{
  const shim=source("src/app/(authenticated)/tpo/team/page.tsx");
  const people=source("src/app/(authenticated)/tpo/settings/team/page.tsx");
  const conversations=source("src/app/(authenticated)/tpo/messages/page.tsx");
  expect(shim).toContain("hasPlacementTeamMembership(context)");
  expect(shim).toContain('redirect("/tpo/settings/team")');
  expect(shim).toContain('redirect("/tpo/messages?" + target.toString())');
  expect(shim).toContain('redirect("/tpo/requests")');
  expect(people).toContain("getTpoPlacementTeam(context,context.membership.collegeId)");
  expect(people).toContain("TpoSettingsTeamManage");
  expect(conversations).toContain("getTpoMessagesInbox");
  expect(conversations).toContain("TpoTeamMessagesDirectory");
 });
});
