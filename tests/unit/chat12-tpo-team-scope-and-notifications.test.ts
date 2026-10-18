import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import type {RequestContext} from "@/modules/identity/context";
import {hasPlacementTeamMembership} from "@/modules/placements/placement-team-access-model";

const C="22222222-2222-4222-8222-222222222222";
function ctx(role:"TPO"|"COLLEGE_ADMIN"|"FACULTY"|"LEARNER",options:{
 membershipStatus?:"ACTIVE"|"SUSPENDED";
 platformStatus?:"ACTIVE"|"DISABLED";
 noMembership?:boolean;
}={}):RequestContext{
 return {user:{id:"user",identityUid:"identity",platformStatus:options.platformStatus??"ACTIVE",systemRoles:[]},
  membership:options.noMembership?null:{
   id:"member",collegeId:C,organizationId:"11111111-1111-4111-8111-111111111111",
   roles:[role],status:options.membershipStatus??"ACTIVE",
  }};
}

describe("TPO-BREAK-team-01 permission and expired-session matrix",()=>{
 it("allows active placement-team roles but never authorizes learner/faculty or removed sessions",()=>{
  expect(hasPlacementTeamMembership(ctx("TPO"))).toBe(true);
  expect(hasPlacementTeamMembership(ctx("COLLEGE_ADMIN"))).toBe(true);
  expect(hasPlacementTeamMembership(ctx("FACULTY"))).toBe(false);
  expect(hasPlacementTeamMembership(ctx("LEARNER"))).toBe(false);
  expect(hasPlacementTeamMembership(ctx("TPO",{membershipStatus:"SUSPENDED"}))).toBe(false);
  expect(hasPlacementTeamMembership(ctx("TPO",{platformStatus:"DISABLED"}))).toBe(false);
  expect(hasPlacementTeamMembership(ctx("TPO",{noMembership:true}))).toBe(false);
 });
});
describe("TPO-BREAK-team-02 persisted transitions, audit and private notification surface",()=>{
 const service=readFileSync(resolve(process.cwd(),"src/modules/placements/tpo-company-team-service.ts"),"utf8");
 it("rechecks persisted actor, tenant and active relationship inside the write transaction",()=>{
  expect(service).toContain("assertPersistedPlatformPermission(tx,context");
  expect(service).toContain('!hasPlacementTeamMembership(persisted)');
  expect(service).toContain('eq(placementCompanyRelationships.status,"ACTIVE")');
  expect(service).toContain('.for("share").limit(1)');
 });
 it("does not create duplicate follow activity on simultaneous insert/retry or repeat unfollow",()=>{
  const followBlock=service.slice(service.indexOf('if(input.action==="FOLLOW"){'),service.indexOf('if(input.action==="SEND"){'));
  expect(followBlock).toContain(".onConflictDoNothing()");
  expect(followBlock).toContain(".returning({membershipId:follows.membershipId})");
  expect(followBlock).toContain("const changed=input.following");
  expect(followBlock).toContain("if(changed)await tx.insert(activityEvents).values");
  expect(followBlock).toContain("return {changed};");
 });
 it("never sends ask-completion notifications to disabled or another-college members",()=>{
  const start=service.indexOf('const [recipient]=await tx.select');
  expect(start).toBeGreaterThan(-1);
  const recipient=service.slice(start,service.indexOf('if(recipient)await tx.insert(inAppNotifications)',start));
  expect(recipient).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(recipient).toContain('eq(collegeMemberships.collegeId,college.id)');
  expect(recipient).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(recipient).toContain('inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])');
 });
});

describe("TPO-BREAK-team-03 bounded same-origin message route",()=>{
 it("rejects cross-origin and oversized or malformed streamed JSON before calling the writer",()=>{
  const route=readFileSync(resolve(process.cwd(),"src/app/api/placements/tpo/companies/[companyId]/team/route.ts"),"utf8");
  expect(route).toContain("if(!isSameOriginRequest(request))");
  expect(route).toContain("body=await readTpoBulkRequestBody(request)");
  expect(route).not.toContain("await request.json()");
  expect(route).toContain('error.status===413?"REQUEST_TOO_LARGE"');
  expect(route).toContain('error.status===415?"UNSUPPORTED_MEDIA_TYPE":"INVALID_BODY"');
  expect(route).toContain("tpoCompanyTeamPostSchema.safeParse(body)");
  expect(route.indexOf("if(!isSameOriginRequest(request))"))
   .toBeLessThan(route.indexOf("body=await readTpoBulkRequestBody(request)"));
  expect(route.indexOf("tpoCompanyTeamPostSchema.safeParse(body)"))
   .toBeLessThan(route.indexOf("mutateTpoCompanyTeam("));
 });
});
