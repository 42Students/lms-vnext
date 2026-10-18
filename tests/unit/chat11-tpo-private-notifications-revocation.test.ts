import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";

const collegeId="11111111-1111-4111-8111-111111111111";
const organizationId="22222222-2222-4222-8222-222222222222";
const userId="33333333-3333-4333-8333-333333333333";
const tpo:RequestContext={user:{id:userId,identityUid:"officer",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"44444444-4444-4444-8444-444444444444",
  collegeId,organizationId,status:"ACTIVE",roles:["TPO"]}};
describe("TPO-settings-audit-NOTIFY-READ-05 private inbox data after role revocation",()=>{
 it("denies revoked TPO and inactive membership even if the college selected before the request was correct",()=>{
  expect(hasMembershipRole(tpo,"TPO")).toBe(true);
  expect(()=>requirePermission(tpo,"placements.manage",{collegeId,organizationId})).not.toThrow();
  const revoked:RequestContext={...tpo,membership:{...tpo.membership!,roles:["LEARNER"]}};
  const disabled:RequestContext={...tpo,user:{...tpo.user,platformStatus:"DISABLED"}};
  const suspended:RequestContext={...tpo,membership:{...tpo.membership!,status:"SUSPENDED"}};
  for(const actor of [revoked,disabled,suspended]){
   expect(hasMembershipRole(actor,"TPO")).toBe(false);
   expect(()=>requirePermission(actor,"placements.manage",{collegeId,organizationId}))
    .toThrow(AuthorizationError);
  }
 });
 it("revalidates persisted TPO role after private notification and preference reads",()=>{
  const source=readFileSync("src/modules/placements/tpo-my-notifications-service.ts","utf8");
  const counts=source.indexOf("] = await Promise.all([");
  const preference=source.indexOf("persistedPreferences = preference?");
  const transaction=source.indexOf("await db.transaction(async tx=>",preference);
  const live=source.indexOf('assertPersistedPlatformPermission(tx,context,"placements.manage"',transaction);
  const membership=source.indexOf('hasMembershipRole(persisted,"TPO")',live);
  const result=source.indexOf("return {\n    query,\n    collegeId,",membership);
  expect(counts).toBeGreaterThan(0);
  expect(preference).toBeGreaterThan(counts);
  expect(transaction).toBeGreaterThan(preference);
  expect(live).toBeGreaterThan(transaction);
  expect(membership).toBeGreaterThan(live);
  expect(result).toBeGreaterThan(membership);
  expect(source.slice(live,result)).toContain("collegeId,organizationId");
  expect(source).toContain("eq(inAppNotifications.userId, userId)");
  expect(source).toContain("eq(activityEvents.collegeId, collegeId)");
  expect(source).toContain("eq(activityEvents.organizationId, organizationId)");
  expect(source).not.toContain("inAppNotifications.body");
 });
});
