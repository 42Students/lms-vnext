import {randomUUID} from "node:crypto";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {createTpoInternalThread} from "@/modules/placements/tpo-team-internal-create-service";
import {createTpoTeamAsk,changeTpoTeamAsk,listTpoTeamAsks} from "@/modules/placements/tpo-team-asks-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
import type {RequestContext} from "@/modules/identity/context";

const enabled=process.env.DB10_ISOLATED_TEST_DATABASE==="1"&&
 Boolean(process.env.TEST_DATABASE_URL)&&
 process.env.DATABASE_URL===process.env.TEST_DATABASE_URL;
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const asker:RequestContext={
 user:{id:SEED_IDS.facultyUser,identityUid:"seed-faculty",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]},
};
const assignee:RequestContext={
 user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN","TPO"]},
};
let threadId:string|null=null;
describe.skipIf(!enabled)("TPO team asks on registered disposable PostgreSQL",()=>{
 beforeAll(async()=>{
  if(!pool)throw new Error("Disposable PostgreSQL is required");
  await pool.query("INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO'),($2,'TPO') ON CONFLICT DO NOTHING",
   [SEED_IDS.facultyCollegeAMembership,SEED_IDS.collegeAdminMembership]);
  const thread=await createTpoInternalThread(asker,{
   recipientMembershipId:SEED_IDS.collegeAdminMembership,
   topic:"TPO ask test "+randomUUID(),
   idempotencyKey:randomUUID(),
  });
  threadId=thread.id;
 });
 it("TPO-inbox-team-22 persists an ask once, then allows only its assignee to mark it done",async()=>{
  if(!threadId)throw new Error("Test thread missing");
  const payload={
   threadId,assigneeMembershipId:SEED_IDS.collegeAdminMembership,
   requestKey:randomUUID(),title:"Share the updated roster",dueAt:null,
  };
  const created=await createTpoTeamAsk(asker,payload);
  const duplicate=await createTpoTeamAsk(asker,payload);
  expect(duplicate.id).toBe(created.id);
  const rows=await listTpoTeamAsks(assignee,threadId);
  expect(rows.status).toBe("READY");
  expect(rows.items.some(row=>row.id===created.id&&row.status==="OPEN")).toBe(true);
  await expect(changeTpoTeamAsk(asker,{
   threadId,askId:created.id,action:"DONE",expectedStatus:"OPEN",
  })).rejects.toThrow();
  const done=await changeTpoTeamAsk(assignee,{
   threadId,askId:created.id,action:"DONE",expectedStatus:"OPEN",
   note:"Uploaded and checked",
  });
  expect(done.status).toBe("DONE");
  await expect(changeTpoTeamAsk(assignee,{
   threadId,askId:created.id,action:"DONE",expectedStatus:"OPEN",
  })).rejects.toThrow("TEAM_ASK_STALE");
 });
 it("TPO-inbox-team-29 notifies the actual assignee and original asker on completion",async()=>{
  if(!pool||!threadId)throw new Error("Test setup missing");
  const events=await pool.query<{eventType:string;userId:string}>(`
   SELECT ae.event_type AS "eventType",n.user_id AS "userId"
   FROM activity_events ae JOIN in_app_notifications n ON n.event_id=ae.id
   WHERE ae.subject_id=$1 AND ae.event_type IN
    ('placements.tpo_team.ask_created','placements.tpo_team.ask_done')
  `,[threadId]);
  expect(events.rows).toEqual(expect.arrayContaining([
   {eventType:"placements.tpo_team.ask_created",userId:SEED_IDS.collegeAdminUser},
   {eventType:"placements.tpo_team.ask_done",userId:SEED_IDS.facultyUser},
  ]));
 });
});
afterAll(async()=>{
 if(pool&&threadId){
  await pool.query(`DELETE FROM in_app_notifications WHERE event_id IN
    (SELECT id FROM activity_events WHERE subject_type='team_thread' AND subject_id=$1)`,[threadId]);
  await pool.query("DELETE FROM activity_events WHERE subject_type='team_thread' AND subject_id=$1",[threadId]);
  await pool.query("DELETE FROM placement_tpo_team_asks WHERE thread_id=$1",[threadId]);
  await pool.query("DELETE FROM placement_tpo_internal_reads WHERE thread_id=$1",[threadId]);
  await pool.query("DELETE FROM placement_tpo_internal_messages WHERE thread_id=$1",[threadId]);
  await pool.query("DELETE FROM placement_tpo_internal_threads WHERE id=$1",[threadId]);
 }
 await pool?.end();
 await closeDatabaseConnection();
});
