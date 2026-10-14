import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {listAdminScopedPeople} from "@/modules/admin-ui/super-admin-scoped-people-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=!!process.env.TEST_DATABASE_URL&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;
const admin:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"admin-faculty-read",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
describe.skipIf(!enabled)("Super Admin faculty read PostgreSQL",()=>{
 afterAll(async()=>{await pool?.end();await closeDatabaseConnection();});
 it("uses in-test faculty membership and hides foreign college/wrong role",async()=>{
  const id=randomUUID(),code=id.slice(0,8),name="Admin Faculty "+code;
  await pool!.query("insert into users(id,identity_uid,display_name,email) values ($1,$2,$3,$4)",
   [id,"faculty-"+code,name,"private-"+code+"@example.test"]);
  const row=await pool!.query<{id:string}>("insert into college_memberships(user_id,college_id) values ($1,$2) returning id",[id,SEED_IDS.collegeA]);
  await pool!.query("insert into membership_roles(membership_id,role) values ($1,'FACULTY')",[row.rows[0]!.id]);
  const own=await listAdminScopedPeople(admin,"FACULTY",{q:code});
  expect(own.items).toEqual([expect.objectContaining({id:row.rows[0]!.id})]);
  expect(JSON.stringify(own)).not.toContain("@example.test");
  const foreign={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}};
  expect((await listAdminScopedPeople(foreign,"FACULTY",{q:code})).items).toHaveLength(0);
  expect((await listAdminScopedPeople(admin,"LEARNER",{q:code})).items).toHaveLength(0);
  await expect(listAdminScopedPeople({...admin,user:{...admin.user,systemRoles:[]}},"FACULTY",{})).rejects.toBeInstanceOf(AuthorizationError);
 });
});
