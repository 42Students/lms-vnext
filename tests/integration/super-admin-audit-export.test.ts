import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {exportSuperAdminActivity} from "@/modules/activity/super-admin-audit-export-service";
import {AuthorizationError} from "@/modules/permissions/policy";
import {SEED_IDS} from "../../scripts/db-seed-data";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;
const admin:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"admin-audit-fixture",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
describe.skipIf(!enabled)("Super Admin audit filtered CSV (PostgreSQL)",()=>{
 afterAll(async()=>{await pool?.end();await closeDatabaseConnection();});
 it("exports own in-test event, never another college, blocks wrong-role",async()=>{
  const token=randomUUID().slice(0,12);
  await pool!.query("insert into activity_events (organization_id,college_id,module,event_type,subject_type,subject_id,summary) values ($1,$2,'PLATFORM','platform.fixture','college',$3,$4)",
   [SEED_IDS.organization,SEED_IDS.collegeA,token,"=SUM(1,2) "+token]);
  const own=await exportSuperAdminActivity(admin,{eventType:"platform.fixture",subjectType:"college"});
  expect(own.csv).toContain(token);
  expect(own.csv).toContain("'=SUM");
  expect((await exportSuperAdminActivity(admin,{subjectId:token})).csv).toContain(token);
  expect((await exportSuperAdminActivity(admin,{subjectId:"no-such-subject-"+token})).csv).not.toContain(token);
  const foreign={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}};
  expect((await exportSuperAdminActivity(foreign,{eventType:"platform.fixture",subjectType:"college"})).csv).not.toContain(token);
  await expect(exportSuperAdminActivity(foreign,{collegeId:SEED_IDS.collegeA,subjectId:token}))
    .rejects.toBeInstanceOf(AuthorizationError);
  await expect(exportSuperAdminActivity({...admin,user:{...admin.user,systemRoles:[]}},{}))
   .rejects.toBeInstanceOf(AuthorizationError);
 });
});
