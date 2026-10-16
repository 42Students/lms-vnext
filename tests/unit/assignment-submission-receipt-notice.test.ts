import {describe,it,expect} from "vitest";
import {safeNotificationActionHref} from "@/modules/activity/notification-action";
describe("LEARNER-learning-misc-08 receipt navigation",()=>{
 it("keeps learner receipt paths internal",()=>{
  const href="/learn/allAssignments/550e8400-e29b-41d4-a716-446655440000?deliveryId=550e8400-e29b-41d4-a716-446655440001";
  expect(safeNotificationActionHref(href)).toBe(href);
  expect(safeNotificationActionHref("//external.test")).toBeNull();
 });
});
