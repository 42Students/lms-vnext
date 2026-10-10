import { describe, expect, it } from "vitest";
import {
  mentorMeetingDisplayStatus, safeMentorMeetingJoinUrl, splitMentorMeetings,
  type MentorMeetingCalendarItem,
} from "@/modules/projects/mentor-calendar-view";

const item = (
  id: string, status: MentorMeetingCalendarItem["status"],
  start: string, end: string,
  extra: Partial<MentorMeetingCalendarItem> = {},
): MentorMeetingCalendarItem => ({
  id, status, startsAt: start, endsAt: end, projectId: "project-a",
  projectTitle: "Project A", projectStatus: "ACTIVE", title: id,
  timeZone: "Asia/Kolkata", meetingUrl: null, linkedSprintTitle: null,...extra,
});
const now = new Date("2026-10-10T12:00:00.000Z");
const old = "2026-10-09T10:00:00.000Z";
const oldEnd = "2026-10-09T11:00:00.000Z";
const future = "2026-10-11T10:00:00.000Z";
const futureEnd = "2026-10-11T11:00:00.000Z";

describe("W03 mentor calendar legacy behavior", () => {
  it("keeps overdue learner REQUESTED meetings in Upcoming even after the slot", () => {
    const {upcoming,past} = splitMentorMeetings([
      item("a","REQUESTED",old,oldEnd),
      item("b","SCHEDULED",old,oldEnd),
    ],now);
    expect(upcoming.map(x=>x.id)).toEqual(["a"]);
    expect(past.map(x=>x.id)).toEqual(["b"]);
  });
  it("uses the end instant while meetings are in progress", () => {
    const {upcoming,past}=splitMentorMeetings([
      item("one","SCHEDULED","2026-10-10T11:00:00Z","2026-10-10T12:30:00Z"),
      item("two","COMPLETED",future,futureEnd),
      item("three","CANCELLED",future,futureEnd),
    ],now);
    expect(upcoming.map(x=>x.id)).toEqual(["one","two"]);
    expect(past.map(x=>x.id)).toEqual(["three"]);
  });
  it("sorts upcoming ascending and past descending regardless of source order", () => {
    const {upcoming,past}=splitMentorMeetings([
      item("later","SCHEDULED","2026-10-12T09:00:00Z","2026-10-12T10:00:00Z"),
      item("oldest","CANCELLED","2026-09-01T09:00:00Z","2026-09-01T10:00:00Z"),
      item("soon","SCHEDULED",future,futureEnd),
      item("recent","COMPLETED",old,oldEnd),
    ],now);
    expect(upcoming.map(x=>x.id)).toEqual(["soon","later"]);
    expect(past.map(x=>x.id)).toEqual(["recent","oldest"]);
  });
  it("derives MISSED only for a scheduled meeting before viewer's current day",()=>{
    expect(mentorMeetingDisplayStatus(item("missed","SCHEDULED",old,oldEnd),now)).toBe("MISSED");
    expect(mentorMeetingDisplayStatus(item("requested","REQUESTED",old,oldEnd),now)).toBe("REQUESTED");
    expect(mentorMeetingDisplayStatus(item("cancel","CANCELLED",old,oldEnd),now)).toBe("CANCELLED");
  });
  it("uses the meeting timezone at midnight, independent of server local time",()=>{
    const instant = new Date("2026-10-10T19:00:00Z"); // Oct 11 in Kolkata
    const previousLocalDay = item("before","SCHEDULED",
      "2026-10-10T17:30:00Z","2026-10-10T18:00:00Z");
    const sameLocalDay = item("same","SCHEDULED",
      "2026-10-10T18:45:00Z","2026-10-10T19:15:00Z");
    expect(mentorMeetingDisplayStatus(previousLocalDay,instant)).toBe("MISSED");
    expect(mentorMeetingDisplayStatus(sameLocalDay,instant)).toBe("SCHEDULED");
    expect(mentorMeetingDisplayStatus({...previousLocalDay,timeZone:"Invalid/Zone"},instant))
      .toBe("SCHEDULED");
  });
  it("hides cancelled, javascript and data meeting URLs",()=>{
    const safe=item("ok","SCHEDULED",future,futureEnd,{meetingUrl:"https://meet.example.com/room"});
    expect(safeMentorMeetingJoinUrl(safe)).toBe("https://meet.example.com/room");
    expect(safeMentorMeetingJoinUrl({...safe,status:"CANCELLED"})).toBeNull();
    expect(safeMentorMeetingJoinUrl({...safe,meetingUrl:"javascript:alert(1)"})).toBeNull();
    expect(safeMentorMeetingJoinUrl({...safe,meetingUrl:"data:text/html,a"})).toBeNull();
  });
  it("handles missing/invalid instant values without exceptions",()=>{
    expect(splitMentorMeetings([item("invalid","SCHEDULED","not-a-date","not-a-date")],now).past).toHaveLength(1);
  });
});
