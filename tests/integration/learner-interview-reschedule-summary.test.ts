import {randomUUID} from "node:crypto";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerPlacementRequestWorkspace} from "@/modules/placements/request-service";
import {learnerInterviewRescheduleSummary} from "@/modules/placements/learner-interview-reschedule-summary-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCareerCalendarFixture,seedLearnerCareerCalendarFixture,
cleanupLearnerCareerCalendarFixture,type LearnerCareerCalendarFixture}
from "../support/learner-career-calendar-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerCareerCalendarFixture|null=null;let requestId:string|null=null;
beforeEach(async()=>{
fixture=newLearnerCareerCalendarFixture();await seedLearnerCareerCalendarFixture(pool,fixture);
const f=fixture;requestId=randomUUID();
const approved=new Date("2026-10-17T06:00:00Z");
await pool.query(
"INSERT INTO placement_learner_requests(id,application_id,learner_membership_id,request_type,round_id,scope_key,reason,effect_payload,status,requested_by_user_id,decided_by_user_id,decided_at) VALUES($1,$2,$8,'ROUND_RESCHEDULE',$3,$4,'Schedule adjustment', $5::jsonb,'APPROVED',$6,$7,now())",
[requestId,f.applicationId,f.roundId,"learner-reschedule-"+requestId,JSON.stringify({
scheduledAt:approved.toISOString(),timezone:"Asia/Kolkata",mode:"VIRTUAL",
meetingUrl:"https://calendar.example.test/new-interview",
}),f.drive.learner.ids.user,SEED_IDS.collegeAdminUser,f.drive.learner.ids.membership]);
await pool.query(
"INSERT INTO placement_application_round_exceptions(id,application_id,round_id,request_id,scheduled_at,timezone,mode,meeting_url) VALUES($1,$2,$3,$4,$5,'Asia/Kolkata','VIRTUAL',$6)",
[randomUUID(),f.applicationId,f.roundId,requestId,approved,"https://calendar.example.test/new-interview"]);
},45000);
afterEach(async()=>{
const f=fixture,id=requestId;fixture=null;requestId=null;
if(id){
await pool.query("DELETE FROM placement_application_round_exceptions WHERE request_id=$1",[id]);
await pool.query("DELETE FROM placement_learner_requests WHERE id=$1",[id]);
}
if(f)await cleanupLearnerCareerCalendarFixture(pool,f);
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("L16-015 approved persisted reschedule to own learner summary",()=>{
it("reports the approved exception, not the superseded interview date",async()=>{
const f=fixture!;
const data=await getLearnerPlacementRequestWorkspace(f.drive.learner.context);
const persisted=data.rounds.find(row=>row.roundId===f.roundId);
expect(persisted?.exception).toBeDefined();
const round=JSON.parse(JSON.stringify(persisted)) as {
companyName:string;roleTitle:string;roundName:string;scheduledAt:string|null;
exception:{scheduledAt:string;mode:"VIRTUAL"|"ON_CAMPUS";venue:string|null}|null;};
const summary=learnerInterviewRescheduleSummary({
companyName:round.companyName,roleTitle:round.roleTitle,roundName:round.roundName,
originalScheduledAt:round.scheduledAt,approvedScheduledAt:round.exception!.scheduledAt,
mode:round.exception!.mode,venue:round.exception!.venue,
});
expect(summary?.approved).toContain("17 Oct");
expect(summary?.copyText).not.toContain("calendar.example.test");
},30000);
it("rejects forged college, suspended and wrong-role principals",async()=>{
const ctx=fixture!.drive.learner.context;const actors:RequestContext[]=[
{...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
{...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
{...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
];
for(const actor of actors)await expect(getLearnerPlacementRequestWorkspace(actor)).rejects.toBeDefined();
},30000);
});