import {describe,expect,it} from "vitest";
import {ownApplicationAssessmentLinks} from "@/modules/placements/learner-application-assessment-links-model";
const app="81818181-8181-4818-8818-818181818181";
const old="82828282-8282-4828-8828-828282828282";
const next="83838383-8383-4838-8838-838383838383";
describe("application exact own assessment target",()=>{
  it("prefers nearest upcoming assessment and correct kind from serialized rounds",()=>{
    expect(ownApplicationAssessmentLinks([
      {applicationId:app,roundId:old,roundKind:"TEST",
        scheduledAt:"2026-10-10T08:00:00Z",exception:null},
      {applicationId:app,roundId:next,roundKind:"TEST",
        scheduledAt:"2026-10-17T08:00:00Z",exception:null},
      {applicationId:app,roundId:"not-an-assessment",roundKind:"INTERVIEW",
        scheduledAt:"2026-10-16T08:00:00Z",exception:null},
    ],"2026-10-14T00:00:00Z")).toEqual([{applicationId:app,
      href:"/learn/my-placements/assessments?applicationId="+app+"&roundId="+next}]);
  });
  it("returns no deep link for an unrelated round and respects approved reschedule",()=>{
    expect(ownApplicationAssessmentLinks([
      {applicationId:app,roundId:next,roundKind:"INTERVIEW",scheduledAt:null,exception:null},
    ],"2026-10-14T00:00:00Z")).toEqual([]);
    const result=ownApplicationAssessmentLinks([
      {applicationId:app,roundId:old,roundKind:"TEST",
        scheduledAt:"2026-10-10T08:00:00Z",
        exception:{scheduledAt:"2026-10-16T08:00:00Z"}},
    ],"2026-10-14T00:00:00Z");
    expect(result[0]?.href).toContain("roundId="+old);
  });
});