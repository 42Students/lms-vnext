import {describe,expect,it} from "vitest";
import {learnerNotificationPlacementAction} from "@/modules/activity/learner-notification-placement-action-model";
const id="81818181-8181-4818-8818-818181818181";
describe("learner placement notification action links",()=>{
  it("preserves only owned application ID and recognized offers view",()=>{
    expect(learnerNotificationPlacementAction(
      "/learn/my-placements/applications?applicationId="+id+"&collegeId=other"
    )).toEqual({href:"/learn/my-placements/applications?applicationId="+id,
      label:"View your application"});
    expect(learnerNotificationPlacementAction(
      "/learn/my-placements/offers?status=pending&userId=forged"
    )).toEqual({href:"/learn/my-placements/offers?status=pending",
      label:"View your offers"});
    expect(learnerNotificationPlacementAction("/learn/my-placements/assessments"))
      .toEqual({href:"/learn/my-placements/assessments",label:"View assessments"});
  });
  it("normalizes an interview action to validated own-round selectors",()=>{
    const round="92929292-9292-4929-8929-929292929292";
    expect(learnerNotificationPlacementAction(
      "/learn/my-placements/interviews?roundId="+round+"&applicationId="+id+"&collegeId=foreign"
    )).toEqual({href:"/learn/my-placements/interviews?applicationId="+id+"&roundId="+round,label:"View interview details"});
    expect(learnerNotificationPlacementAction("/learn/my-placements/interviews")).toEqual(
      {href:"/learn/my-placements/interviews",label:"View interviews"});
    for(const query of ["?roundId="+round,"?applicationId="+id,
      "?applicationId="+id+"&roundId=bad",
      "?applicationId="+id+"&roundId="+round+"&roundId="+round]){
      expect(learnerNotificationPlacementAction("/learn/my-placements/interviews"+query)).toBeNull();
    }
  });
  it("rejects malformed, duplicate, cross-role and external actions",()=>{
    for(const value of [
      "/learn/my-placements/applications?applicationId=bad",
      "/learn/my-placements/applications?applicationId="+id+"&applicationId="+id,
      "/learn/my-placements/offers?status=owner-only",
      "/learn/my-placements/offers?status=pending&status=accepted",
      "/tpo/placements","//evil.example",
    ])expect(learnerNotificationPlacementAction(value)).toBeNull();
  });
});
