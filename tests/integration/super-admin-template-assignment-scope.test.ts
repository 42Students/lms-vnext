import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {createProjectTemplate,publishProjectTemplate,assignProjectTemplateToCollege,getProjectTemplateDetail} from "@/modules/projects/template-service";
import {getSuperAdminTemplateSubview} from "@/modules/projects/template-subview-service";
import {AuthorizationError} from "@/modules/permissions/policy";
import {SEED_IDS} from "../../scripts/db-seed-data";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
const admin:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"template-assignment-fixture",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:null};
describe.skipIf(!enabled)("Template assignment scope in PostgreSQL",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("retains in-test own assignment and hides it from foreign scoped college and wrong-role",async()=>{
  const nonce=randomUUID().slice(0,10);
  const made=await createProjectTemplate(admin,{slug:"chat6-scope-"+nonce,title:"Scoped template "+nonce,
   blueprint:{overview:{goal:"Scope",deliverables:[]},
    releases:[{key:"r1",title:"Release",sequence:0}],
    sprints:[{key:"s1",title:"Sprint",releaseKey:"r1",sequence:0}],
    tasks:[{key:"t1",title:"Task",sprintKey:"s1",priority:"HIGH",sequence:0}],resources:[]},
  });
  await publishProjectTemplate(admin,made.template.id);
  const collegeA={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
  await assignProjectTemplateToCollege(collegeA,made.template.id,SEED_IDS.collegeA);
  expect((await getProjectTemplateDetail(admin,made.template.id)).assignments).toHaveLength(1);
  expect((await getSuperAdminTemplateSubview(collegeA,made.template.id,true)).assignedColleges).toHaveLength(1);
  const foreign={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}};
  expect((await getProjectTemplateDetail(foreign,made.template.id)).assignments).toHaveLength(0);
  expect((await getSuperAdminTemplateSubview(foreign,made.template.id,true)).assignedColleges).toHaveLength(0);
  await expect(getSuperAdminTemplateSubview({...admin,user:{...admin.user,systemRoles:[]}},made.template.id,true))
   .rejects.toBeInstanceOf(AuthorizationError);
 });
});
