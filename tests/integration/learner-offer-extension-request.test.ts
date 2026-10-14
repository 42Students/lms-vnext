import {randomUUID} from "node:crypto";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {createPlacementRequest} from "@/modules/placements/request-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCareerCalendarFixture,seedLearnerCareerCalendarFixture,
cleanupLearnerCareerCalendarFixture,type LearnerCareerCalendarFixture}
from "../support/learner-career-calendar-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let f:LearnerCareerCalendarFixture|null=null,offerId:string|null=null,requestId:string|null=null;
const expires="2030-11-01T00:00:00.000Z";
beforeEach(async()=>{
  f=newLearnerCareerCalendarFixture();await seedLearnerCareerCalendarFixture(pool,f);
  offerId=randomUUID();
  await pool.query(
    "INSERT INTO placement_offers(id,application_id,version,status,role_title,annual_ctc_inr,issued_by_user_id,expires_at) VALUES($1,$2,1,'ISSUED','Engineer',1100000,$3,$4)",
    [offerId,f.applicationId,SEED_IDS.collegeAdminUser,expires],
  );
},45000);
afterEach(async()=>{
  const own=f;f=null;
  if(requestId)await pool.query("DELETE FROM placement_learner_requests WHERE id=$1",[requestId]);
  requestId=null;
  if(offerId)await pool.query("DELETE FROM placement_offers WHERE id=$1",[offerId]);
  offerId=null;if(own)await cleanupLearnerCareerCalendarFixture(pool,own);
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("learner issued-offer expiry extension request on real PostgreSQL",()=>{
  const command=()=>({requestType:"OFFER_EXTENSION" as const,
    applicationId:f!.applicationId,offerId:offerId!,reason:"University exam overlaps deadline",
    requestedExpiresAt:"2030-11-04T00:00:00Z",expectedExpiresAt:expires});
  it("rejects stale expiry and writes one audited own request without changing offer",async()=>{
    await expect(createPlacementRequest(f!.drive.learner.context,{
      ...command(),expectedExpiresAt:"2030-10-01T00:00:00Z",
    })).rejects.toMatchObject({code:"PLACEMENT_REQUEST_EFFECT_INVALID"});
    const created=await createPlacementRequest(f!.drive.learner.context,command());
    requestId=created.id;
    expect(created.status).toBe("PENDING");
    const offers=await pool.query<{expires_at:Date}>(
      "SELECT expires_at FROM placement_offers WHERE id=$1",[offerId]);
    expect(offers.rows[0]?.expires_at.toISOString()).toBe(expires);
    const audit=await pool.query<{total:string}>(
      "SELECT count(*)::text AS total FROM activity_events WHERE subject_id=$1 AND event_type='placements.request.submitted'",
      [created.id]);
    expect(audit.rows[0]?.total).toBe("1");
  },30000);
  it("denies forged college, suspended and wrong-role request authors",async()=>{
    const ctx=f!.drive.learner.context;
    const denied:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of denied)await expect(createPlacementRequest(actor,command())).rejects.toBeDefined();
  },30000);
});