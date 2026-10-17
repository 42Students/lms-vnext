import { describe, expect, it } from "vitest";
import { partitionLearnerPlacementSchedule } from "@/modules/placements/learner-placement-schedule-model";

const now = new Date("2026-10-16T12:00:00Z");
const round = (roundId:string,at:Date|null,override:Date|null=null) => ({
  applicationId:"application-1",roundId,roundName:"Interview",
  companyName:"Example",roleTitle:"Engineer",scheduledAt:at,
  exception:override?{scheduledAt:override}:null,
});
describe("dev legacy combined learner placement Schedule",()=>{
  it("includes interviews, tests and talks in one chronological schedule",()=>{
    const result=partitionLearnerPlacementSchedule([
      round("later",new Date(now.getTime()+10000)),
      round("earlier",new Date(now.getTime()+1000)),
      round("today",now),
      round("past",new Date(now.getTime()-61*60*1000)),
    ],now);
    expect(result.ahead.map(x=>x.roundId)).toEqual(["today","earlier","later"]);
    expect(result.past.map(x=>x.roundId)).toEqual(["past"]);
  });
  it("honours approved reschedules and retains unbooked rounds",()=>{
    const result=partitionLearnerPlacementSchedule([
      round("rescheduled",new Date(now.getTime()-100),new Date(now.getTime()+100)),
      round("undated",null),
    ],now);
    expect(result.ahead.map(x=>x.roundId)).toEqual(["rescheduled"]);
    expect(result.undated.map(x=>x.roundId)).toEqual(["undated"]);
  });
});
