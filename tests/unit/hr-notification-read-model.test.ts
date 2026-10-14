import {describe,expect,it} from "vitest";
import {hrNotificationReadSchema,hrNotificationVersionMatches} from "@/modules/placements/hr-notification-read-model";
describe("HR read notification version contract",()=>{
 it("requires a valid optimistic timestamp",()=>{
  const token="2026-10-15T00:01:02.123Z";
  expect(hrNotificationReadSchema.safeParse({expectedCreatedAt:token}).success).toBe(true);
  expect(hrNotificationReadSchema.safeParse({expectedCreatedAt:"yesterday"}).success).toBe(false);
  expect(hrNotificationReadSchema.safeParse({expectedCreatedAt:token,userId:"other"}).success).toBe(false);
  expect(hrNotificationVersionMatches(new Date(token),token)).toBe(true);
  expect(hrNotificationVersionMatches(new Date(token),"2026-10-15T00:01:02.122Z")).toBe(false);
 });
});
