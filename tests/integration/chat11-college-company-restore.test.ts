import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {
 archivePlacementCompanyRelationship,createPlacementCompany,
 restorePlacementCompanyRelationship,
} from "@/modules/placements/company-service";
import {listCollegeCompanyDirectory} from "@/modules/placements/college-company-directory-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=Boolean(process.env.TEST_DATABASE_URL)&&
 process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL}):null;
const collegeAdmin:RequestContext={
 user:{id:SEED_IDS.collegeAdminUser,identityUid:"chat11-college-company",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const companyIds:string[]=[],relationshipIds:string[]=[];
afterAll(async()=>{
 try{
  for(const id of relationshipIds)await pool?.query("DELETE FROM placement_company_relationships WHERE id=$1",[id]);
  for(const id of companyIds)await pool?.query("DELETE FROM placement_companies WHERE id=$1",[id]);
 }finally{await pool?.end();await closeDatabaseConnection();}
});
describe.skipIf(!enabled)("College archived company recovery PostgreSQL",()=>{
 it("COL-placements-15 preserves tenant-scoped archive history and restores only one relationship",async()=>{
  const suffix=randomUUID().slice(0,8);
  const created=await createPlacementCompany(collegeAdmin,{
   collegeId:SEED_IDS.collegeA,name:"Recovery Candidate "+suffix,
   primaryDomain:"recover-"+suffix+".example",
  });
  companyIds.push(created.company.id);relationshipIds.push(created.relationship.id);
  const archived=await archivePlacementCompanyRelationship(collegeAdmin,created.relationship.id);
  expect(archived.relationship.status).toBe("ARCHIVED");
  const archivedPage=await listCollegeCompanyDirectory(collegeAdmin,{q:suffix,page:1,showDeleted:"1"});
  expect(archivedPage.items.map(x=>x.relationshipId)).toContain(created.relationship.id);
  const learner:RequestContext={
   user:{id:SEED_IDS.learnerUser,identityUid:"chat11-learner",platformStatus:"ACTIVE",systemRoles:[]},
   membership:{id:SEED_IDS.learnerCollegeAMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]},
  };
  await expect(restorePlacementCompanyRelationship(learner,created.relationship.id))
   .rejects.toBeInstanceOf(AuthorizationError);
  const foreignScopedAdmin:RequestContext={
   user:{...collegeAdmin.user,id:SEED_IDS.superAdminUser,systemRoles:["SUPER_ADMIN"]},
   membership:null,
   adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB},
  };
  await expect(restorePlacementCompanyRelationship(foreignScopedAdmin,created.relationship.id))
   .rejects.toBeInstanceOf(AuthorizationError);
  const restored=await restorePlacementCompanyRelationship(collegeAdmin,created.relationship.id);
  expect(restored.relationship.status).toBe("ACTIVE");
  expect(restored.relationship.archivedAt).toBeNull();
  const after=await listCollegeCompanyDirectory(collegeAdmin,{q:suffix,page:1,showDeleted:"0"});
  expect(after.items.map(x=>x.relationshipId)).toContain(created.relationship.id);
  const stillArchived=await listCollegeCompanyDirectory(collegeAdmin,{q:suffix,page:1,showDeleted:"1"});
  expect(stillArchived.items.find(x=>x.relationshipId===created.relationship.id)?.relationshipStatus).toBe("ACTIVE");
 });
 it("COL-placements-15 never resurrects an archived platform company",async()=>{
  const suffix=randomUUID().slice(0,8);
  const created=await createPlacementCompany(collegeAdmin,{
   collegeId:SEED_IDS.collegeA,name:"Dormant Candidate "+suffix,
   primaryDomain:"dormant-"+suffix+".example",
  });
  companyIds.push(created.company.id);relationshipIds.push(created.relationship.id);
  await archivePlacementCompanyRelationship(collegeAdmin,created.relationship.id);
  await pool!.query("UPDATE placement_companies SET status='ARCHIVED' WHERE id=$1",[created.company.id]);
  await expect(restorePlacementCompanyRelationship(collegeAdmin,created.relationship.id))
   .rejects.toMatchObject({code:"PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND"});
  const persisted=await pool!.query("SELECT status,archived_at FROM placement_company_relationships WHERE id=$1",[created.relationship.id]);
  expect(persisted.rows[0]?.status).toBe("ARCHIVED");
  expect(persisted.rows[0]?.archived_at).not.toBeNull();
 });

});
