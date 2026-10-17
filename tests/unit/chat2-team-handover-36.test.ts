import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const source=(p:string)=>readFileSync(p,"utf8");
const service=source("src/modules/placements/tpo-team-handover-service.ts");
const route=source("src/app/api/placements/tpo/team/handover/route.ts");
const ui=source("src/components/tpo/tpo-team-handover.tsx");
const page=source("src/app/(authenticated)/tpo/team/page.tsx");
describe("Scoped Team ownership handover",()=>{
 it("TPO-inbox-team-36 blocks self-removal and verifies both active same-college memberships with placement roles",()=>{
  expect(service).toContain("if(input.sourceMembershipId===actor.id)");
  expect(service).toContain('eq(collegeMemberships.collegeId,college.id)');
  expect(service).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(service).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(service).toContain('inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])');
  expect(service).toContain("assertPersistedPlatformPermission");
  expect(service).toContain("hasDriveOwnerColumn");
 });
 it("TPO-inbox-team-36 transfers only owned college work atomically and keeps roles/asks unchanged",()=>{
  for(const sourceTable of ["placementJobs","placementCompanyRelationships","placementTpoLeads","placementTpoFollowups"]){
   expect(service).toContain('tx.update('+sourceTable+')');
   expect(service).toContain('eq('+sourceTable+'.collegeId,college.id)');
   expect(service).toContain('eq('+sourceTable+'.ownerMembershipId,input.sourceMembershipId)');
  }
  expect(service).toContain('eventType:"placements.tpo_team.work_handed_over"');
  expect(service).toContain("roleRevoked:false");
  expect(service).not.toContain("tx.delete(membershipRoles)");
  expect(service).not.toContain("tx.update(placementTpoTeamAsks)");
  expect(service).toContain("tx.insert(inAppNotifications)");
 });
 it("TPO-inbox-team-36 exposes guarded handover from People, not an unguarded role-revocation button",()=>{
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("tpoTeamHandoverSchema.safeParse");
  expect(ui).toContain("Who takes over?");
  expect(ui).toContain("window.confirm");
  expect(ui).toContain("This does not remove team access or transfer private asks.");
  expect(ui).toContain("timeoutMs:12000");
  expect(page).toContain("<TpoTeamHandover");
 });
});