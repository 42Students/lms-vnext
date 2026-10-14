import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getSuperAdminMembershipDetail} from "@/modules/people/admin-membership-detail-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;
const admin:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"membership-detail-test",
 platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:null};
describe.skipIf(!enabled)("Super Admin scoped membership detail PG",()=>{
 afterAll(async()=>{await pool?.end();await closeDatabaseConnection();});
 it("reads in-test member but masks global contacts and hides foreign/missing membership",async()=>{
  const suffix=randomUUID().slice(0,10),id=randomUUID();
  await pool!.query("insert into users (id,identity_uid,display_name,email) values ($1,$2,$3,$4)",
   [id,"membership-"+suffix,"Member "+suffix,"member-"+suffix+"@example.test"]);
  const result=await pool!.query<{id:string}>("insert into college_memberships (user_id,college_id) values ($1,$2) returning id",
   [id,SEED_IDS.collegeA]);
  await pool!.query("insert into membership_roles (membership_id,role) values ($1,'LEARNER')",[result.rows[0]!.id]);
  const mid=result.rows[0]!.id;
  expect((await getSuperAdminMembershipDetail(admin,mid))?.email).toBeNull();
  const own={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
  expect((await getSuperAdminMembershipDetail(own,mid))?.email).toBe("member-"+suffix+"@example.test");
  const foreign={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}};
  expect(await getSuperAdminMembershipDetail(foreign,mid)).toBeNull();
  expect(await getSuperAdminMembershipDetail(own,randomUUID())).toBeNull();
  await expect(getSuperAdminMembershipDetail({...admin,user:{...admin.user,systemRoles:[]}},mid))
   .rejects.toBeInstanceOf(AuthorizationError);
 });
});
