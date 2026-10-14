import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {listAdminTermCourseMappings} from "@/modules/admin-ui/super-admin-term-mapping-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=!!process.env.TEST_DATABASE_URL&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;
const admin:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"admin-mapping",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
const ids={program:randomUUID(),term:randomUUID(),course:randomUUID(),mapping:randomUUID()};
const name="admin-map-"+ids.mapping.slice(0,8);
describe.skipIf(!enabled)("Super Admin term course mapping PostgreSQL",()=>{
 beforeAll(async()=>{
  await pool!.query("insert into programs(id,department_id,name,code,duration_terms) values ($1,$2,$3,$3,8)",[ids.program,SEED_IDS.departmentA,name]);
  await pool!.query("insert into program_terms(id,program_id,term_number,name,is_active) values ($1,$2,1,$3,true)",[ids.term,ids.program,name]);
  await pool!.query("insert into courses(id,department_id,name,code) values ($1,$2,$3,$3)",[ids.course,SEED_IDS.departmentA,name]);
  await pool!.query("insert into program_term_courses(id,program_term_id,course_id,type,display_order) values ($1,$2,$3,'CORE',0)",[ids.mapping,ids.term,ids.course]);
 });
 afterAll(async()=>{try{
  for(const [table,id] of [["program_term_courses",ids.mapping],["courses",ids.course],["program_terms",ids.term],["programs",ids.program]] as const)
   await pool?.query(`delete from ${table} where id=$1`,[id]);
 }finally{await pool?.end();await closeDatabaseConnection();}});
 it("shows only same college joined course, rejects foreign and wrong-role",async()=>{
  expect((await listAdminTermCourseMappings(admin,{q:name})).items).toEqual([expect.objectContaining({id:ids.mapping})]);
  const foreign={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}};
  expect((await listAdminTermCourseMappings(foreign,{q:name})).items).toHaveLength(0);
  await expect(listAdminTermCourseMappings({...admin,user:{...admin.user,systemRoles:[]}},{})).rejects.toBeInstanceOf(AuthorizationError);
 });
});
