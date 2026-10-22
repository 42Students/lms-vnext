import { describe, expect, it } from "vitest";
import {
  DEFAULT_LEARNER_JOB_FILTERS,
  filterLearnerPlacementJobs,
  learnerClosingSoonQuerySchema,
} from "@/modules/placements/learner-jobs-browse-model";

const snapshot = Date.parse("2026-10-14T00:00:00Z");
function job(id: string, deadline: string | null, deadlinePassed = false) {
  return {
    job: {
      id, title: "Drive", description: "Test drive",
      applicationDeadline: deadline,
    },
    company: { name: "Employer" },
    roleOption: {
      id, title: id,
      employmentType: "FULL_TIME",
      locations: ["Hyderabad"],
      minimumAnnualCtcInr: null,
      maximumAnnualCtcInr: null,
    },
    canApply: true,
    deadlinePassed,
  };
}

describe("Own published drive closing-soon filter", () => {
  const rows = [
    job("within", "2026-10-15T00:00:00Z"),
    job("boundary", "2026-10-21T18:29:59.999Z"),
    job("beyond", "2026-10-21T18:30:00Z"),
    job("expired", "2026-10-13T23:59:59Z", true),
    job("unscheduled", null),
  ];

  it("selects non-expired deadlines through the seventh future IST calendar-day end", () => {
    const matches = filterLearnerPlacementJobs(
      rows,
      { ...DEFAULT_LEARNER_JOB_FILTERS, closingSoon: true },
      snapshot,
    );
    expect(matches.map((item) => item.job.id)).toEqual(["within", "boundary"]);
  });

  it("does not classify unknown-clock values as closing soon", () => {
    expect(filterLearnerPlacementJobs(
      rows,
      { ...DEFAULT_LEARNER_JOB_FILTERS, closingSoon: true },
    )).toEqual([]);
  });

  it("combines with authoritative eligible-only filtering without changing rows", () => {
    const subset = [
      { ...rows[0]!, canApply: false },
      rows[1]!,
    ];
    expect(filterLearnerPlacementJobs(subset, {
      ...DEFAULT_LEARNER_JOB_FILTERS,
      closingSoon: true,
      eligibleOnly: true,
    }, snapshot).map((item) => item.job.id)).toEqual(["boundary"]);
    expect(rows).toHaveLength(5);
  });

  it("validates URL toggle without treating arbitrary query values as true", () => {
    expect(learnerClosingSoonQuerySchema.safeParse("1").success).toBe(true);
    for (const value of ["0", "", "true", "all", null]) {
      expect(learnerClosingSoonQuerySchema.safeParse(value).success).toBe(false);
    }
  });
});
