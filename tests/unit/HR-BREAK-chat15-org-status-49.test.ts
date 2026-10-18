import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {can} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";

const actor="123e4567-e89b-42d3-a456-426614174001";
const college="123e4567-e89b-42d3-a456-426614174002";
const relationship="123e4567-e89b-42d3-a456-426614174003";
const organization="123e4567-e89b-42d3-a456-426614174004";
const ctx:RequestContext={
 user:{id:actor,identityUid:"hr-org-49",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:actor,companyId:"123e4567-e89b-42d3-a456-426614174005",
  companyName:"Employer",title:null,status:"ACTIVE",
  grants:[{id:"123e4567-e89b-42d3-a456-426614174006",organizationId:organization,
   collegeId:college,collegeName:"Campus",companyRelationshipId:relationship}]},
};
describe("HR-ORG-STATUS-49 stale recruiter grants do not bypass suspended organization",()=>{
 it("cached central recruiter permission is not a substitute for live parent-organization SQL",()=>{
  expect(can(ctx,"placements.recruiter.read",{collegeId:college,placementCompanyRelationshipId:relationship}))
   .toBe(true);
  const revoked={...ctx,user:{...ctx.user,platformStatus:"DISABLED" as const}};
  expect(can(revoked,"placements.recruiter.read",{collegeId:college,placementCompanyRelationshipId:relationship}))
   .toBe(false);
 });
 it("all six private HR database scopes require organizations.status ACTIVE",()=>{
  const paths=[
   ["src/modules/placements/recruiter-service.ts",1],
   ["src/modules/placements/recruiter-workspace-service.ts",1],
   ["src/modules/placements/hr-round-editor-service.ts",2],
   ["src/modules/placements/hr-interview-slot-service.ts",1],
   ["src/modules/placements/recruiter-company-team-service.ts",1],
   ["src/modules/placements/recruiter-portfolio-counts-service.ts",2],
  ] as const;
  for(const [path,number] of paths){
   const source=readFileSync(path,"utf8");
   expect(source.split('eq(organizations.status,"ACTIVE")').length-1)
    .toBeGreaterThanOrEqual(number);
   expect(source).toContain("eq(organizations.id,colleges.organizationId)");
   expect(source).toContain("eq(colleges.status");
  }
 });
});
