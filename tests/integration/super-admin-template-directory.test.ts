import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {createProjectTemplate,publishProjectTemplate,assignProjectTemplateToCollege} from "@/modules/projects/template-service";
import {listSuperAdminTemplateDirectory} from "@/modules/projects/super-admin-template-directory-service";
import {AuthorizationError} from "@/modules/permissions/policy";
import {SEED_IDS} from "../../scripts/db-seed-data";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
const admin:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"template-directory-admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null};
describe.skipIf(!enabled)("Super Admin template catalogue PG",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("lists in-test template, limits assignment count by scope and denies wrong role",async()=>{
  const nonce=randomUUID().slice(0,10);
  const created=await createProjectTemplate(admin,{
   slug:"chat6-catalog-"+nonce,title:"Catalogue "+nonce,
   blueprint:{overview:{goal:"A demo",deliverables:[]},
    releases:[{key:"r1",title:"Release",sequence:0}],
    sprints:[{key:"s1",title:"Sprint",releaseKey:"r1",sequence:0}],
    tasks:[{key:"t1",title:"Task",sprintKey:"s1",priority:"HIGH",sequence:0}],resources:[]},
  });
  await publishProjectTemplate(admin,created.template.id);
  const collegeA={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
  await assignProjectTemplateToCollege(collegeA,created.template.id,SEED_IDS.collegeA);
  const q={q:"Catalogue "+nonce};
  expect((await listSuperAdminTemplateDirectory(admin,q)).items).toEqual([
   expect.objectContaining({id:created.template.id,activeAssignments:1})]);
  expect((await listSuperAdminTemplateDirectory(collegeA,q)).items[0]?.activeAssignments).toBe(1);
  const foreign={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}};
  expect((await listSuperAdminTemplateDirectory(foreign,q)).items[0]?.activeAssignments).toBe(0);
  await expect(listSuperAdminTemplateDirectory({...admin,user:{...admin.user,systemRoles:[]}},q))
   .rejects.toBeInstanceOf(AuthorizationError);
 });
});
