import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const src=(path:string)=>readFileSync(path,"utf8");

describe("chat-17 Verify2 team impact and legacy recruiter calendar",()=>{
 it("requires an authorized, live ownership preview and rechecks removal inside the transaction",()=>{
  const code=src("src/modules/placements/tpo-settings-team-actions-service.ts");
  expect(code).toContain("readTpoTeamRemovalImpact");
  expect(code).toContain("if(!await hasDriveOwnerColumn())");
  expect(code).toContain('assertPersistedPlatformPermission(tx,context,"placements.manage"');
  for(const field of ["placementJobs.ownerMembershipId","placementCompanyRelationships.ownerMembershipId",
    "placementTpoLeads.ownerMembershipId","placementTpoFollowups.ownerMembershipId"]){
   expect(code).toContain(field);
  }
  expect(code).toContain('.for("update").limit(1)');
  expect(code).toContain("const impact=await teamRemovalImpact(tx,actor.collegeId,membershipId)");
  expect(code).toContain('throw new Error("TEAM_MEMBER_OWNS_WORK")');
  expect(code).toContain("tx.delete(placementTpoTeamMembers)");
 });
 it("blocks removal in the UI until the legacy-style impact preview succeeds",()=>{
  const ui=src("src/components/tpo/tpo-settings-team-manage.tsx");
  expect(ui).toContain("async function reviewRemoval()");
  expect(ui).toContain("Could not verify what this team member owns. Retry before removing them.");
  expect(ui).toContain("disabled={busy||checking||!impact||ownedWork>0}");
  expect(ui).toContain("Hand over and remove");
  const route=src("src/app/api/placements/tpo/settings/team/route.ts");
  expect(route).toContain("readTpoTeamRemovalImpact");
  expect(route).toContain("status:409");
  const handover=src("src/modules/placements/tpo-team-handover-service.ts");
  expect(handover).toContain("placementTpoTeamMembers");
  expect(handover).toContain("permanent.has(input.targetMembershipId)");
 });
 it("keeps the original event-only agenda as default while weekly and monthly views remain opt-in",()=>{
  const page=src("src/app/(authenticated)/hr/calendar/page.tsx");
  expect(page).toContain(') ?? "agenda";');
  expect(page).toContain('const VIEWS: readonly PlacementCalendarView[] = [');
  expect(page).toContain('"week",');
  expect(page).toContain('"month",');
  expect(page).toContain('{allDays.map((day)');
  expect(page).toContain('.filter(day => day.events.length > 0 || day.resultsDue.length > 0)');
 });
});
