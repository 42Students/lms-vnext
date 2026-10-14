import {Pool} from "pg";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {getLearnerPlacementRequestWorkspace} from "@/modules/placements/request-service";
import {readLearnerCalendarUrl,learnerCalendarSelectedEvents} from "@/modules/placements/learner-career-calendar-url-model";
import {learnerCareerDayChips} from "@/modules/placements/learner-career-day-chips-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCareerCalendarFixture,seedLearnerCareerCalendarFixture,cleanupLearnerCareerCalendarFixture,type LearnerCareerCalendarFixture} from "../support/learner-career-calendar-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerCareerCalendarFixture;
beforeEach(async()=>{fixture=newLearnerCareerCalendarFixture();await seedLearnerCareerCalendarFixture(pool,fixture);},45000);
afterEach(async()=>{await cleanupLearnerCareerCalendarFixture(pool,fixture);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
describe("calendar URL filters over persisted own rounds",()=>{
  it("filters actual own interview at its IST date with genuine filtered-empty",async()=>{
    const workspace=await getLearnerPlacementRequestWorkspace(fixture.drive.learner.context);
    const rows=workspace.rounds.map(x=>({...x,scheduledAt:x.scheduledAt?.toISOString()??null,exception:x.exception?{scheduledAt:x.exception.scheduledAt.toISOString()}:null}));
    const state=readLearnerCalendarUrl("date=2026-10-17&view=day&kind=INTERVIEW&collegeId=foreign","2026-10-14");
    expect(learnerCalendarSelectedEvents(rows,state).map(x=>x.roundId)).toEqual([fixture.roundId]);
    expect(learnerCalendarSelectedEvents(rows,{...state,kind:"ASSESSMENT"})).toHaveLength(0);
  },30000);
  it("shows only own persisted round labels in month/week cell chips",async()=>{
    const workspace=await getLearnerPlacementRequestWorkspace(fixture.drive.learner.context);
    const rows=workspace.rounds.map(x=>({...x,scheduledAt:x.scheduledAt?.toISOString()??null,exception:x.exception?{scheduledAt:x.exception.scheduledAt.toISOString()}:null}));
    const selected=learnerCalendarSelectedEvents(rows,{date:"2026-10-17",view:"week",kind:"INTERVIEW"});
    const chips=learnerCareerDayChips(selected);
    expect(chips.visible.map(x=>x.key)).toEqual([fixture.drive.applicationId+":"+fixture.roundId]);
    expect(chips.hidden).toBe(0);
    const foreign:RequestContext={...fixture.drive.learner.context,membership:{...fixture.drive.learner.context.membership!,collegeId:SEED_IDS.collegeB}};
    await expect(getLearnerPlacementRequestWorkspace(foreign)).rejects.toBeDefined();
  },30000);
  it("denies foreign college, persisted suspended learner and wrong role",async()=>{
    const ctx=fixture.drive.learner.context;
    const bad:RequestContext[]=[{...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},{...ctx,membership:{...ctx.membership!,roles:["TPO"]}}];
    for(const actor of bad)await expect(getLearnerPlacementRequestWorkspace(actor)).rejects.toBeDefined();
    await pool.query("UPDATE college_memberships SET status='SUSPENDED',suspended_at=now() WHERE id=$1",[fixture.drive.learner.ids.membership]);
    try{await expect(getLearnerPlacementRequestWorkspace(ctx)).rejects.toBeDefined();}
    finally{await pool.query("UPDATE college_memberships SET status='ACTIVE',suspended_at=NULL WHERE id=$1",[fixture.drive.learner.ids.membership]);}
  },30000);
});
