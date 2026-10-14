import { describe, expect, it } from "vitest";
import {
  buildLearnerRecentPlacementActivity,
  type LearnerActivityJourney,
} from "@/modules/placements/learner-recent-placement-activity-model";

const journey: LearnerActivityJourney = {
  applicationId: "application-1",
  job: { title: "Engineer" },
  company: { name: "Acme" },
  submittedAt: new Date("2026-10-01T00:00:00Z"),
  withdrawnAt: null,
  screening: { status: "SHORTLISTED", decidedAt: new Date("2026-10-03T00:00:00Z") },
  results: [{
    resultId: "result-1",
    roundName: "Technical round",
    outcome: "PASS",
    appliedAt: new Date("2026-10-05T00:00:00Z"),
  }],
};

describe("Recent learner placement activity", () => {
  it("sorts actual timestamps newest-first without changing inputs", () => {
    const source = Object.freeze([journey]);
    const events = buildLearnerRecentPlacementActivity(source);
    expect(events.map((event) => event.heading)).toEqual([
      "Technical round: pass",
      "Screening shortlisted",
      "Application submitted",
    ]);
    expect(events.every((event) => event.href.includes("application-1"))).toBe(true);
    expect(source[0]?.results).toHaveLength(1);
  });
  it("excludes staged outcomes and nonterminal screening decisions", () => {
    const events = buildLearnerRecentPlacementActivity([{
      ...journey,
      screening: { status: "UNDER_REVIEW", decidedAt: null },
      results: [{ ...journey.results[0]!, appliedAt: null }],
    }]);
    expect(events.map((event) => event.heading)).toEqual(["Application submitted"]);
  });
  it("shows a withdrawn event only when a real withdrawal timestamp exists", () => {
    const events = buildLearnerRecentPlacementActivity([{
      ...journey,
      withdrawnAt: new Date("2026-10-06T00:00:00Z"),
      results: [],
    }]);
    expect(events[0]?.heading).toBe("Application withdrawn");
    expect(events[0]?.occurredAt.toISOString()).toBe("2026-10-06T00:00:00.000Z");
  });
  it("caps recent entries without fabricating missing activity", () => {
    expect(buildLearnerRecentPlacementActivity([])).toEqual([]);
    expect(buildLearnerRecentPlacementActivity([journey], 1)).toHaveLength(1);
    expect(buildLearnerRecentPlacementActivity([journey], 0)).toEqual([]);
  });
});
