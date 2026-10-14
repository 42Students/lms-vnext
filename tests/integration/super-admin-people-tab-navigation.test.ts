import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {listSuperAdminUsers} from "@/modules/people/admin-user-directory-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;
const admin:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"people-tabs-fixture",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
describe.skipIf(!enabled)("People directory retained tabs and platform-status filters (PG)",()=>{
 afterAll(async()=>{await pool?.end();await closeDatabaseConnection();});
 it("keeps faculty and learner tabs distinct, scoped; denies wrong-role",async()=>{
  const name=randomUUID().slice(0,12);
  const facultyId=randomUUID(),studentId=randomUUID();
  await pool!.query("insert into users (id,identity_uid,display_name,platform_status) values ($1,$2,$3,'ACTIVE'),($4,$5,$6,'DISABLED')",
   [facultyId,"tabs-f-"+name,"Fixture Faculty "+name,studentId,"tabs-s-"+name,"Fixture Student "+name]);
  const f=await pool!.query<{id:string}>("insert into college_memberships (user_id,college_id) values ($1,$2) returning id",
   [facultyId,SEED_IDS.collegeA]);
  const s=await pool!.query<{id:string}>("insert into college_memberships (user_id,college_id) values ($1,$2) returning id",
   [studentId,SEED_IDS.collegeA]);
  await pool!.query("insert into membership_roles (membership_id,role) values ($1,'FACULTY'),($2,'LEARNER')",
   [f.rows[0]!.id,s.rows[0]!.id]);
  const faculty=await listSuperAdminUsers(admin,{q:name,tab:"FACULTY",platformStatus:"ACTIVE"});
  expect(faculty.items.map(x=>x.userId)).toEqual([facultyId]);
  const students=await listSuperAdminUsers(admin,{q:name,tab:"STUDENT",platformStatus:"DISABLED"});
  expect(students.items.map(x=>x.userId)).toEqual([studentId]);
  const foreign={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}};
  expect((await listSuperAdminUsers(foreign,{q:name,tab:"FACULTY"})).items).toHaveLength(0);
  await expect(listSuperAdminUsers({...admin,user:{...admin.user,systemRoles:[]}},{}))
   .rejects.toBeInstanceOf(AuthorizationError);
 });
});
