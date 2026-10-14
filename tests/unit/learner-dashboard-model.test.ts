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
