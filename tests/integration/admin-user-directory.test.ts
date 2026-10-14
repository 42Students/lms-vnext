import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {listSuperAdminUsers} from "@/modules/people/admin-user-directory-service";
import {AuthorizationError} from "@/modules/permissions/policy";
import {SEED_IDS} from "../../scripts/db-seed-data";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;
const admin:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"admin-roles-test",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
describe.skipIf(!enabled)("Super Admin user-role directory (isolated PG)",()=>{
 afterAll(async()=>{await pool?.end();await closeDatabaseConnection();});
 it("reads own scoped role, excludes foreign college, rejects wrong role",async()=>{
  const id=randomUUID(),unique=randomUUID().slice(0,10);
  await pool!.query("insert into users (id,identity_uid,display_name,email) values ($1,$2,$3,$4)",[id,"test-roles-"+unique,"Directory User "+unique,"admin-"+unique+"@example.test"]);
  const row=await pool!.query<{id:string}>("insert into college_memberships (user_id,college_id) values ($1,$2) returning id",
   [id,SEED_IDS.collegeA]);
  await pool!.query("insert into membership_roles (membership_id,role) values ($1,'FACULTY')",[row.rows[0]!.id]);
  const own=await listSuperAdminUsers(admin,{q:unique,tab:"FACULTY"});
  expect(own.items.some(x=>x.userId===id&&x.roles.includes("FACULTY"))).toBe(true);
  expect(own.items[0]?.email).toBe("admin-"+unique+"@example.test");
  const global=await listSuperAdminUsers({...admin,adminScope:null},{q:unique});
  expect(global.items[0]?.email).toBeNull();
  expect(global.contactVisible).toBe(false);
  expect((await listSuperAdminUsers(admin,{q:unique,tab:"STUDENT"})).items).toHaveLength(0);
  const foreign={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}};
  expect((await listSuperAdminUsers(foreign,{q:unique})).items).toHaveLength(0);
  const wrong={...admin,user:{...admin.user,systemRoles:[]}};
  await expect(listSuperAdminUsers(wrong,{q:unique})).rejects.toBeInstanceOf(AuthorizationError);
 });
});
