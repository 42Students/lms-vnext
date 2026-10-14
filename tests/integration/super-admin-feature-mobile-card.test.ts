import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { listSuperAdminFeatureControls } from "@/modules/module-access/admin-read-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;
const actor:RequestContext={
 user:{id:SEED_IDS.superAdminUser,identityUid:"feature-card-test",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null,
};
describe.skipIf(!enabled)("Super Admin feature controls mobile card facts (PG)",()=>{
 afterAll(async()=>{await pool?.end();await closeDatabaseConnection();});
 it("reads in-test college only in authorized scope, excludes foreign scope and denies wrong role",async()=>{
  const nonce=randomUUID().slice(0,10);
  const org=await pool!.query<{id:string}>("insert into organizations (name) values ($1) returning id",["Feature Card Org "+nonce]);
  const own=await pool!.query<{id:string}>("insert into colleges (organization_id,name,code) values ($1,$2,$3) returning id",
    [org.rows[0]!.id,"Feature Card College "+nonce,"FC"+nonce]);
  const scope={...actor,adminScope:{organizationId:org.rows[0]!.id,collegeId:own.rows[0]!.id}};
  const ownResult=await listSuperAdminFeatureControls(scope,{q:nonce});
  expect(ownResult.items).toEqual([expect.objectContaining({id:own.rows[0]!.id})]);
  expect(ownResult.items[0]?.modules).toHaveLength(3);
  const foreign={...actor,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
  expect((await listSuperAdminFeatureControls(foreign,{q:nonce})).items).toHaveLength(0);
  await expect(listSuperAdminFeatureControls({...actor,user:{...actor.user,systemRoles:[]}},{}))
    .rejects.toBeInstanceOf(AuthorizationError);
 });
});
