import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {createProjectTemplate,publishProjectTemplate,assignProjectTemplateToCollege} from "@/modules/projects/template-service";
import {listSuperAdminTemplateCollegeAvailability} from "@/modules/projects/template-college-availability-service";
import {getSuperAdminTemplateSubview} from "@/modules/projects/template-subview-service";
import {AuthorizationError} from "@/modules/permissions/policy";
import {createCollege} from "@/modules/colleges/service";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
import {SEED_IDS} from "../../scripts/db-seed-data";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const admin:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"template-assignment-fixture",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:null};
describe.skipIf(!enabled)("Template college availability in PostgreSQL",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("retains in-test own assignment and hides it from foreign scoped college and wrong-role",async()=>{
  const nonce=randomUUID().slice(0,10);
  const own=await createCollege(admin,{organizationId:SEED_IDS.organization,name:"Own "+nonce,code:"OWN-"+nonce});
  const other=await createCollege(admin,{organizationId:SEED_IDS.organization,name:"Other "+nonce,code:"OTHER-"+nonce});
  const made=await createProjectTemplate(admin,{slug:"chat6-scope-"+nonce,title:"Scoped template "+nonce,
   blueprint:{overview:{goal:"Scope",deliverables:[]},
    releases:[{key:"r1",title:"Release",sequence:0}],
    sprints:[{key:"s1",title:"Sprint",releaseKey:"r1",sequence:0}],
    tasks:[{key:"t1",title:"Task",sprintKey:"s1",priority:"HIGH",sequence:0}],resources:[]},
  });
  await publishProjectTemplate(admin,made.template.id);
  const collegeA={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:own.id}};
  await assignProjectTemplateToCollege(collegeA,made.template.id,own.id);
  expect((await listSuperAdminTemplateCollegeAvailability(collegeA,made.template.id,{status:"ASSIGNED"})).items.map(row=>row.id)).toEqual([own.id]);
  expect((await listSuperAdminTemplateCollegeAvailability(admin,made.template.id,{status:"UNASSIGNED"})).items.some(row=>row.id===other.id)).toBe(true);
  expect((await getSuperAdminTemplateSubview(collegeA,made.template.id,true)).assignedColleges).toHaveLength(1);
  const foreign={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:other.id}};
  expect((await listSuperAdminTemplateCollegeAvailability(foreign,made.template.id,{status:"ASSIGNED"})).items).toHaveLength(0);
  expect((await listSuperAdminTemplateCollegeAvailability(foreign,made.template.id,{})).items.every(row=>row.id===other.id)).toBe(true);
  expect((await getSuperAdminTemplateSubview(foreign,made.template.id,true)).assignedColleges).toHaveLength(0);
  await expect(listSuperAdminTemplateCollegeAvailability({...admin,user:{...admin.user,systemRoles:[]}},made.template.id,{}))
   .rejects.toBeInstanceOf(AuthorizationError);
 });
});
