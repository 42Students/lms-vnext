import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { closeDatabaseConnection } from "@/db/client";
import { listColleges } from "@/modules/colleges/service";
import { SEED_IDS } from "../../scripts/db-seed-data";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;
const admin:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"quick-actions-admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null};
describe.skipIf(!enabled)("Super Admin dashboard scoped college data (PG)",()=>{
 afterAll(async()=>{await pool?.end();await closeDatabaseConnection();});
 it("lists the new fixture only in its own scoped college, never another college or wrong role",async()=>{
  const nonce=randomUUID().slice(0,10);
  const org=await pool!.query<{id:string}>("insert into organizations (name) values ($1) returning id",["Dashboard Org "+nonce]);
  const own=await pool!.query<{id:string}>("insert into colleges (organization_id,name,code) values ($1,$2,$3) returning id",
    [org.rows[0]!.id,"Dashboard College "+nonce,"DQ"+nonce]);
  const exact={...admin,adminScope:{organizationId:org.rows[0]!.id,collegeId:own.rows[0]!.id}};
  expect((await listColleges(exact)).map(x=>x.id)).toEqual([own.rows[0]!.id]);
  const foreign={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
  expect((await listColleges(foreign)).some(x=>x.id===own.rows[0]!.id)).toBe(false);
  await expect(listColleges({...admin,user:{...admin.user,systemRoles:[]}})).rejects.toBeInstanceOf(AuthorizationError);
 });
});
