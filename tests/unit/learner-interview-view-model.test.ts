import {describe,expect,it} from "vitest";
import {learnerInterviewScheduleCounts,learnerInterviewScheduleViewSchema,
  learnerInterviewViewHref} from "@/modules/placements/learner-interview-view-model";
const fixture={
  applicationId:"a",roundId:"one",roundKind:"INTERVIEW",roundName:"Interview",
  companyName:"Employer",roleTitle:"Engineer",exception:null,
};
const now=Date.parse("2026-10-14T08:00:00Z");
describe("interview upcoming/past schedule views",()=>{
  it("classifies persisted effective schedules without inventing attendance",()=>{
    const counts=learnerInterviewScheduleCounts([
      {...fixture,roundId:"early",scheduledAt:"2026-10-14T07:59:59Z"},
      {...fixture,roundId:"next",scheduledAt:"2026-10-14T08:00:00Z"},
      {...fixture,roundId:"unknown",scheduledAt:null},
      {...fixture,roundId:"rescheduled",scheduledAt:"2026-10-10T08:00:00Z",
        exception:{scheduledAt:"2026-10-16T08:00:00Z"}},
    ],now);
    expect(counts).toEqual({all:4,past:1,upcoming:2,unscheduled:1});
  });
  it("preserves an exact own round ID when sharing a view and rejects forged query shapes",()=>{
    expect(learnerInterviewViewHref(
      "/learn/my-placements/interviews?applicationId=own&roundId=own","past"))
      .toContain("roundId=own&view=past");
    expect(learnerInterviewScheduleViewSchema.safeParse(["past"]).success).toBe(false);
    expect(learnerInterviewScheduleViewSchema.safeParse("completed").success).toBe(false);
  });
});
