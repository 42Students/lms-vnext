import {randomUUID} from "node:crypto";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getOwnLearnerOfferBrowse} from "@/modules/placements/learner-offers-browse-service";
import {learnerOfferResponseTiming} from "@/modules/placements/learner-offer-response-timing-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerDriveReadFixture,seedLearnerDriveReadFixture,
  cleanupLearnerDriveReadFixture,type LearnerDriveReadFixture}
  from "../support/learner-drive-read-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:{drive:LearnerDriveReadFixture;applicationId:string;offerId:string}|null=null;
beforeEach(async()=>{
  const drive=newLearnerDriveReadFixture();
  fixture={drive,applicationId:randomUUID(),offerId:randomUUID()};
  await seedLearnerDriveReadFixture(pool,drive);
  await pool.query(
    "INSERT INTO placement_applications(id,job_id,role_option_id,membership_id,channel,status,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES($1,$2,$3,$4,'INTERNAL','SUBMITTED','ELIGIBLE','{}'::jsonb,$5)",
    [fixture.applicationId,drive.ids.newerJob,drive.ids.newerRole,
      drive.learner.ids.membership,drive.learner.ids.user],
  );
  await pool.query(
    "INSERT INTO placement_offers(id,application_id,version,status,role_title,annual_ctc_inr,issued_by_user_id,issued_at,expires_at) VALUES($1,$2,1,'ISSUED','Engineer',1000000,$3,'2026-01-01T00:00:00Z',$4)",
    [fixture.offerId,fixture.applicationId,SEED_IDS.collegeAdminUser,"2026-10-15T00:00:00Z"],
  );
},45000);
afterEach(async()=>{
  const f=fixture;fixture=null;if(!f)return;
  await pool.query("DELETE FROM placement_offers WHERE id=$1",[f.offerId]);
  await pool.query("DELETE FROM placement_applications WHERE id=$1",[f.applicationId]);
  await cleanupLearnerDriveReadFixture(pool,f.drive);
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("learner offer response timing from own persisted offer",()=>{
  it("reads own issued terms and derives urgency without changing offer status",async()=>{
    const f=fixture!;
    const own=await getOwnLearnerOfferBrowse(f.drive.learner.context,"pending");
    const row=own.items.find(x=>x.offer.id===f.offerId);
    expect(row).toBeDefined();
    const timing=learnerOfferResponseTiming({
      status:row!.offer.status,
      expiresAt:row!.offer.expiresAt?.toISOString()??null,
      issuedAt:row!.offer.issuedAt.toISOString(),
    },"2026-10-14T12:00:00Z");
    expect(timing).toMatchObject({canRespond:true,urgency:"SOON"});
    expect(own.counts.pending).toBeGreaterThanOrEqual(1);
  },30000);
  it("denies other college, suspension and wrong role",async()=>{
    const context=fixture!.drive.learner.context;
    const denied:RequestContext[]=[
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of denied)await expect(getOwnLearnerOfferBrowse(actor,"pending")).rejects.toBeDefined();
  },30000);
});
