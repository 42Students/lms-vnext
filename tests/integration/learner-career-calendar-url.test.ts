import {Pool} from "pg";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {getLearnerPlacementRequestWorkspace} from "@/modules/placements/request-service";
import {readLearnerCalendarUrl,learnerCalendarSelectedEvents} from "@/modules/placements/learner-career-calendar-url-model";
import {learnerCareerDayChips} from "@/modules/placements/learner-career-day-chips-model";
import {learnerCareerKindCounts} from "@/modules/placements/learner-career-kind-count-model";
import {learnerCareerWeekDays} from "@/modules/placements/learner-career-week-days-model";
import {learnerCareerDayTimeline} from "@/modules/placements/learner-career-day-timeline-model";
import {learnerCareerNavigationDate} from "@/modules/placements/learner-career-navigation-model";
import {learnerCareerSelectedPeriodIcal} from "@/modules/placements/learner-career-period-export-model";
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
  it("exports only own persisted interview rounds from the selected IST date range",async()=>{
    const workspace=await getLearnerPlacementRequestWorkspace(fixture.drive.learner.context);
    const rows=workspace.rounds.map(x=>({...x,scheduledAt:x.scheduledAt?.toISOString()??null,exception:x.exception?{scheduledAt:x.exception.scheduledAt.toISOString()}:null}));
    const own=learnerCalendarSelectedEvents(rows,{date:"2026-10-17",view:"day",kind:"INTERVIEW"});
    const exportData=learnerCareerSelectedPeriodIcal(own,"2026-10-17","day",new Date("2026-10-15T00:00:00Z"));
    expect(exportData.count).toBe(1);
    expect(exportData.ical).toContain("DTSTART:20261016T184500Z");
    expect(exportData.ical).not.toContain("calendar.example.test");
    expect(learnerCareerSelectedPeriodIcal(own,"2026-10-16","day",new Date()).count).toBe(0);
    const foreign:RequestContext={...fixture.drive.learner.context,membership:{...fixture.drive.learner.context.membership!,collegeId:SEED_IDS.collegeB}};
    await expect(getLearnerPlacementRequestWorkspace(foreign)).rejects.toBeDefined();
  },30000);
  it("retains tenant-safe calendar after bounded navigation and invalid edge controls",async()=>{
    const workspace=await getLearnerPlacementRequestWorkspace(fixture.drive.learner.context);
    const rows=workspace.rounds.map(x=>({...x,scheduledAt:x.scheduledAt?.toISOString()??null,exception:x.exception?{scheduledAt:x.exception.scheduledAt.toISOString()}:null}));
    const next=learnerCareerNavigationDate("2026-10-16","day",1);
    expect(next).toBe("2026-10-17");
    expect(learnerCalendarSelectedEvents(rows,{date:next!,view:"day",kind:"INTERVIEW"}).map(x=>x.roundId)).toEqual([fixture.roundId]);
    expect(learnerCareerNavigationDate("2100-12-31","day",1)).toBeNull();
    const wrong:RequestContext={...fixture.drive.learner.context,membership:{...fixture.drive.learner.context.membership!,roles:["TPO"]}};
    await expect(getLearnerPlacementRequestWorkspace(wrong)).rejects.toBeDefined();
  },30000);
  it("builds selected IST day timeline from learner-authorized persisted rounds",async()=>{
    const workspace=await getLearnerPlacementRequestWorkspace(fixture.drive.learner.context);
    const rows=workspace.rounds.map(x=>({...x,scheduledAt:x.scheduledAt?.toISOString()??null,exception:x.exception?{scheduledAt:x.exception.scheduledAt.toISOString()}:null}));
    const selected=learnerCalendarSelectedEvents(rows,{date:"2026-10-17",view:"day",kind:"ALL"});
    const timeline=learnerCareerDayTimeline(selected,"2026-10-17");
    expect(timeline.events.map(x=>x.roundId)).toEqual([fixture.roundId]);
    expect(learnerCareerDayTimeline(selected,"2026-10-16").events).toHaveLength(0);
    const wrong:RequestContext={...fixture.drive.learner.context,membership:{...fixture.drive.learner.context.membership!,roles:["TPO"]}};
    await expect(getLearnerPlacementRequestWorkspace(wrong)).rejects.toBeDefined();
  },30000);
  it("renders seven mobile days with actual own interview and honest empty days",async()=>{
    const workspace=await getLearnerPlacementRequestWorkspace(fixture.drive.learner.context);
    const rows=workspace.rounds.map(x=>({...x,scheduledAt:x.scheduledAt?.toISOString()??null,exception:x.exception?{scheduledAt:x.exception.scheduledAt.toISOString()}:null}));
    const events=learnerCalendarSelectedEvents(rows,{date:"2026-10-17",view:"week",kind:"ALL"});
    const days=learnerCareerWeekDays("2026-10-12",events);
    expect(days).toHaveLength(7);
    expect(days.find(x=>x.dayKey==="2026-10-17")?.events[0]?.roundId).toBe(fixture.roundId);
    expect(days.find(x=>x.dayKey==="2026-10-12")?.events).toHaveLength(0);
    const foreign:RequestContext={...fixture.drive.learner.context,membership:{...fixture.drive.learner.context.membership!,collegeId:SEED_IDS.collegeB}};
    await expect(getLearnerPlacementRequestWorkspace(foreign)).rejects.toBeDefined();
  },30000);
  it("summarizes own month events by persisted kind",async()=>{
    const workspace=await getLearnerPlacementRequestWorkspace(fixture.drive.learner.context);
    const rows=workspace.rounds.map(x=>({...x,scheduledAt:x.scheduledAt?.toISOString()??null,exception:x.exception?{scheduledAt:x.exception.scheduledAt.toISOString()}:null}));
    const counts=learnerCareerKindCounts(learnerCalendarSelectedEvents(rows,{date:"2026-10-17",view:"month",kind:"ALL"}));
    expect(counts).toEqual({total:1,assessments:0,interviews:1,other:0});
    const foreign:RequestContext={...fixture.drive.learner.context,membership:{...fixture.drive.learner.context.membership!,collegeId:SEED_IDS.collegeB}};
    await expect(getLearnerPlacementRequestWorkspace(foreign)).rejects.toBeDefined();
  },30000);
  it("selects persisted learner rounds in rolling 30-day agenda, not the whole month",async()=>{
    const ctx=fixture.drive.learner.context;
    const workspace=await getLearnerPlacementRequestWorkspace(ctx);
    const rows=workspace.rounds.map(x=>({...x,scheduledAt:x.scheduledAt?.toISOString()??null,exception:x.exception?{scheduledAt:x.exception.scheduledAt.toISOString()}:null}));
    expect(learnerCalendarSelectedEvents(rows,{date:"2026-10-15",view:"agenda",kind:"INTERVIEW"}).map(x=>x.roundId)).toEqual([fixture.roundId]);
    expect(learnerCalendarSelectedEvents(rows,{date:"2026-10-18",view:"agenda",kind:"INTERVIEW"})).toHaveLength(0);
    const foreign:RequestContext={...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}};
    await expect(getLearnerPlacementRequestWorkspace(foreign)).rejects.toBeDefined();
  },30000);
  it("shows only own persisted round labels in month/week cell chips",async()=>{
    const workspace=await getLearnerPlacementRequestWorkspace(fixture.drive.learner.context);
    const rows=workspace.rounds.map(x=>({...x,scheduledAt:x.scheduledAt?.toISOString()??null,exception:x.exception?{scheduledAt:x.exception.scheduledAt.toISOString()}:null}));
    const selected=learnerCalendarSelectedEvents(rows,{date:"2026-10-17",view:"week",kind:"INTERVIEW"});
    const chips=learnerCareerDayChips(selected);
    expect(chips.visible.map(x=>x.key)).toEqual([fixture.applicationId+":"+fixture.roundId]);
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
