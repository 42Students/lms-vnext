import {describe,expect,it} from "vitest";
import {mentorCalendarWeekWorkload} from
  "@/modules/projects/mentor-calendar-week-workload-model";
const row=(id:string,startsAt:string,endsAt:string,status="SCHEDULED",
  meetingType="GENERAL")=>({id,startsAt,endsAt,status,meetingType});
describe("Mentor actual IST-week meeting workload",()=>{
 it("counts only scheduled meetings and their recorded durations",()=>{
  const now=new Date("2026-10-24T12:00:00Z");
  const meetings=[
    row("review","2026-10-22T08:00:00Z","2026-10-22T09:00:00Z","SCHEDULED","REVIEW"),
    row("retro","2026-10-23T08:00:00Z","2026-10-23T09:30:00Z","RESCHEDULED","RETRO"),
    row("request","2026-10-24T08:00:00Z","2026-10-24T09:00:00Z","REQUESTED"),
    row("cancel","2026-10-24T10:00:00Z","2026-10-24T11:00:00Z","CANCELLED"),
    row("outside","2026-10-25T20:00:00Z","2026-10-25T21:00:00Z"),
  ];
  expect(mentorCalendarWeekWorkload(meetings,now)).toEqual({
    scheduled:2,hours:2.5,requests:1,reviews:1,retros:1});
 });
 it("uses local IST Monday boundary and excludes invalid durations",()=>{
  const now=new Date("2026-10-26T00:00:00Z");
  const meetings=[
    row("previous","2026-10-25T18:29:59Z","2026-10-25T19:30:00Z"),
    row("monday","2026-10-25T18:30:00Z","2026-10-25T19:00:00Z"),
    row("invalid","2026-10-26T08:00:00Z","2026-10-26T07:00:00Z"),
  ];
  expect(mentorCalendarWeekWorkload(meetings,now)).toEqual({
    scheduled:2,hours:1.5,requests:0,reviews:0,retros:0});
 });
 it("prorates a scheduled meeting across IST Sunday/Monday boundaries",()=>{
  const monday=new Date("2026-10-26T01:00:00Z");
  const priorWeek=new Date("2026-10-25T12:00:00Z");
  const spanning=row("overnight",
    "2026-10-25T18:00:00Z","2026-10-25T19:30:00Z","SCHEDULED","REVIEW");
  expect(mentorCalendarWeekWorkload([spanning],monday)).toEqual({
    scheduled:1,hours:1,requests:0,reviews:1,retros:0,
  });
  expect(mentorCalendarWeekWorkload([spanning],priorWeek)).toEqual({
    scheduled:1,hours:0.5,requests:0,reviews:1,retros:0,
  });
 });
 it("ignores invalid scheduled windows and does not count requested durations",()=>{
  const monday=new Date("2026-10-26T01:00:00Z");
  expect(mentorCalendarWeekWorkload([
    row("negative","2026-10-26T08:00:00Z","2026-10-26T07:00:00Z"),
    row("missing","no-time","2026-10-26T09:00:00Z"),
    row("request","2026-10-26T08:00:00Z","2026-10-26T09:00:00Z","REQUESTED"),
  ],monday)).toEqual({
    scheduled:0,hours:0,requests:1,reviews:0,retros:0,
  });
 });
});
