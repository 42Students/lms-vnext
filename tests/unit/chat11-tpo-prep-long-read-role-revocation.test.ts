import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {validateTpoPrepLearnerPairs} from "@/modules/placements/tpo-prep-learner-scope-model";

const collegeId="11111111-1111-4111-8111-111111111111";
const organizationId="22222222-2222-4222-8222-222222222222";
const actor:RequestContext={
 user:{id:"33333333-3333-4333-8333-333333333333",
  identityUid:"officer",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"44444444-4444-4444-8444-444444444444",
  collegeId,organizationId,status:"ACTIVE",roles:["TPO"]},
};
describe("TPO-settings-audit-PREP-ROLE-12 learner course-progress privacy",()=>{
 it("rejects non-TPO identities and wrong tenant while preserving College Admin's intended role",()=>{
  expect(can(actor,"placements.manage",{collegeId,organizationId})).toBe(true);
  const demoted:RequestContext={...actor,membership:{...actor.membership!,roles:["LEARNER"]}};
  const disabled:RequestContext={...actor,user:{...actor.user,platformStatus:"DISABLED"}};
  const collegeAdmin:RequestContext={...actor,membership:{...actor.membership!,roles:["COLLEGE_ADMIN"]}};
  expect(can(demoted,"placements.manage",{collegeId,organizationId})).toBe(false);
  expect(can(disabled,"placements.manage",{collegeId,organizationId})).toBe(false);
  expect(can(collegeAdmin,"placements.manage",{collegeId,organizationId})).toBe(true);
  expect(can(actor,"placements.manage",{collegeId:organizationId,organizationId})).toBe(false);
 });
 it("bounds the learner cohort ID pair list before consulting persisted learner content",()=>{
  const id="55555555-5555-4555-8555-555555555555";
  expect(validateTpoPrepLearnerPairs([{membershipId:id,cohortId:collegeId}])).not.toBeNull();
  expect(validateTpoPrepLearnerPairs([
   {membershipId:id,cohortId:collegeId},{membershipId:id,cohortId:collegeId},
  ])).toBeNull();
  expect(validateTpoPrepLearnerPairs(Array.from({length:5001},(_,i)=>({
   membershipId:String(i),cohortId:collegeId,
  })))).toBeNull();
 });
 it("revalidates persisted permissions after course progress joins for READY, UNCONFIGURED and UNAVAILABLE",()=>{
  const source=readFileSync("src/modules/placements/tpo-prep-readiness-derived-service.ts","utf8");
  const preflight=source.indexOf("await requireTpoBatchActor(context)");
  const helper=source.indexOf("const deliver=async(available:boolean)");
  const tx=source.indexOf("db.transaction(async tx=>",helper);
  const lock=source.indexOf('.for("share").limit(1)',tx);
  const active=source.indexOf('college.status!=="ACTIVE"',lock);
  const persisted=source.indexOf('assertPersistedPlatformPermission(tx,context,"placements.manage"',active);
  const projection=source.indexOf("return {available,outcomes};",persisted);
  const roster=source.indexOf("const enrolled=await db.select({",projection);
  const progress=source.indexOf("const rows=await db.select({membershipId:learnerContentProgress.membershipId",roster);
  const finished=source.lastIndexOf("return deliver(true);");
  expect(preflight).toBeGreaterThan(0);
  expect(helper).toBeGreaterThan(preflight);
  expect(tx).toBeGreaterThan(helper);
  expect(lock).toBeGreaterThan(tx);
  expect(active).toBeGreaterThan(lock);
  expect(persisted).toBeGreaterThan(active);
  expect(projection).toBeGreaterThan(persisted);
  expect(roster).toBeGreaterThan(projection);
  expect(progress).toBeGreaterThan(roster);
  expect(finished).toBeGreaterThan(progress);
  expect(source).toContain("if(!stored.ready||stored.selectionSynchronized===false||!communication.ready||!config.success)return deliver(false)");
  expect(source).toContain("if(contents.length>5000)return deliver(false)");
  expect(source).toContain("return deliver(true)");
  expect(source).not.toContain("return {available:false,outcomes}");
 });
});
