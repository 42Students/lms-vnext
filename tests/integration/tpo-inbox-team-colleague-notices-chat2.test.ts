import {randomUUID} from "node:crypto";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {createTpoNotice} from "@/modules/announcements/tpo-placement-write-service";
import {editTpoNotice} from "@/modules/announcements/tpo-placement-edit-service";
import {mutateTpoNotice} from "@/modules/announcements/tpo-placement-notice-lifecycle";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
import type {RequestContext} from "@/modules/identity/context";

const enabled=process.env.DB10_ISOLATED_TEST_DATABASE==="1"&&
 Boolean(process.env.TEST_DATABASE_URL)&&
 process.env.DATABASE_URL===process.env.TEST_DATABASE_URL;
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const origin:RequestContext={
 user:{id:SEED_IDS.facultyUser,identityUid:"seed-faculty",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]},
};
const colleague:RequestContext={
 user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN","TPO"]},
};
describe.skipIf(!enabled)("TPO teammate notice lifecycle PostgreSQL",()=>{
 beforeAll(async()=>{
  if(!pool)throw new Error("Disposable PostgreSQL is required");
  await pool.query("INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO'),($2,'TPO') ON CONFLICT DO NOTHING",
   [SEED_IDS.facultyCollegeAMembership,SEED_IDS.collegeAdminMembership]);
 });
 it("TPO-inbox-team-57 permits a different authorized same-college TPO to edit then delete without losing optimistic concurrency",async()=>{
  if(!pool)throw new Error("Disposable PostgreSQL is required");
  const created=await createTpoNotice(origin,{title:"Shared notice "+randomUUID(),message:"Initial"});
  const edited=await editTpoNotice(colleague,{
   noticeId:created.id,expectedVersion:created.version,
   title:"Updated by colleague",message:"Shared handover",pinned:false,
  });
  expect(edited.version).toBe(created.version+1);
  await expect(editTpoNotice(origin,{
   noticeId:created.id,expectedVersion:created.version,
   title:"Stale version",message:"Must not overwrite",pinned:false,
  })).rejects.toThrow("ANNOUNCEMENT_STALE");
  const removed=await mutateTpoNotice(colleague,{
   noticeId:created.id,expectedVersion:edited.version,action:"DELETE",
  });
  expect(removed.version).toBe(edited.version+1);
  const record=await pool.query<{deletedAt:Date|null;message:string}>(
   'SELECT deleted_at AS "deletedAt",message FROM announcements WHERE id=$1',[created.id]);
  expect(record.rows[0]?.deletedAt).toBeInstanceOf(Date);
  expect(record.rows[0]?.message).toBe("Shared handover");
 });
});
afterAll(async()=>{await pool?.end();await closeDatabaseConnection();});
