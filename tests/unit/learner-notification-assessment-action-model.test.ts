import {describe,expect,it} from "vitest";
import {learnerNotificationAssessmentAction} from "@/modules/activity/learner-notification-assessment-action-model";
const a="81818181-8181-4818-8818-818181818181",r="82828282-8282-4828-8828-828282828282";
describe("notification assessment deep links are scoped at destination",()=>{
 it("preserves canonical exact-round context and drops forged query tenant",()=>{
  expect(learnerNotificationAssessmentAction(
    "/learn/my-placements/assessments?applicationId="+a+"&roundId="+r+"&collegeId=forged",
  )).toEqual({href:"/learn/my-placements/assessments?applicationId="+a+"&roundId="+r,
    label:"Take Assessment"});
  expect(learnerNotificationAssessmentAction("/learn/my-placements/assessments"))
    .toEqual({href:"/learn/my-placements/assessments",label:"Take Assessment"});
 });
 it("rejects partial, repeated, nonuuid, external and cross-role URLs",()=>{
  for(const raw of ["/learn/my-placements/assessments?applicationId="+a,
    "/learn/my-placements/assessments?applicationId="+a+"&roundId=nope",
    "/learn/my-placements/assessments?applicationId="+a+"&applicationId="+a+"&roundId="+r,
    "//evil.example/test","/tpo/placements"])expect(learnerNotificationAssessmentAction(raw)).toBeNull();
 });
});