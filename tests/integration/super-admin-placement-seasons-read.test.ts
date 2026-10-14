import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {listSuperAdminPlacementSeasons} from "@/modules/admin-ui/super-admin-placement-seasons-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;
const id=randomUUID(),code="R4-"+id.slice(0,8),name="Super Admin R4 "+code;
const admin:RequestContext={
 user:{id:SEED_IDS.superAdminUser,identityUid:"super-admin-r4",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA},
};
describe.skipIf(!enabled)("Super Admin placement seasons disposable PostgreSQL",()=>{
 beforeAll(async()=>{
  await pool!.query(
   "insert into placement_seasons(id,college_id,name,code,start_date,end_date,status,created_by_user_id,closed_by_user_id,closed_at) values ($1::uuid,$2::uuid,$3::text,$4::text,'2026-01-01'::date,'2026-08-31'::date,'CLOSED',$5::uuid,$5::uuid,now())",
   [id,SEED_IDS.collegeA,name,code,SEED_IDS.superAdminUser],
  );
 });
 afterAll(async()=>{try{
  await pool?.query("delete from placement_seasons where id=$1::uuid",[id]);
 }finally{await pool?.end();await closeDatabaseConnection();}});
 it("shows in-test closed season only in selected college",async()=>{
  expect((await listSuperAdminPlacementSeasons(admin,{q:code,status:"CLOSED"})).items)
   .toEqual([expect.objectContaining({id,status:"CLOSED"})]);
  const otherCollege={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}};
  expect((await listSuperAdminPlacementSeasons(otherCollege,{q:code})).items).toHaveLength(0);
  const otherOrg={...admin,adminScope:{organizationId:randomUUID(),collegeId:SEED_IDS.collegeA}};
  expect((await listSuperAdminPlacementSeasons(otherOrg,{q:code})).items).toHaveLength(0);
  await expect(listSuperAdminPlacementSeasons({...admin,user:{...admin.user,systemRoles:[]}},{}))
   .rejects.toBeInstanceOf(AuthorizationError);
 });
});
