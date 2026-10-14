import {describe,expect,it} from "vitest";
import {learnerNotificationsLoadingSections} from "@/modules/activity/learner-notification-loading-model";
describe("learner notifications source loading placeholders",()=>{
 it("keeps personal and college announcements distinct from interactive filters",()=>{
  expect(learnerNotificationsLoadingSections.map(x=>x.kind))
   .toEqual(["filter","personal","announcements"]);
  expect(learnerNotificationsLoadingSections.every(x=>x.placeholders>0)).toBe(true);
 });
});
