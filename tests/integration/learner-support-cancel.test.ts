import {randomUUID} from "node:crypto";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {actOnPlacementRequest} from "@/modules/placements/request-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCareerCalendarFixture,seedLearnerCareerCalendarFixture,
cleanupLearnerCareerCalendarFixture,type LearnerCareerCalendarFixture}
from "../support/learner-career-calendar-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let f:LearnerCareerCalendarFixture|null=null,requestId:string|null=null;
beforeEach(async()=>{
  f=newLearnerCareerCalendarFixture();await seedLearnerCareerCalendarFixture(pool,f);
  requestId=randomUUID();
  await pool.query("INSERT INTO placement_learner_requests(id,application_id,request_type,scope_key,reason,requested_by_user_id) VALUES($1,$2,'APPLICATION_WITHDRAWAL',$3,$4,$5)",
    [requestId,f.applicationId,"APPLICATION_WITHDRAWAL:"+f.applicationId,
      "Please cancel my pending withdrawal",f.drive.learner.ids.user]);
},45000);
afterEach(async()=>{
  const owned=f;f=null;
  if(requestId)await pool.query("DELETE FROM placement_learner_requests WHERE id=$1",[requestId]);
  requestId=null;
  if(owned)await cleanupLearnerCareerCalendarFixture(pool,owned);
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("learner pending request cancellation, own isolated audit",()=>{
  it("cancels once with recorded status/audit and denies stale replay",async()=>{
    const token=await pool.query<{updated_at:Date}>("SELECT updated_at FROM placement_learner_requests WHERE id=$1",[requestId]);
    const expected=token.rows[0]!.updated_at.toISOString();
    const own=f!.drive.learner.context;
    await expect(actOnPlacementRequest(own,requestId!,{action:"CANCEL"},"2020-01-01T00:00:00.000Z"))
      .rejects.toMatchObject({code:"PLACEMENT_REQUEST_INVALID_STATE"});
    const saved=await actOnPlacementRequest(own,requestId!,{action:"CANCEL"},expected);
    expect(saved.status).toBe("CANCELLED");
    const audit=await pool.query<{total:string}>(
      "SELECT count(*)::text AS total FROM activity_events WHERE subject_id=$1 AND event_type=$2",
      [requestId,"placements.request.decided"]);
    expect(Number(audit.rows[0]?.total??0)).toBeGreaterThanOrEqual(1);
    await expect(actOnPlacementRequest(own,requestId!,{action:"CANCEL"},expected))
      .rejects.toMatchObject({code:"PLACEMENT_REQUEST_INVALID_STATE"});
  },30000);
  it("denies foreign college, suspended and wrong-role cancellation",async()=>{
    const ctx=f!.drive.learner.context;
    const bad:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of bad)await expect(actOnPlacementRequest(actor,requestId!,{action:"CANCEL"}))
      .rejects.toBeDefined();
  },30000);
});