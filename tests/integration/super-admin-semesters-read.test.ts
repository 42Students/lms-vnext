import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll,beforeAll,describe,expect,it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { listAdminSemesters } from "@/modules/admin-ui/super-admin-semesters-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
const enabled=!!process.env.TEST_DATABASE_URL&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;
const admin:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"admin-semesters-fixture",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
const id=randomUUID(),term=randomUUID(),label="admin-sem-"+id.slice(0,8);
describe.skipIf(!enabled)("Super Admin Semesters in-test PostgreSQL",()=>{
 beforeAll(async()=>{
  await pool!.query("insert into programs(id,department_id,name,code,duration_terms) values ($1,$2,$3::text,$3::text,8)",[id,SEED_IDS.departmentA,label]);
  await pool!.query("insert into program_terms(id,program_id,term_number,name,is_active,total_credits) values ($1,$2,1,$3,true,20)",[term,id,label]);
 });
 afterAll(async()=>{try{
  await pool?.query("delete from program_terms where id=$1",[term]);
  await pool?.query("delete from programs where id=$1",[id]);
 }finally{await pool?.end();await closeDatabaseConnection();}});
 it("shows scoped term and denies foreign and wrong-role",async()=>{
  const own=await listAdminSemesters(admin,{q:label});
  expect(own.items).toEqual([expect.objectContaining({id:term,status:"ACTIVE"})]);
  const foreign={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}};
  expect((await listAdminSemesters(foreign,{q:label})).items).toHaveLength(0);
  await expect(listAdminSemesters({...admin,user:{...admin.user,systemRoles:[]}},{}))
    .rejects.toBeInstanceOf(AuthorizationError);
 });
});
