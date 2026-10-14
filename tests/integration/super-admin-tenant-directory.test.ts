import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {getAdminTenantDetail,getAdminTenantDirectory} from "@/modules/colleges/super-admin-directory-service";
import {AuthorizationError} from "@/modules/permissions/policy";
import {SEED_IDS} from "../../scripts/db-seed-data";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;
const admin:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"tenant-fixture",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null};
describe.skipIf(!enabled)("Super Admin tenant directory PostgreSQL",()=>{
 afterAll(async()=>{await pool?.end();await closeDatabaseConnection();});
 it("reads in-test tenant, masks foreign-scoped and rejects wrong-role",async()=>{
  const key=randomUUID().slice(0,10);
  const o=await pool!.query<{id:string}>("insert into organizations (name) values ($1) returning id",["Tenant Org "+key]);
  const c=await pool!.query<{id:string}>("insert into colleges (organization_id,name,code) values ($1,$2,$3) returning id",
   [o.rows[0]!.id,"Tenant College "+key,"T"+key]);
  const id=c.rows[0]!.id;
  expect((await getAdminTenantDetail(admin,id)).id).toBe(id);
  const scoped={...admin,adminScope:{organizationId:o.rows[0]!.id,collegeId:id}};
  expect((await getAdminTenantDirectory(scoped,{})).items.some(x=>x.id===id)).toBe(true);
  const foreign={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
  await expect(getAdminTenantDetail(foreign,id)).rejects.toMatchObject({code:"COLLEGE_NOT_FOUND"});
  await expect(getAdminTenantDetail({...admin,user:{...admin.user,systemRoles:[]}},id)).rejects.toBeInstanceOf(AuthorizationError);
 });
});
