import { describe, expect, it } from "vitest";
import {
  browseLearnerCareerRounds, learnerRoundUrgency,
  learnerRoundScheduledInstant,
  type LearnerRoundBrowseSource,
  type LearnerRoundBrowseFilters,
} from "@/modules/placements/learner-rounds-browse-model";

const NOW = Date.parse("2026-10-13T05:00:00Z"); // 10:30 IST
const base: LearnerRoundBrowseSource = {
  applicationId:"application-a", roundId:"r1",
  roundKind:"TEST", roundName:"Technical aptitude",
  companyName:"Example Corp", roleTitle:"Developer",
  scheduledAt:"2026-10-13T08:00:00Z", exception:null,
};
const defaults: LearnerRoundBrowseFilters = {
  search:"", time:"all", urgency:"all", sort:"soonest",
};

describe("Learner assessment/interview browse", () => {
  it("keeps assessment and interview/GD domain boundaries intact", () => {
    const rows = [
      base,
      {...base,roundId:"r2",roundKind:"VENDOR_TEST"},
      {...base,roundId:"r3",roundKind:"INTERVIEW"},
      {...base,roundId:"r4",roundKind:"GD"},
    ];
    expect(browseLearnerCareerRounds(rows,"ASSESSMENT",defaults,NOW).map(x=>x.roundId))
      .toEqual(["r1","r2"]);
    expect(browseLearnerCareerRounds(rows,"INTERVIEW",defaults,NOW).map(x=>x.roundId))
      .toEqual(["r3","r4"]);
  });

  it("uses effective approved reschedule instead of an expired original date", () => {
    const amended = {
      ...base,
      scheduledAt:"2026-10-12T08:00:00Z",
      exception:{scheduledAt:"2026-10-13T07:00:00Z"},
    };
    expect(learnerRoundScheduledInstant(amended)).toBe(Date.parse("2026-10-13T07:00:00Z"));
    expect(learnerRoundUrgency(amended,NOW)).toBe("today");
    expect(browseLearnerCareerRounds([amended],"ASSESSMENT",{
      ...defaults,time:"upcoming",
    },NOW)).toHaveLength(1);
  });

  it("does not mislabel a past assessment as employer-completed", () => {
    const past = {...base, scheduledAt:"2026-10-12T08:00:00Z"};
    expect(learnerRoundUrgency(past,NOW)).toBe("past");
    expect(browseLearnerCareerRounds([past],"ASSESSMENT",{
      ...defaults,time:"past",
    },NOW)).toHaveLength(1);
  });

  it("retains unscheduled rounds and excludes them from urgency buckets", () => {
    const noDate = {...base,scheduledAt:null};
    expect(learnerRoundUrgency(noDate,NOW)).toBe("unscheduled");
    expect(browseLearnerCareerRounds([noDate],"ASSESSMENT",{
      ...defaults,time:"unscheduled",
    },NOW)).toHaveLength(1);
    expect(browseLearnerCareerRounds([noDate],"ASSESSMENT",{
      ...defaults,urgency:"week",
    },NOW)).toHaveLength(0);
  });

  it("combines search with 7-day urgency and deterministic ordering", () => {
    const rows = [
      {...base,roundId:"later",scheduledAt:"2026-10-21T08:00:00Z"},
      {...base,roundId:"this-week",scheduledAt:"2026-10-17T08:00:00Z"},
      {...base,roundId:"today",scheduledAt:"2026-10-13T08:00:00Z"},
      {...base,roundId:"other",companyName:"Different Co"},
    ];
    expect(browseLearnerCareerRounds(rows,"ASSESSMENT",{
      ...defaults,search:"example",urgency:"week",
    },NOW).map(x=>x.roundId)).toEqual(["today","this-week"]);
  });
});
