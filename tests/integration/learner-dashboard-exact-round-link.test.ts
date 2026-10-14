import { randomUUID } from "node:crypto";
import { afterAll,afterEach,beforeEach,describe,expect,it } from "vitest";
import { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { getLearnerPlacementRequestWorkspace } from "@/modules/placements/request-service";
import { resolveOwnAssessmentDeepLink } from "@/modules/placements/learner-assessment-deeplink-model";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {
  newLearnerDriveReadFixture,seedLearnerDriveReadFixture,cleanupLearnerDriveReadFixture,
  type LearnerDriveReadFixture,
} from "../support/learner-drive-read-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerDriveReadFixture|null=null;
let appId:string|null=null;
let roundId:string|null=null;
beforeEach(async()=>{
  fixture=newLearnerDriveReadFixture();
  await seedLearnerDriveReadFixture(pool,fixture);
  appId=randomUUID();roundId=randomUUID();
  const {ids,learner}=fixture;
  await pool.query(
    "INSERT INTO placement_applications(id,job_id,role_option_id,membership_id,channel,status,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES($1,$2,$3,$4,'INTERNAL','SUBMITTED','ELIGIBLE','{}'::jsonb,$5)",
    [appId,ids.newerJob,ids.newerRole,learner.ids.membership,learner.ids.user],
  );
  await pool.query(
    "INSERT INTO placement_application_screenings(application_id,status,decided_by_user_id,decided_at) VALUES($1,'SHORTLISTED',$2,now())",
    [appId,SEED_IDS.collegeAdminUser],
  );
  await pool.query(
    "INSERT INTO placement_job_rounds(id,job_id,sequence,kind,name,mode,scheduled_at,timezone,meeting_url,status,created_by_user_id) VALUES($1,$2,1,'TEST',$3,'VIRTUAL',$4,'Asia/Kolkata',$5,'SCHEDULED',$6)",
    [roundId,ids.newerJob,"Owned test "+roundId,new Date("2026-10-16T08:00:00Z"),
      "https://interview.example.test/test",SEED_IDS.collegeAdminUser],
  );
},45000);
afterEach(async()=>{
  const old=fixture;fixture=null;
  if(!old)return;
  try{
    if(roundId)await pool.query("DELETE FROM placement_job_rounds WHERE id=$1",[roundId]);
    if(appId){
      await pool.query("DELETE FROM placement_application_screenings WHERE application_id=$1",[appId]);
      await pool.query("DELETE FROM placement_applications WHERE id=$1",[appId]);
    }
    await cleanupLearnerDriveReadFixture(pool,old);
  } finally {roundId=null;appId=null;}
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("dashboard CTA opens owned persisted assessment only",()=>{
  it("resolves an exact persisted assessment, rejecting foreign and wrong-kind IDs",async()=>{
    const rows=await getLearnerPlacementRequestWorkspace(fixture!.learner.context);
    const own=rows.rounds;
    expect(own.some(row=>row.applicationId===appId && row.roundId===roundId)).toBe(true);
    expect(resolveOwnAssessmentDeepLink(own,{applicationId:appId,roundId}))
      .toEqual({valid:true,key:appId+":"+roundId});
    expect(resolveOwnAssessmentDeepLink(own,{applicationId:randomUUID(),roundId}))
      .toEqual({valid:false});
  },30000);
  it("denies forged college, suspended membership and wrong role before disclosing rounds",async()=>{
    const context=fixture!.learner.context;
    const denied:RequestContext[]=[
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of denied)
      await expect(getLearnerPlacementRequestWorkspace(actor)).rejects.toBeDefined();
  },30000);
});
