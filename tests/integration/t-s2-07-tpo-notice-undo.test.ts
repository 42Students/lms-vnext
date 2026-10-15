import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {createTpoNotice} from "@/modules/announcements/tpo-placement-write-service";
import {mutateTpoNotice} from "@/modules/announcements/tpo-placement-notice-lifecycle";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
import type {RequestContext} from "@/modules/identity/context";
const enabled=process.env.DB10_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL)&&
 process.env.DATABASE_URL===process.env.TEST_DATABASE_URL;
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"seed-faculty",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
 organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("T-S2-07 30-second undo real DB10 notice",()=>{
 it("retracts an own authored notice once under optimistic version",async()=>{
  if(!pool)throw new Error("Disposable PostgreSQL required");
  const notice=await createTpoNotice(tpo,{title:"Undo send "+randomUUID(),message:"Short notice"});
  const undone=await mutateTpoNotice(tpo,{noticeId:notice.id,action:"UNDO_SEND",expectedVersion:notice.version});
  expect(undone.version).toBe(notice.version+1);
  const row=(await pool.query<{deleted_at:Date|null}>(
   "SELECT deleted_at FROM announcements WHERE id=$1",[notice.id],
  )).rows[0];
  expect(row?.deleted_at).toBeInstanceOf(Date);
  await expect(mutateTpoNotice(tpo,{noticeId:notice.id,action:"UNDO_SEND",expectedVersion:notice.version}))
   .rejects.toBeDefined();
 });
 it("rejects a 31-second-old notice without soft-deleting it",async()=>{
  if(!pool)throw new Error("Disposable PostgreSQL required");
  const notice=await createTpoNotice(tpo,{title:"Expired undo "+randomUUID(),message:"Keep live"});
  await pool.query("UPDATE announcements SET created_at=now()-interval '31 seconds' WHERE id=$1",[notice.id]);
  await expect(mutateTpoNotice(tpo,{noticeId:notice.id,action:"UNDO_SEND",expectedVersion:notice.version}))
    .rejects.toThrow("ANNOUNCEMENT_UNDO_EXPIRED");
  const row=(await pool.query<{deleted_at:Date|null}>(
   "SELECT deleted_at FROM announcements WHERE id=$1",[notice.id],
  )).rows[0];
  expect(row?.deleted_at).toBeNull();
 });
});
afterAll(async()=>{await pool?.end();await closeDatabaseConnection();});
