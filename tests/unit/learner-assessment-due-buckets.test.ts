import { describe, expect, it } from "vitest";
import {
  learnerAssessmentBucketForRound,
  learnerAssessmentDueBucketSchema,
  learnerAssessmentDueBuckets,
  filterLearnerAssessmentDueBucket,
} from "@/modules/placements/learner-assessment-due-buckets";
import type { LearnerRoundBrowseSource } from "@/modules/placements/learner-rounds-browse-model";

const now = Date.parse("2026-10-13T18:35:00Z"); // 2026-10-14 00:05 IST (Wed).
const base: LearnerRoundBrowseSource = {
  applicationId: "application-a",
  roundId: "round-a",
  roundKind: "TEST",
  roundName: "Assessment",
  companyName: "Example Employer",
  roleTitle: "Engineer",
  scheduledAt: "2026-10-13T18:40:00Z", // 2026-10-14 00:10 IST.
  exception: null,
};
const make = (roundId: string, scheduledAt: string | null) => ({
  ...base, roundId, scheduledAt,
});

describe("Learner assessment due buckets", () => {
  it("separates UTC-instants at the correct 18:30 UTC IST midnight rollover", () => {
    expect(learnerAssessmentBucketForRound(base, now)).toBe("today");
    // The same UTC date can contain late Tuesday and early Wednesday IST.
    expect(learnerAssessmentBucketForRound(
      make("before", "2026-10-13T18:29:00Z"), now,
    )).toBe("past");
    expect(learnerAssessmentBucketForRound(
      make("after", "2026-10-13T18:39:00Z"), now,
    )).toBe("today");
  });

  it("counts Monday-Sunday in IST, not a rolling 7 days or UTC week", () => {
    const sunday = make("sunday", "2026-10-18T18:29:00Z"); // Sunday 23:59 IST.
    const monday = make("monday", "2026-10-18T18:30:00Z"); // Monday 00:00 IST.
    expect(learnerAssessmentBucketForRound(sunday, now)).toBe("week");
    expect(learnerAssessmentBucketForRound(monday, now)).toBe("later");
    const buckets = learnerAssessmentDueBuckets([base, sunday, monday], now);
    expect(buckets.today.map((r) => r.roundId)).toEqual(["round-a"]);
    expect(buckets.week.map((r) => r.roundId)).toEqual(["round-a", "sunday"]);
  });

  it("uses effective approved reschedule, never unscheduled or past dates", () => {
    const rescheduled = {
      ...make("rescheduled", "2026-10-20T08:00:00Z"),
      exception: { scheduledAt: "2026-10-13T19:00:00Z" },
    };
    expect(learnerAssessmentBucketForRound(rescheduled, now)).toBe("today");
    expect(learnerAssessmentBucketForRound(make("none", null), now)).toBe("unscheduled");
    const rows = [rescheduled, make("none", null), make("past", "2026-10-12T10:00:00Z")];
    expect(filterLearnerAssessmentDueBucket(rows, "today", now).map(x => x.roundId))
      .toEqual(["rescheduled"]);
    expect(filterLearnerAssessmentDueBucket(rows, "week", now).map(x => x.roundId))
      .toEqual(["rescheduled"]);
    expect(filterLearnerAssessmentDueBucket(rows, "all", now)).toHaveLength(3);
  });

  it("distinguishes later, past and awaiting employer schedule without inventing completion",()=>{
    const later=make("later","2026-10-18T18:30:00Z");
    const past=make("past","2026-10-10T10:00:00Z");
    const waiting=make("waiting",null);
    const counts=learnerAssessmentDueBuckets([base,later,past,waiting],now);
    expect(counts.later.map(x=>x.roundId)).toEqual(["later"]);
    expect(counts.past.map(x=>x.roundId)).toEqual(["past"]);
    expect(counts.unscheduled.map(x=>x.roundId)).toEqual(["waiting"]);
    expect(filterLearnerAssessmentDueBucket([base,later,past,waiting],"later",now).map(x=>x.roundId))
      .toEqual(["later"]);
    expect(filterLearnerAssessmentDueBucket([base,later,past,waiting],"past",now).map(x=>x.roundId))
      .toEqual(["past"]);
    expect(filterLearnerAssessmentDueBucket([base,later,past,waiting],"unscheduled",now).map(x=>x.roundId))
      .toEqual(["waiting"]);
  });

  it("rejects unknown quick-filter values with Zod", () => {
    expect(learnerAssessmentDueBucketSchema.parse("today")).toBe("today");
    expect(learnerAssessmentDueBucketSchema.safeParse("other-learner").success).toBe(false);
    expect(learnerAssessmentDueBucketSchema.safeParse(["week"]).success).toBe(false);
  });
});
