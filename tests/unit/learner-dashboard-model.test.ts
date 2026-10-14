import { describe, expect, it } from "vitest";
import { learnerPlacementDashboard, type PlacementDashboardRound } from "@/modules/placements/learner-dashboard-model";

const now = new Date("2026-10-13T00:00:00Z");
const round = (
  id: string, kind: string, when: string,
  exception: PlacementDashboardRound["exception"] = null,
): PlacementDashboardRound => ({
  applicationId: "app-1", roundId: id, roundKind: kind, roundName: id,
  roleTitle: "Engineer", companyName: "Employer",
  scheduledAt: new Date(when), exception,
});
const empty = { jobs: [], applications: [], rounds: [], offers: [] };

describe("Learner placement dashboard summary and priority", () => {
  it("renders a real first-run browse action with zero counts", () => {
    const state = learnerPlacementDashboard(empty, now);
    expect(state.firstRun).toBe(true);
    expect(state.nextAction.href).toBe("/learn/my-placements/jobs");
    expect(state.openJobCount).toBe(0);
    expect(state.weekEvents).toEqual([]);
  });

  it("prioritizes a soon assessment over an earlier interview", () => {
    const state = learnerPlacementDashboard({
      ...empty, rounds: [
        round("interview", "INTERVIEW", "2026-10-14T10:00:00Z"),
        round("test", "VENDOR_TEST", "2026-10-15T10:00:00Z"),
      ],
    }, now);
    expect(state.nextAction.title).toBe("test");
    expect(state.nextAction.href).toBe(
      "/learn/my-placements/assessments?applicationId=app-1&roundId=test");
    expect(state.weekEvents.map((event) => event.roundId)).toEqual(["interview", "test"]);
  });

  it("surfaces the nearest scheduled own assessment even when interview occurs first",()=>{
    const state=learnerPlacementDashboard({...empty,rounds:[
      round("first-interview","INTERVIEW","2026-10-14T08:00:00Z"),
      round("second-test","TEST","2026-10-15T08:00:00Z"),
      round("third-test","VENDOR_TEST","2026-10-16T08:00:00Z"),
    ]},now);
    expect(state.urgentAssessment?.roundId).toBe("second-test");
    expect(state.urgentAssessment?.href).toContain("/assessments?applicationId=app-1&roundId=second-test");
  });
  it("keeps interview priority when assessments are outside the urgent week", () => {
    const state = learnerPlacementDashboard({
      ...empty, rounds: [
        round("test", "TEST", "2026-11-15T10:00:00Z"),
        round("interview", "GD", "2026-10-14T10:00:00Z"),
      ],
    }, now);
    expect(state.nextAction.title).toBe("interview");
    expect(state.nextAction.href).toContain("applicationId=app-1&roundId=interview");
  });

  it("exposes the earliest interview independently from the assessment hero",()=>{
    const state=learnerPlacementDashboard({...empty,rounds:[
      round("test","TEST","2026-10-14T08:00:00Z"),
      round("late-interview","GD","2026-10-16T08:00:00Z"),
      round("early-interview","INTERVIEW","2026-10-15T08:00:00Z"),
    ]},now);
    expect(state.nextAction.title).toBe("test");
    expect(state.urgentInterview?.roundId).toBe("early-interview");
    expect(state.urgentInterview?.href).toBe("/learn/my-placements/interviews?applicationId=app-1&roundId=early-interview");
  });
  it("retains the actual chronologically next scheduled event even when hero prefers a later test",()=>{
    const result=learnerPlacementDashboard({...empty,rounds:[
      round("earlier","GD","2026-10-14T08:00:00Z"),
      round("later","TEST","2026-10-15T08:00:00Z"),
    ]},now);
    expect(result.nextAction.title).toBe("later");
    expect(result.nextScheduledEvent?.roundId).toBe("earlier");
    expect(result.nextScheduledEvent?.href).toContain("/interviews?");
  });
  it("respects an approved reschedule and ignores past or unscheduled events", () => {
    const state = learnerPlacementDashboard({
      ...empty, rounds: [
        round("past", "TEST", "2026-10-12T10:00:00Z"),
        round("rescheduled", "INTERVIEW", "2026-10-12T10:00:00Z",
          { scheduledAt: new Date("2026-10-14T10:00:00Z") }),
        { ...round("no-slot", "TEST", "2026-10-16T10:00:00Z"), scheduledAt: null },
      ],
    }, now);
    expect(state.weekEvents.map((event) => event.roundId)).toEqual(["rescheduled"]);
    expect(state.weekEvents[0]?.rescheduled).toBe(true);
  });

  it("shows the true number of near-term attention rounds despite a three-item preview",()=>{
    const events=[1,2,3,4,5].map(n=>round("urgent-"+n,
      n%2===0?"INTERVIEW":"TEST","2026-10-14T10:00:00Z"));
    const state=learnerPlacementDashboard({...empty,rounds:events},now);
    expect(state.needsAttention).toHaveLength(3);
    expect(state.fullAttentionCount).toBe(5);
    expect(state.fullWeekEventCount).toBe(5);
  });
  it("distinguishes published before deadline from learner actionability across duplicate role options",()=>{
    const result=learnerPlacementDashboard({...empty,jobs:[
      {jobId:"one",deadlinePassed:false,canApply:false},
      {jobId:"one",deadlinePassed:false,canApply:true},
      {jobId:"two",deadlinePassed:false,canApply:false},
      {jobId:"three",deadlinePassed:true,canApply:true},
    ]},now);
    expect(result.openJobCount).toBe(2);
    expect(result.eligibleToApplyCount).toBe(1);
    expect(result.notOpenToApplyJobCount).toBe(1);
  });
  it("does not inflate job or application counts from multiple roles", () => {
    const state = learnerPlacementDashboard({
      ...empty,
      jobs: [
        { jobId: "job-1", deadlinePassed: false, canApply: true },
        { jobId: "job-1", deadlinePassed: false, canApply: true },
        { jobId: "job-2", deadlinePassed: true, canApply: false },
      ],
      applications: [
        { applicationId: "a-1", applicationStatus: "SUBMITTED", screeningStatus: "UNDER_REVIEW" },
        { applicationId: "a-1", applicationStatus: "SUBMITTED", screeningStatus: "UNDER_REVIEW" },
      ],
    }, now);
    expect(state.openJobCount).toBe(1);
    expect(state.eligibleToApplyCount).toBe(1);
    expect(state.applicationCount).toBe(1);
  });

  it("puts a genuinely expiring issued offer ahead of a scheduled interview", () => {
    const state=learnerPlacementDashboard({
      ...empty,
      rounds:[round("interview","INTERVIEW","2026-10-13T03:00:00Z")],
      offers:[{status:"ISSUED",expiresAt:new Date("2026-10-13T02:00:00Z")}],
    },now);
    expect(state.nextAction.href).toBe("/learn/my-placements/offers?status=pending");
    expect(state.nextAction.label).toBe("Offer decision due soon");
  });
  it("ignores already expired offers in actionable count",()=>{
    const state=learnerPlacementDashboard({...empty,offers:[
      {status:"ISSUED",expiresAt:new Date("2026-10-12T00:00:00Z")},
      {status:"ISSUED",expiresAt:null},
    ]},now);
    expect(state.activeOfferCount).toBe(1);
  });
  it("counts only issued offers as actionable rather than treating accepted offers as pending", () => {
    const state = learnerPlacementDashboard({
      ...empty, offers: [
        { status: "ISSUED", expiresAt: null },
        { status: "ACCEPTED", expiresAt: null },
      ],
    }, now);
    expect(state.activeOfferCount).toBe(1);
  });
});

describe("L11-014 needs-attention ordering",()=>{
 it("shows the earliest effective schedule, not all assessments before interviews",()=>{
  const result=learnerPlacementDashboard({...empty,rounds:[
   round("later-test","TEST","2026-10-16T08:00:00Z"),
   round("early-interview","INTERVIEW","2026-10-14T08:00:00Z"),
   round("middle-test","VENDOR_TEST","2026-10-15T08:00:00Z"),
   round("late-interview","GD","2026-10-17T08:00:00Z"),
  ]},now);
  expect(result.needsAttention.map(x=>x.roundId)).toEqual([
   "early-interview","middle-test","later-test"
  ]);
  expect(result.fullAttentionCount).toBe(4);
  expect(result.nextAction.title).toBe("middle-test");
 });
 it("applies an approved reschedule before sorting its attention time",()=>{
  const result=learnerPlacementDashboard({...empty,rounds:[
   round("rescheduled","TEST","2026-10-14T08:00:00Z",
     {scheduledAt:new Date("2026-10-17T08:00:00Z")}),
   round("interview","INTERVIEW","2026-10-15T08:00:00Z"),
  ]},now);
  expect(result.needsAttention.map(x=>x.roundId)).toEqual(["interview","rescheduled"]);
 });
});
