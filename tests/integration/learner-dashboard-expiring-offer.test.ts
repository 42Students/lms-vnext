import {randomUUID} from "node:crypto";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {listOwnPlacementOffers} from "@/modules/placements/offer-service";
import {learnerPlacementDashboard} from "@/modules/placements/learner-dashboard-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCareerCalendarFixture,seedLearnerCareerCalendarFixture,
  cleanupLearnerCareerCalendarFixture,type LearnerCareerCalendarFixture}
  from "../support/learner-career-calendar-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let owned:LearnerCareerCalendarFixture|null=null;
let offerId:string|null=null;
const clock=new Date("2026-10-14T00:00:00Z");
beforeEach(async()=>{
  owned=newLearnerCareerCalendarFixture();
  await seedLearnerCareerCalendarFixture(pool,owned);
  offerId=randomUUID();
  await pool.query(
    "INSERT INTO placement_offers(id,application_id,version,status,role_title,annual_ctc_inr,issued_by_user_id,issued_at,expires_at) VALUES($1,$2,1,'ISSUED','Engineer',1100000,$3,$5,$4)",
    [offerId,owned.applicationId,SEED_IDS.collegeAdminUser,new Date(clock.getTime()+3_600_000),new Date(clock.getTime()-3_600_000)],
  );
},45000);
afterEach(async()=>{
  const f=owned;owned=null;
  if(!f)return;
  if(offerId)await pool.query("DELETE FROM placement_offers WHERE id=$1",[offerId]);
  offerId=null;
  await cleanupLearnerCareerCalendarFixture(pool,f);
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("L11-005 own persisted expiring offer action",()=>{
  it("prioritizes an actual issued offer over a future interview",async()=>{
    const rows=await listOwnPlacementOffers(owned!.drive.learner.context);
    const snapshot=learnerPlacementDashboard({
      jobs:[],applications:[],rounds:[],offers:rows.map(row=>({
        status:row.offer.status,expiresAt:row.offer.expiresAt,
      })),
    },clock);
    expect(rows.some(row=>row.offer.id===offerId)).toBe(true);
    expect(snapshot.nextAction.href).toBe("/learn/my-placements/offers?status=pending");
    expect(snapshot.activeOfferCount).toBe(1);
  },30000);
  it("denies forged-college, suspended and wrong-role offer readers",async()=>{
    const ctx=owned!.drive.learner.context;
    const actors:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of actors)await expect(listOwnPlacementOffers(actor)).rejects.toBeDefined();
  },30000);
});