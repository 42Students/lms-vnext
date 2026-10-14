import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {listAdminBatches} from "@/modules/admin-ui/super-admin-batches-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=!!process.env.TEST_DATABASE_URL&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;
const admin:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"admin-batches",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
const ids={period:randomUUID(),program:randomUUID(),batch:randomUUID()};
const label="admin-batch-"+ids.batch.slice(0,8);
describe.skipIf(!enabled)("Super Admin batches PostgreSQL",()=>{
 beforeAll(async()=>{
  await pool!.query("insert into academic_periods (id,college_id,name,code,start_date,end_date) values ($1,$2,$3,$3,'2026-07-01','2026-12-31')",[ids.period,SEED_IDS.collegeA,label]);
  await pool!.query("insert into programs (id,department_id,name,code,duration_terms) values ($1,$2,$3,$3,8)",[ids.program,SEED_IDS.departmentA,label]);
  await pool!.query("insert into cohorts (id,program_id,name,code,start_period_id) values ($1,$2,$3,$3,$4)",[ids.batch,ids.program,label,ids.period]);
 });
 afterAll(async()=>{try{
  for(const [table,id] of [["cohorts",ids.batch],["programs",ids.program],["academic_periods",ids.period]] as const)
   await pool?.query(`delete from ${table} where id=$1`,[id]);
 }finally{await pool?.end();await closeDatabaseConnection();}});
 it("filters in-test batch by selected college and denies wrong-role",async()=>{
  expect((await listAdminBatches(admin,{q:label,status:"PLANNED"})).items).toEqual([expect.objectContaining({id:ids.batch})]);
  const foreign={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}};
  expect((await listAdminBatches(foreign,{q:label})).items).toHaveLength(0);
  await expect(listAdminBatches({...admin,user:{...admin.user,systemRoles:[]}},{})).rejects.toBeInstanceOf(AuthorizationError);
 });
});
