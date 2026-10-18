import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {evaluateCollegeReadiness,type CollegeReadinessFacts} from "@/modules/colleges/readiness-model";
import {summarizeTenantSetupReadiness} from "@/modules/colleges/admin-tenant-setup-status";

const organizationId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const actor:RequestContext={user:{id:"33333333-3333-4333-8333-333333333333",
 identityUid:"root",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{organizationId,collegeId}};
const facts:CollegeReadinessFacts={
 collegeStatus:"ACTIVE",adminMemberships:1,departments:1,programs:1,cohorts:1,
 enrolledLearners:1,facultyMemberships:1,tpoMemberships:1,
 activePlacementSeasons:1,verifiedPrimaryDomains:1,
};
describe("SA-tenants-modules-READY-03 tenant readiness security",()=>{
 it("denies revoked, disabled and wrong-college Super Admin snapshots",()=>{
  expect(can(actor,"college.read",{organizationId,collegeId})).toBe(true);
  const disabled:RequestContext={...actor,user:{...actor.user,platformStatus:"DISABLED"}};
  const revoked:RequestContext={...actor,user:{...actor.user,systemRoles:[]}};
  expect(can(disabled,"college.read",{organizationId,collegeId})).toBe(false);
  expect(can(revoked,"college.read",{organizationId,collegeId})).toBe(false);
  expect(can(actor,"college.read",{organizationId,collegeId:organizationId})).toBe(false);
  expect(can(actor,"college.read",{organizationId:collegeId,collegeId})).toBe(false);
 });
 it("rechecks persisted permission after count queries but before returning tenant evidence",()=>{
  const service=readFileSync("src/modules/colleges/readiness-service.ts","utf8");
  const count=service.indexOf("] = await Promise.all([");
  const facts=service.indexOf("const facts: CollegeReadinessFacts");
  const tx=service.indexOf("await db.transaction(async tx=>",facts);
  const guard=service.indexOf('assertPersistedPlatformPermission(tx,context,"college.read"',tx);
  const result=service.indexOf("return {\n    college,\n    evaluation:",guard);
  expect(count).toBeGreaterThan(0);
  expect(facts).toBeGreaterThan(count);
  expect(tx).toBeGreaterThan(facts);
  expect(guard).toBeGreaterThan(tx);
  expect(result).toBeGreaterThan(guard);
  expect(service.slice(guard,result)).toContain("collegeId:college.id,organizationId:college.organizationId");
  expect(service).toContain("requirePermission(context, \"college.read\"");
 });
 it("never interprets an unknown domain or missing source as production readiness",()=>{
  const unknown=evaluateCollegeReadiness({...facts,verifiedPrimaryDomains:null});
  expect(unknown.overall).toBe("INCOMPLETE");
  expect(summarizeTenantSetupReadiness(unknown).label).toBe("Incomplete evidence");
  const failed=evaluateCollegeReadiness({...facts,tpoMemberships:0});
  expect(failed.overall).toBe("NOT_READY");
  expect(summarizeTenantSetupReadiness(failed).label).toBe("Not ready");
 });
});
