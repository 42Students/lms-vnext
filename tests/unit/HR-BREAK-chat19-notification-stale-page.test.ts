import {describe,expect,it} from "vitest";
import {
 clampHrInboxPage,hrInboxPageBounds,hrNotificationsQuerySchema,HR_INBOX_PAGE_SIZE,
} from "@/modules/placements/hr-notifications-model";

describe("HR-BREAK-NOTIFICATIONS-02: stale inbox and revoked filter deep links",()=>{
 it.each([
  {requested:1,total:0,expected:1},
  {requested:10000,total:0,expected:1},
  {requested:1,total:1,expected:1},
  {requested:10000,total:1,expected:1},
  {requested:2,total:26,expected:2},
  {requested:9999,total:26,expected:2},
  {requested:9999,total:51,expected:3},
  {requested:3,total:25,expected:1},
 ])("recovers requested page $requested for $total authorized rows to $expected",({requested,total,expected})=>{
  expect(clampHrInboxPage(requested,total)).toBe(expected);
  const bounded=hrInboxPageBounds(clampHrInboxPage(requested,total),total);
  expect(bounded.page).toBe(expected);
  expect(bounded.last).toBeLessThanOrEqual(total);
  expect(bounded.first).toBeLessThanOrEqual(bounded.last);
 });
 it("does not weaken strict incoming HTTP validation or existing out-of-range bounds semantics",()=>{
  expect(HR_INBOX_PAGE_SIZE).toBe(25);
  expect(hrNotificationsQuerySchema.safeParse({page:10001}).success).toBe(false);
  expect(hrNotificationsQuerySchema.safeParse({page:0}).success).toBe(false);
  expect(hrInboxPageBounds(3,26)).toMatchObject({page:3,pages:2,first:0,last:0});
  expect(clampHrInboxPage(3,26)).toBe(2);
 });
 it("clamps NaN, infinity and unsafe counts without manufacturing results",()=>{
  expect(clampHrInboxPage(Number.NaN,25)).toBe(1);
  expect(clampHrInboxPage(Infinity,25)).toBe(1);
  expect(clampHrInboxPage(-1,25)).toBe(1);
  expect(clampHrInboxPage(999,Number.NaN)).toBe(1);
  expect(clampHrInboxPage(999,-100)).toBe(1);
 });
});
