import {describe,expect,it} from "vitest";
import {learnerApplicationJourneyTimeline} from "@/modules/placements/learner-application-journey-timeline-model";
const submitted=new Date("2026-10-10T00:00:00Z");
const sample={applicationId:"own",submittedAt:submitted,withdrawnAt:null,
  screening:{status:"SHORTLISTED",decidedAt:new Date("2026-10-11T00:00:00Z")},
  results:[{resultId:"r",roundName:"Technical",outcome:"PASS",
    appliedAt:new Date("2026-10-12T00:00:00Z")}]};
describe("own learner application journey timeline",()=>{
  it("orders only real persisted event timestamps newest first",()=>{
    expect(learnerApplicationJourneyTimeline(sample).map(x=>x.label))
      .toEqual(["Technical: pass","Screening: shortlisted","Application submitted"]);
    expect(learnerApplicationJourneyTimeline(sample)[0]?.at.toISOString())
      .toBe("2026-10-12T00:00:00.000Z");
  });
  it("never fabricates screening or round events with no recorded time",()=>{
    const rows=learnerApplicationJourneyTimeline({...sample,
      screening:{status:"SHORTLISTED",decidedAt:null},
      results:[{...sample.results[0]!,appliedAt:null}]});
    expect(rows.map(x=>x.label)).toEqual(["Application submitted"]);
    expect(sample.results[0]?.appliedAt).toBeInstanceOf(Date);
  });
});
