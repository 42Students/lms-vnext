import {describe,expect,it} from "vitest";
import {
  mentorMeetingDisplayStatus, safeMentorMeetingJoinUrl, splitMentorMeetings,
  type MentorMeetingCalendarItem,
} from "@/modules/projects/mentor-calendar-view";

const base: MentorMeetingCalendarItem = {
  id: "m1", projectId: "p1", projectTitle: "Capstone", projectStatus: "ACTIVE",
  title: "Planning", status: "SCHEDULED", startsAt: "2099-10-17T07:00:00Z",
  endsAt: "2099-10-17T08:00:00Z", timeZone: "Asia/Kolkata",
  meetingUrl: "https://meet.example.org/room", linkedSprintTitle: null,
};

describe("chat-16 mentor calendar persisted statuses", () => {
  it("MEN-projects-meetings-69 shows DRAFT and RESCHEDULED without guessing missing states", () => {
    const draft = {...base, id: "m2", status: "DRAFT" as const};
    const rescheduled = {...base, id: "m3", status: "RESCHEDULED" as const};
    const now = new Date("2099-10-17T07:30:00Z");
    const dates = splitMentorMeetings([draft, rescheduled], now);
    expect(dates.upcoming.map(row => row.id)).toEqual(["m2", "m3"]);
    expect(mentorMeetingDisplayStatus(draft, now)).toBe("DRAFT");
    expect(mentorMeetingDisplayStatus(rescheduled, now)).toBe("RESCHEDULED");
    expect(safeMentorMeetingJoinUrl(draft, now)).toBeNull();
    expect(safeMentorMeetingJoinUrl(rescheduled, now)).toBe("https://meet.example.org/room");
  });
  it("MEN-projects-meetings-69 does not allow a past rescheduled or cancelled meeting join", () => {
    const past = new Date("2099-10-17T08:01:00Z");
    expect(mentorMeetingDisplayStatus({...base, status: "RESCHEDULED"}, past)).toBe("MISSED");
    expect(safeMentorMeetingJoinUrl({...base, status: "RESCHEDULED"}, past)).toBeNull();
    expect(safeMentorMeetingJoinUrl({...base, status: "CANCELLED"}, past)).toBeNull();
    expect(safeMentorMeetingJoinUrl({...base, status: "REQUESTED"}, past)).toBeNull();
  });
});
