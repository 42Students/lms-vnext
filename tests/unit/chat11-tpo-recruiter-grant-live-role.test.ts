import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {tpoRecruiterGrantChangeSchema} from "@/modules/placements/tpo-recruiter-grant-write-model";

const collegeId="11111111-1111-4111-8111-111111111111";
const organizationId="22222222-2222-4222-8222-222222222222";
const memberId="33333333-3333-4333-8333-333333333333";
const actor:RequestContext={
 user:{id:"44444444-4444-4444-8444-444444444444",identityUid:"officer",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:memberId,collegeId,organizationId,status:"ACTIVE",roles:["TPO"]},
};

describe("TPO-settings-audit-GRANT-REVOCATION-09 recruiter access mutations",()=>{
 it("denies disabled and revoked roles even if a college administrator role remains",()=>{
  expect(hasMembershipRole(actor,"TPO")).toBe(true);
  const roleChanged:RequestContext={...actor,membership:{...actor.membership!,roles:["COLLEGE_ADMIN"]}};
  expect(hasMembershipRole(roleChanged,"TPO")).toBe(false);
  expect(can(roleChanged,"placements.manage",{collegeId,organizationId})).toBe(true);
  const disabled:RequestContext={...actor,user:{...actor.user,platformStatus:"DISABLED"}};
  expect(hasMembershipRole(disabled,"TPO")).toBe(false);
  expect(can(actor,"placements.manage",{collegeId:organizationId,organizationId})).toBe(false);
 });
 it("revalidates persisted TPO before first GRANT insert and before extend/revoke lookup",()=>{
  const source=readFileSync("src/modules/placements/tpo-recruiter-grant-write-service.ts","utf8");
  const transaction=source.indexOf("return getDb().transaction(async (tx) => {");
  const persisted=source.indexOf("assertPersistedPlatformPermission(",transaction);
  const role=source.indexOf('hasMembershipRole(persisted, "TPO")',persisted);
  const grant=source.indexOf('if (input.action === "GRANT")',role);
  const firstWrite=source.indexOf("tx.insert(placementTpoCollegeSettings)",grant);
  const lookup=source.indexOf("const [record] = await tx.select(",firstWrite);
  const revoke=source.indexOf(".set({\n      status: \"REVOKED\"",lookup);
  expect(transaction).toBeGreaterThan(0);
  expect(persisted).toBeGreaterThan(transaction);
  expect(role).toBeGreaterThan(persisted);
  expect(grant).toBeGreaterThan(role);
  expect(firstWrite).toBeGreaterThan(grant);
  expect(lookup).toBeGreaterThan(firstWrite);
  expect(revoke).toBeGreaterThan(lookup);
  expect(source.slice(persisted,role)).toContain("collegeId, organizationId: college.organizationId");
 });
 it("never accepts a caller-chosen actor college or an unrecognized grant mutation",()=>{
  expect(tpoRecruiterGrantChangeSchema.safeParse({action:"DROP_ALL"}).success).toBe(false);
  for(const raw of [
   {action:"REVOKE",grantId:memberId,collegeId},
   {action:"EXTEND",grantId:memberId,months:-1,expectedUpdatedAt:"yesterday"},
  ])expect(tpoRecruiterGrantChangeSchema.safeParse(raw).success).toBe(false);
 });
});
