import {describe,expect,it} from "vitest";
import {hasPlacementTeamMembership} from "@/modules/placements/placement-team-access-model";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");
const membership={id:"m",collegeId:"c",organizationId:"o",status:"ACTIVE" as const,
 roles:["COLLEGE_ADMIN" as const]};
const admin={user:{id:"u",identityUid:"a",platformStatus:"ACTIVE" as const,systemRoles:[]},membership};
describe("College placement team access",()=>{
 it("TPO-inbox-team-38 allows active college admins but not learners or inactive memberships",()=>{
  expect(hasPlacementTeamMembership(admin)).toBe(true);
  expect(hasPlacementTeamMembership({...admin,membership:{...membership,roles:["LEARNER" as const]}})).toBe(false);
  expect(hasPlacementTeamMembership({...admin,membership:{...membership,status:"SUSPENDED" as const}})).toBe(false);
 });
 it("TPO-inbox-team-37 lists college administrators in the Team People roster",()=>{
  const roster=src("src/modules/placements/tpo-settings-people-service.ts");
  const model=src("src/modules/placements/tpo-settings-read-model.ts");
  expect(roster).toContain('inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])');
  expect(model).toContain('COLLEGE_ADMIN:"College Admin"');
  const page=src("src/app/(authenticated)/tpo/team/page.tsx");
  expect(page).toContain('member.roles.includes("COLLEGE_ADMIN")');
 });
 it("TPO-inbox-team-R02 includes admins at the Team entrypoint and private thread detail",()=>{
  for(const path of ["src/app/(authenticated)/tpo/team/page.tsx",
   "src/app/(authenticated)/tpo/team/[threadId]/page.tsx"])
   expect(src(path)).toContain("hasPlacementTeamMembership(context)");
  const svc=src("src/modules/placements/tpo-settings-people-service.ts");
  expect(svc).toContain("requirePlacementManageScope(context, collegeId)");
 });
});
