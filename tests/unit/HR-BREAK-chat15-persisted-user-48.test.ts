import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {can} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";

const actor="123e4567-e89b-42d3-a456-426614174001";
const college="123e4567-e89b-42d3-a456-426614174002";
const relationship="123e4567-e89b-42d3-a456-426614174003";
const context:RequestContext={
 user:{id:actor,identityUid:"recruiter-actor-48",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:actor,companyId:"123e4567-e89b-42d3-a456-426614174004",
  companyName:"Employer",title:null,status:"ACTIVE",
  grants:[{id:"123e4567-e89b-42d3-a456-426614174005",organizationId:"123e4567-e89b-42d3-a456-426614174006",
   collegeId:college,collegeName:"College",companyRelationshipId:relationship}]},
};

describe("HR-ACTOR-STATUS-48 persisted disabled recruiter cannot reuse an earlier session",()=>{
 it("rejects inactivated or wrong-session actors for all recruiter permissions",()=>{
  expect(can(context,"placements.recruiter.read",{collegeId:college,placementCompanyRelationshipId:relationship})).toBe(true);
  const disabled={...context,user:{...context.user,platformStatus:"DISABLED" as const}};
  const switched={...context,recruiter:{...context.recruiter!,userId:"123e4567-e89b-42d3-a456-426614174099"}};
  for(const permission of [
   "placements.recruiter.read","placements.recruiter.round.manage",
   "placements.recruiter.slot.manage","placements.recruiter.result.stage",
  ] as const){
   expect(can(disabled,permission,{collegeId:college,placementCompanyRelationshipId:relationship})).toBe(false);
   expect(can(switched,permission,{collegeId:college,placementCompanyRelationshipId:relationship})).toBe(false);
  }
 });
 it("all job, candidate, round, slot read/write SQL scopes recheck persisted users after session issue",()=>{
  const checks=[
   ["src/modules/placements/recruiter-service.ts",1],
   ["src/modules/placements/recruiter-workspace-service.ts",1],
   ["src/modules/placements/hr-round-editor-service.ts",2],
   ["src/modules/placements/hr-interview-slot-service.ts",1],
  ] as const;
  for(const [path,n] of checks){
   const source=readFileSync(path,"utf8");
   expect(source.split('eq(users.id,context.user.id)').length-1).toBeGreaterThanOrEqual(n);
   expect(source.split('eq(users.platformStatus,"ACTIVE")').length-1).toBeGreaterThanOrEqual(n);
  }
 });
});
