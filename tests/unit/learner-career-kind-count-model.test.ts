import {describe,expect,it} from "vitest";
import {learnerCareerKindCounts} from "@/modules/placements/learner-career-kind-count-model";
import {careerCalendarEvents,careerCalendarPeriod} from "@/modules/placements/learner-career-calendar-model";
describe("learner calendar month totals",()=>{
  it("counts only events in selected IST month",()=>{
    const rounds=[
      {applicationId:"a",roundId:"1",roundName:"Test",roundKind:"TEST",companyName:"A",roleTitle:"Dev",scheduledAt:"2026-10-16T20:00:00Z",exception:null},
      {applicationId:"a",roundId:"2",roundName:"Interview",roundKind:"INTERVIEW",companyName:"A",roleTitle:"Dev",scheduledAt:"2026-10-31T20:00:00Z",exception:null},
    ];
    const events=careerCalendarEvents(rounds);
    const october=careerCalendarPeriod(events,"2026-10-17","month").events;
    expect(learnerCareerKindCounts(october)).toEqual({total:1,assessments:1,interviews:0,other:0});
    expect(learnerCareerKindCounts([])).toEqual({total:0,assessments:0,interviews:0,other:0});
  });
});
