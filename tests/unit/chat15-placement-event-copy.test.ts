import {describe,expect,it} from "vitest";
import {learnerPlacementEventCopy,learnerPlacementEventKinds,learnerPlacementEventUsesMatchingJobsPreference} from "@/modules/placements/learner-placement-event-copy";
describe("LEARNER-placements-R04 notification catalog",()=>{
 it("LEARNER-placements-R04 enumerates every audited placement learner event without duplicating a GET-time notice",()=>{
  expect(learnerPlacementEventKinds).toHaveLength(28);
  expect(new Set(learnerPlacementEventKinds).size).toBe(28);
 });
 it.each(learnerPlacementEventKinds)("LEARNER-placements-R04 %s maps to a safe learner route",kind=>{
  const notice=learnerPlacementEventCopy(kind,"  Example\r\nrole  ");
  expect(notice.title.length).toBeGreaterThan(0);
  expect(notice.body).not.toContain("\n");
  expect(notice.actionHref).toMatch(/^\/learn\//);
  expect(notice.actionHref).not.toContain("..");
  expect(notice.actionHref).not.toBe("/learn/placements");
  expect(notice.body).toContain("Example");
 });
 it("TPO-requests-verification-04 delivers a recorded outcome and bounded public rejection note",()=>{
  const denied=learnerPlacementEventCopy("REQUEST_DECIDED","Software Engineer",{
   requestDecisionStatus:"REJECTED",requestDecisionNote:"Proof missing\r\nPlease upload again",
  });
  expect(denied.body).toContain("Your placement request was rejected");
  expect(denied.body).toContain("Reason: Proof missing Please upload again.");
  expect(denied.body).not.toContain("\n");
  expect(denied.actionHref).toBe("/learn/my-placements/placement#requests");

  const accepted=learnerPlacementEventCopy("RESCHEDULE_DECIDED","Graduate drive",{
   requestDecisionStatus:"APPROVED",requestDecisionNote:"internal note",
  });
  expect(accepted.body).toContain("Your reschedule request was approved");
  expect(accepted.body).not.toContain("internal note");
  expect(learnerPlacementEventCopy("REQUEST_DECIDED","Graduate drive").body)
    .toContain("Placement request reviewed");
  const bounded=learnerPlacementEventCopy("REQUEST_DECIDED","Test",{
   requestDecisionStatus:"REJECTED",requestDecisionNote:"x".repeat(2000),
  });
  expect(bounded.body.length).toBeLessThan(600);
 });
 it("LEARNER-placements-R04 scopes drive discovery versus application updates to the saved preference",()=>{
  expect(learnerPlacementEventUsesMatchingJobsPreference("DRIVE_PUBLISHED")).toBe(true);
  expect(learnerPlacementEventUsesMatchingJobsPreference("DEADLINE_TODAY")).toBe(true);
  expect(learnerPlacementEventUsesMatchingJobsPreference("APPLICATION_STATUS_CHANGED")).toBe(false);
  expect(learnerPlacementEventUsesMatchingJobsPreference("MARKED_ABSENT")).toBe(false);
  expect(learnerPlacementEventCopy("PROFILE_VERIFIED","Profile").actionHref).toBe("/learn/profile");
  expect(learnerPlacementEventCopy("PROFILE_SENT_BACK","Profile").actionHref).toBe("/learn/profile");
 });
});
