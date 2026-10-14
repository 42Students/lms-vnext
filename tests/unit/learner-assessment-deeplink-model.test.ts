import {describe,expect,it} from "vitest";
import {resolveOwnAssessmentDeepLink} from "@/modules/placements/learner-assessment-deeplink-model";
const app="81818181-8181-4818-8818-818181818181";
const round="82828282-8282-4828-8828-828282828282";
const foreign="83838383-8383-4838-8838-838383838383";
describe("learner applied assessment deep-link scope",()=>{
  const own=[{applicationId:app,roundId:round,roundKind:"TEST"},
    {applicationId:app,roundId:foreign,roundKind:"INTERVIEW"}];
  it("opens only an owned assessment from persisted learner rounds",()=>{
    expect(resolveOwnAssessmentDeepLink(own,{})).toEqual({valid:true,key:null});
    expect(resolveOwnAssessmentDeepLink(own,{applicationId:app,roundId:round}))
      .toEqual({valid:true,key:app+":"+round});
  });
  it("rejects wrong application, interview, partial, malformed, and injected selectors",()=>{
    for(const raw of [
      {applicationId:foreign,roundId:round},
      {applicationId:app,roundId:foreign},
      {applicationId:app},{roundId:round},
      {applicationId:[app],roundId:round},
      {applicationId:app,roundId:round,collegeId:foreign},
    ])expect(resolveOwnAssessmentDeepLink(own,raw)).toEqual({valid:false});
  });
});
