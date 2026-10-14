import {describe,expect,it} from "vitest";
import {readLearnerCalendarUrl,learnerCalendarHref,learnerCalendarSelectedEvents} from "@/modules/placements/learner-career-calendar-url-model";
const fallback="2026-10-14";
const round={applicationId:"own",roundId:"round",roundName:"Interview",roundKind:"INTERVIEW",companyName:"Company",roleTitle:"Engineer",scheduledAt:"2026-10-16T18:45:00Z",exception:null};
describe("learner calendar URL date/view/event filters",()=>{
  it("restores each view and filter with an IST day",()=>{
    for(const view of ["agenda","month","week","day"]){
      const state=readLearnerCalendarUrl("date=2026-10-17&view="+view+"&kind=INTERVIEW",fallback);
      expect(state).toEqual({date:"2026-10-17",view,kind:"INTERVIEW"});
      expect(readLearnerCalendarUrl(learnerCalendarHref(state).split("?")[1],fallback)).toEqual(state);
    }
  });
  it("rejects impossible dates, duplicates and untrusted scope selectors",()=>{
    expect(readLearnerCalendarUrl("date=2026-02-30&view=admin&kind=all&collegeId=foreign",fallback)).toEqual({date:fallback,view:"agenda",kind:"ALL"});
    expect(readLearnerCalendarUrl("date=2026-10-17&date=2026-10-18&view=day&view=month",fallback)).toEqual({date:fallback,view:"agenda",kind:"ALL"});
    expect(()=>learnerCalendarHref({date:"2026-10-17",view:"day",kind:"ALL",membershipId:"other"})).toThrow();
    expect(learnerCalendarHref(readLearnerCalendarUrl("collegeId=secret",fallback))).not.toContain("collegeId");
  });
  it("composes type/date filters with actual events crossing IST midnight and reschedules",()=>{
    const state={date:"2026-10-17",view:"day",kind:"INTERVIEW"};
    expect(learnerCalendarSelectedEvents([round],state)).toHaveLength(1);
    expect(learnerCalendarSelectedEvents([round],{...state,date:"2026-10-16"})).toHaveLength(0);
    expect(learnerCalendarSelectedEvents([round],{...state,kind:"ASSESSMENT"})).toHaveLength(0);
    expect(learnerCalendarSelectedEvents([{...round,exception:{scheduledAt:"2026-10-18T10:00:00Z"}}],state)).toHaveLength(0);
  });
});
