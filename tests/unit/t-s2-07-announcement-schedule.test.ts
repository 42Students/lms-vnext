import {describe,expect,it} from "vitest";
import {parseTpoIstMinute,parseTpoNoticeSchedule} from "@/modules/announcements/tpo-notice-schedule-model";
describe("T-S2-07 DB10 notice timing in Asia/Kolkata",()=>{
 it("persists an IST civil time without depending on the server's timezone",()=>{
  expect(parseTpoIstMinute("2026-10-16T10:30")?.toISOString()).toBe("2026-10-16T05:00:00.000Z");
  expect(parseTpoIstMinute("")).toBeNull();
  expect(parseTpoIstMinute("2028-02-29T10:30")?.toISOString()).toBe("2028-02-29T05:00:00.000Z");
 });
 it("rejects impossible dates, unbounded input and malformed offsets",()=>{
  for(const text of ["2026-02-31T10:30","2025-02-29T10:30","2026-10-16T25:30","2026-10-16T10:99","2026-10-16T10:30Z"]){
   expect(()=>parseTpoIstMinute(text)).toThrow("TPO_NOTICE_INVALID_TIME");
  }
 });
 it("does not create already expired notices or run scheduled expiry backwards",()=>{
  const now=new Date("2026-10-16T05:00:00Z");
  expect(parseTpoNoticeSchedule({sendAt:"2026-10-16T11:00",showUntil:"2026-10-17T11:00"},now))
   .toMatchObject({scheduledAt:new Date("2026-10-16T05:30:00Z"),expiresAt:new Date("2026-10-17T05:30:00Z")});
  expect(()=>parseTpoNoticeSchedule({sendAt:"2026-10-16T11:00",showUntil:"2026-10-16T10:30"},now)).toThrow();
  expect(()=>parseTpoNoticeSchedule({sendAt:"2026-10-15T10:00"},now)).toThrow();
 });
});
