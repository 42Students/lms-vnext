import {Pool} from "pg";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {getOwnInterviewWithdrawalTargets,requestOwnInterviewWithdrawal} from "@/modules/placements/learner-interview-withdrawal-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCareerCalendarFixture,seedLearnerCareerCalendarFixture,cleanupLearnerCareerCalendarFixture,type LearnerCareerCalendarFixture} from "../support/learner-career-calendar-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerCareerCalendarFixture;
beforeEach(async()=>{fixture=newLearnerCareerCalendarFixture();await seedLearnerCareerCalendarFixture(pool,fixture);},45000);
afterEach(async()=>{
  await pool.query("DELETE FROM placement_learner_requests WHERE application_id=$1",[fixture.applicationId]);
  await cleanupLearnerCareerCalendarFixture(pool,fixture);
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
async function input(){const [target]=await getOwnInterviewWithdrawalTargets(fixture.drive.learner.context);return {applicationId:target.applicationId,roundId:target.roundId,expectedUpdatedAt:target.expectedUpdatedAt,reason:"Exam conflict",confirmed:true};}
describe("own interview application withdrawal request",()=>{
  it("records pending audited request without withdrawing application or closing round",async()=>{
    const value=await input();
    const request=await requestOwnInterviewWithdrawal(fixture.drive.learner.context,value);
    expect(request).toMatchObject({applicationId:fixture.applicationId,status:"PENDING",requestType:"APPLICATION_WITHDRAWAL"});
    expect((await getOwnInterviewWithdrawalTargets(fixture.drive.learner.context))[0].pending).toBe(true);
    expect((await pool.query("SELECT status FROM placement_applications WHERE id=$1",[fixture.applicationId])).rows[0].status).toBe("SUBMITTED");
    expect((await pool.query("SELECT status FROM placement_job_rounds WHERE id=$1",[fixture.roundId])).rows[0].status).toBe("SCHEDULED");
    expect((await pool.query("SELECT actor_user_id FROM activity_events WHERE subject_id=$1",[request.id])).rows[0].actor_user_id).toBe(fixture.drive.learner.ids.user);
  },30000);
  it("rejects stale application token and foreign round before request/audit",async()=>{
    const value=await input();
    await pool.query("UPDATE placement_applications SET updated_at=updated_at+interval '1 second' WHERE id=$1",[fixture.applicationId]);
    await expect(requestOwnInterviewWithdrawal(fixture.drive.learner.context,value)).rejects.toMatchObject({code:"PLACEMENT_REQUEST_STALE"});
    await expect(requestOwnInterviewWithdrawal(fixture.drive.learner.context,{...value,roundId:SEED_IDS.collegeB})).rejects.toBeDefined();
    expect((await pool.query("SELECT id FROM placement_learner_requests WHERE application_id=$1",[fixture.applicationId])).rowCount).toBe(0);
  },30000);
  it("denies forged college, persisted suspension, wrong role without leaking targets",async()=>{
    const value=await input(),ctx=fixture.drive.learner.context;
    const denied:RequestContext[]=[{...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},{...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}}];
    for(const actor of denied){
      await expect(getOwnInterviewWithdrawalTargets(actor)).rejects.toBeDefined();
      await expect(requestOwnInterviewWithdrawal(actor,value)).rejects.toBeDefined();
    }
    await pool.query("UPDATE college_memberships SET status='SUSPENDED',suspended_at=now() WHERE id=$1",[fixture.drive.learner.ids.membership]);
    try{await expect(requestOwnInterviewWithdrawal(ctx,value)).rejects.toBeDefined();}
    finally{await pool.query("UPDATE college_memberships SET status='ACTIVE',suspended_at=NULL WHERE id=$1",[fixture.drive.learner.ids.membership]);}
    expect((await pool.query("SELECT id FROM placement_learner_requests WHERE application_id=$1",[fixture.applicationId])).rowCount).toBe(0);
  },30000);
});
