import {randomUUID} from "node:crypto";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getOwnLearnerSupportRequests} from "@/modules/placements/learner-support-request-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCareerCalendarFixture,seedLearnerCareerCalendarFixture,
cleanupLearnerCareerCalendarFixture,type LearnerCareerCalendarFixture}
from "../support/learner-career-calendar-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerCareerCalendarFixture|null=null,id:string|null=null;
beforeEach(async()=>{
  fixture=newLearnerCareerCalendarFixture();await seedLearnerCareerCalendarFixture(pool,fixture);
  id=randomUUID();
  await pool.query(
    "INSERT INTO placement_learner_requests(id,application_id,request_type,scope_key,reason,requested_by_user_id) VALUES($1,$2,'APPLICATION_WITHDRAWAL',$3,$4,$5)",
    [id,fixture.applicationId,"APPLICATION_WITHDRAWAL:"+fixture.applicationId,"Please review this request",fixture.drive.learner.ids.user],
  );
},45000);
afterEach(async()=>{
  const own=fixture;fixture=null;
  if(id)await pool.query("DELETE FROM placement_learner_requests WHERE id=$1",[id]);
  id=null;if(own)await cleanupLearnerCareerCalendarFixture(pool,own);
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("own authorized support request filtering and pagination",()=>{
  it("returns persisted own request under its real type/status",async()=>{
    const rows=await getOwnLearnerSupportRequests(fixture!.drive.learner.context,{
      type:"APPLICATION_WITHDRAWAL",status:"PENDING",page:1,
    });
    expect(rows.items.some(row=>row.request.id===id)).toBe(true);
    expect(rows.total).toBeGreaterThan(0);
    expect((await getOwnLearnerSupportRequests(fixture!.drive.learner.context,{type:"OFFER_EXTENSION"}))
      .items.some(row=>row.request.id===id)).toBe(false);
  },30000);
  it("denies forged college, suspended and wrong-role",async()=>{
    const ctx=fixture!.drive.learner.context;
    const denied:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of denied)await expect(getOwnLearnerSupportRequests(actor,{})).rejects.toBeDefined();
  },30000);
});