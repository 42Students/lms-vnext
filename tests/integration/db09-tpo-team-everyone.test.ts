import {afterAll,afterEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {postTpoTeamEveryoneMessage,readTpoTeamEveryone,
 setTpoTeamEveryoneMuted} from "@/modules/placements/tpo-team-everyone-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL)&&
 process.env.TPO_TEAM_EVERYONE_SCHEMA_READY==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const messageIds:string[]=[];
const tpo:RequestContext={
 user:{id:SEED_IDS.facultyUser,identityUid:"db09-everyone",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]},
};
async function cleanup(){
 if(!pool)return;
 await pool.query("DELETE FROM placement_tpo_team_everyone_mutes WHERE college_id=$1 AND membership_id=$2",
  [SEED_IDS.collegeA,SEED_IDS.facultyCollegeAMembership]);
 if(messageIds.length){
  await pool.query("DELETE FROM placement_tpo_team_everyone_messages WHERE id=ANY($1::uuid[])",[messageIds]);
  messageIds.length=0;
 }
}
describe.skipIf(!enabled)("TPO-inbox-team-15 permanent Everyone channel PostgreSQL",()=>{
 afterEach(cleanup);
 afterAll(async()=>{await cleanup();await pool?.end();await closeDatabaseConnection();});
 it("TPO-inbox-team-15 keeps Everyone accessible after mute and never exposes another college",async()=>{
  if(!pool)throw new Error("Disposable PostgreSQL is required");
  const initially=await readTpoTeamEveryone(tpo);
  expect(initially.status).toBe("READY");
  const created=await postTpoTeamEveryoneMessage(tpo,{body:"Permanent college conversation"});
  messageIds.push(created.id);
  const visible=await readTpoTeamEveryone(tpo);
  expect(visible.rows.some(row=>row.id===created.id)).toBe(true);
  await setTpoTeamEveryoneMuted(tpo,{muted:true});
  const muted=await readTpoTeamEveryone(tpo);
  expect(muted.muted).toBe(true);
  expect(muted.rows.some(row=>row.id===created.id)).toBe(true);
  await setTpoTeamEveryoneMuted(tpo,{muted:false});
  expect((await readTpoTeamEveryone(tpo)).muted).toBe(false);
  const learner:RequestContext={...tpo,membership:{...tpo.membership!,roles:["LEARNER"]}};
  await expect(readTpoTeamEveryone(learner)).rejects.toBeInstanceOf(AuthorizationError);
  await expect(postTpoTeamEveryoneMessage(learner,{body:"No access"}))
   .rejects.toBeInstanceOf(AuthorizationError);
  const foreign:RequestContext={...tpo,membership:{...tpo.membership!,collegeId:SEED_IDS.collegeB}};
  const foreignRead=await readTpoTeamEveryone(foreign);
  expect(foreignRead.rows.some(row=>row.id===created.id)).toBe(false);
 });
});
