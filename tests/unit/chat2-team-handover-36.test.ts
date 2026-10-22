import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {mayHandoverOwnTeamWork,tpoTeamHandoverSchema} from "@/modules/placements/tpo-team-handover-model";
const source=(p:string)=>readFileSync(p,"utf8");
const service=source("src/modules/placements/tpo-team-handover-service.ts");
const route=source("src/app/api/placements/tpo/team/handover/route.ts");
const ui=source("src/components/tpo/tpo-team-handover.tsx");
const page=source("src/app/(authenticated)/tpo/settings/team/page.tsx");
const legacyRedirect=source("src/app/(authenticated)/tpo/team/page.tsx");
describe("Scoped Team ownership handover",()=>{
 it("TPO-inbox-team-36 rejects self assignment, role mutation payloads and inactive assignees at the pure boundary",()=>{
  const from="11111111-1111-4111-8111-111111111111";
  const to="22222222-2222-4222-8222-222222222222";
  expect(tpoTeamHandoverSchema.safeParse({sourceMembershipId:from,targetMembershipId:to}).success).toBe(true);
  expect(tpoTeamHandoverSchema.safeParse({sourceMembershipId:from,targetMembershipId:from}).success).toBe(false);
  expect(tpoTeamHandoverSchema.safeParse({sourceMembershipId:from,targetMembershipId:to,grantRole:true}).success).toBe(false);
  expect(mayHandoverOwnTeamWork({actorMembershipId:from,sourceMembershipId:from,targetMembershipId:to,sourceActive:true,targetActive:true})).toBe(false);
  expect(mayHandoverOwnTeamWork({actorMembershipId:"33333333-3333-4333-8333-333333333333",sourceMembershipId:from,targetMembershipId:to,sourceActive:true,targetActive:false})).toBe(false);
 });

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
  expect(service).toContain("if(!Object.values(counts).some(count=>count>0))");
  expect(service).toContain("roleRevoked:false as const");
 });
 it("TPO-inbox-team-36 exposes guarded handover from People, not an unguarded role-revocation button",()=>{
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("tpoTeamHandoverSchema.safeParse");
  expect(ui).toContain("Who takes over?");
  expect(ui).toContain("const {askConfirm,dialog}=useConfirmFlow()");
  expect(ui).toContain('await askConfirm("Hand over "');
  expect(ui).toContain("{dialog}");
  expect(ui).toContain("This does not remove team access or transfer private asks.");
  expect(ui).toContain("timeoutMs:12000");
  expect(page).toContain("<TpoTeamHandover");
  expect(page).toContain('member.membershipId!==actorMembershipId');
  expect(legacyRedirect).toContain('redirect("/tpo/settings?tab=team")');
  expect(legacyRedirect).toContain('tab === "people" || tab === "members" || tab === "roster"');
 });
});