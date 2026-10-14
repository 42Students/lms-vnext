import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerPlacementRequestWorkspace} from "@/modules/placements/request-service";
import {learnerInterviewCalendarArtifacts} from "@/modules/placements/learner-interview-calendar-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCareerCalendarFixture,seedLearnerCareerCalendarFixture,
cleanupLearnerCareerCalendarFixture,type LearnerCareerCalendarFixture}
from "../support/learner-career-calendar-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerCareerCalendarFixture|null=null;
beforeEach(async()=>{
fixture=newLearnerCareerCalendarFixture();await seedLearnerCareerCalendarFixture(pool,fixture);
await pool.query("UPDATE placement_job_rounds SET duration_minutes=45 WHERE id=$1",[fixture.roundId]);
},45000);
afterEach(async()=>{const f=fixture;fixture=null;if(f)await cleanupLearnerCareerCalendarFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("L16-009 owned persisted learner interview calendar file",()=>{
it("exports exact persisted start and duration in UTC without private meeting link",async()=>{
const f=fixture!,data=await getLearnerPlacementRequestWorkspace(f.drive.learner.context);
const record=data.rounds.find(row=>row.roundId===f.roundId);
expect(record).toBeDefined();
const row=JSON.parse(JSON.stringify(record)) as {
applicationId:string;roundId:string;companyName:string;roleTitle:string;
roundName:string;scheduledAt:string|null;durationMinutes:number|null;
venue:string|null;mode:string|null;};
const exported=learnerInterviewCalendarArtifacts({
applicationId:row.applicationId,roundId:row.roundId,
companyName:row.companyName,roleTitle:row.roleTitle,
roundName:row.roundName,scheduledAt:row.scheduledAt,
durationMinutes:row.durationMinutes,venue:row.venue,
mode:row.mode==="VIRTUAL"?"VIRTUAL":row.mode==="ON_CAMPUS"?"ON_CAMPUS":null,
},new Date("2026-10-14T00:00:00Z"));
expect(exported?.ics).toContain("DTSTART:20261016T184500Z");
expect(exported?.ics).toContain("DTEND:20261016T193000Z");
expect(exported?.ics).toContain("CALSCALE:GREGORIAN");
expect(exported?.ics).not.toContain("calendar.example.test/interview");
},30000);
it("denies forged college, suspended membership and wrong role",async()=>{
const ctx=fixture!.drive.learner.context;const actors:RequestContext[]=[
{...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
{...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
{...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
];
for(const actor of actors)await expect(getLearnerPlacementRequestWorkspace(actor)).rejects.toBeDefined();
},30000);
});