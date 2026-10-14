import {randomUUID} from "node:crypto";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {listOwnPlacementRequests} from "@/modules/placements/request-service";
import {learnerPendingOfferExtensions}
from "@/modules/placements/learner-offer-pending-request-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCareerCalendarFixture,seedLearnerCareerCalendarFixture,
cleanupLearnerCareerCalendarFixture,type LearnerCareerCalendarFixture}
from "../support/learner-career-calendar-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerCareerCalendarFixture|null=null,offerId:string|null=null,requestId:string|null=null;
beforeEach(async()=>{
  fixture=newLearnerCareerCalendarFixture();await seedLearnerCareerCalendarFixture(pool,fixture);
  offerId=randomUUID();requestId=randomUUID();
  await pool.query(
    "INSERT INTO placement_offers(id,application_id,version,status,role_title,annual_ctc_inr,issued_by_user_id,expires_at) VALUES($1,$2,1,'ISSUED','Engineer',800000,$3,$4)",
    [offerId,fixture.applicationId,SEED_IDS.collegeAdminUser,"2030-11-01T00:00:00Z"],
  );
  await pool.query(
    "INSERT INTO placement_learner_requests(id,application_id,request_type,offer_id,scope_key,reason,requested_by_user_id) VALUES($1,$2,'OFFER_EXTENSION',$3,$4,$5,$6)",
    [requestId,fixture.applicationId,offerId,"OFFER_EXTENSION:"+fixture.applicationId+":"+offerId,
      "Need more time for exams",fixture.drive.learner.ids.user],
  );
},45000);
afterEach(async()=>{
  const own=fixture;fixture=null;
  if(requestId)await pool.query("DELETE FROM placement_learner_requests WHERE id=$1",[requestId]);
  requestId=null;
  if(offerId)await pool.query("DELETE FROM placement_offers WHERE id=$1",[offerId]);
  offerId=null;
  if(own)await cleanupLearnerCareerCalendarFixture(pool,own);
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("learner offer extension request pending read",()=>{
  it("shows exact own pending offer without inferring approval",async()=>{
    const rows=await listOwnPlacementRequests(fixture!.drive.learner.context);
    const pending=learnerPendingOfferExtensions(rows.map(row=>({
      offerId:row.request.offerId,status:row.request.status,requestType:row.request.requestType,
    })));
    expect(pending.has(offerId!)).toBe(true);
  },30000);
  it("denies foreign college, suspended and wrong-role principal",async()=>{
    const ctx=fixture!.drive.learner.context;
    const bad:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of bad)await expect(listOwnPlacementRequests(actor)).rejects.toBeDefined();
  },30000);
});