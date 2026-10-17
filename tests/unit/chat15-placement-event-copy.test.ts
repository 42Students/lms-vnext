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
 it("LEARNER-placements-R04 scopes drive discovery versus application updates to the saved preference",()=>{
  expect(learnerPlacementEventUsesMatchingJobsPreference("DRIVE_PUBLISHED")).toBe(true);
  expect(learnerPlacementEventUsesMatchingJobsPreference("DEADLINE_TODAY")).toBe(true);
  expect(learnerPlacementEventUsesMatchingJobsPreference("APPLICATION_STATUS_CHANGED")).toBe(false);
  expect(learnerPlacementEventUsesMatchingJobsPreference("MARKED_ABSENT")).toBe(false);
  expect(learnerPlacementEventCopy("PROFILE_VERIFIED","Profile").actionHref).toBe("/learn/profile");
  expect(learnerPlacementEventCopy("PROFILE_SENT_BACK","Profile").actionHref).toBe("/learn/profile");
 });
});
