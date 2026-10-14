import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll,describe,expect,it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { exportSuperAdminUsers } from "@/modules/people/admin-users-export-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
const enabled=!!process.env.TEST_DATABASE_URL&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;
const admin:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"people-export",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
describe.skipIf(!enabled)("Super Admin users CSV PostgreSQL",()=>{
 afterAll(async()=>{await pool?.end();await closeDatabaseConnection();});
 it("exports in-test member in scope, omits contact, denies foreign and wrong-role",async()=>{
  const nonce=randomUUID().slice(0,10),userId=randomUUID(),email="private-"+nonce+"@example.test";
  await pool!.query("insert into users (id,identity_uid,display_name,email) values ($1,$2,$3,$4)",
   [userId,"export-"+nonce,"=Learner "+nonce,email]);
  const row=await pool!.query<{id:string}>("insert into college_memberships (user_id,college_id) values ($1,$2) returning id",
   [userId,SEED_IDS.collegeA]);
  await pool!.query("insert into membership_roles (membership_id,role) values ($1,'LEARNER')",[row.rows[0]!.id]);
  const own=await exportSuperAdminUsers(admin,{q:nonce,tab:"STUDENT"});
  expect(own.csv).toContain("'=Learner");
  expect(own.csv).not.toContain(email);
  expect(own.exported).toBe(1);
  const foreign={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}};
  expect((await exportSuperAdminUsers(foreign,{q:nonce})).exported).toBe(0);
  await expect(exportSuperAdminUsers({...admin,user:{...admin.user,systemRoles:[]}},{}))
   .rejects.toBeInstanceOf(AuthorizationError);
  // Append-only event foreign keys may reference memberships; do not delete fixture users.
 });
});
