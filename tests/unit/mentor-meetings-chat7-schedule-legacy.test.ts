import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  mentorMeetingCeremonyLabel,
  mentorMeetingHttpUrl,
  mentorMeetingScheduleError,
} from "../../src/modules/projects/mentor-meeting-form-model";

const source = (path: string) =>
  readFileSync(new URL("../../" + path, import.meta.url), "utf8");
const valid = {
  title: "Sprint review",
  startsAt: "2099-05-10T10:00",
  endsAt: "2099-05-10T11:00",
  meetingUrl: "https://meet.example.org/project",
  nowMs: new Date("2098-01-01T00:00:00Z").getTime(),
};

describe("Chat-7 mentor meeting legacy parity", () => {
  it("MEN-projects-meetings-28 uses the exact legacy ceremony names and save wording", () => {
    expect(mentorMeetingCeremonyLabel("PLANNING")).toBe("Sprint planning");
    expect(mentorMeetingCeremonyLabel("REVIEW")).toBe("Sprint review");
    expect(mentorMeetingCeremonyLabel("RETRO")).toBe("Retrospective");
    const ui = source("src/components/projects/project-meeting-controls.tsx");
    expect(ui).toContain("Ceremony");
    expect(ui).toContain('title: meeting');
    expect(ui).toContain('"Meeting added."');
    expect(ui).toContain("noValidate");
  });

  it("MEN-projects-meetings-29 validates required dates and time windows before network mutations", () => {
    expect(mentorMeetingScheduleError({ ...valid, startsAt: "" }))
      .toBe("Meeting date is required.");
    expect(mentorMeetingScheduleError({ ...valid, endsAt: "" }))
      .toBe("End time is required.");
    expect(mentorMeetingScheduleError({ ...valid, endsAt: "2099-05-10T09:59" }))
      .toBe("Meeting end time must be after the start time.");
    expect(mentorMeetingScheduleError({ ...valid, nowMs: new Date("2099-05-10T10:00:00+05:30").getTime() }))
      .toBe("Meeting date must be in the future.");
    expect(mentorMeetingScheduleError({ ...valid, meetingUrl: "" }))
      .toBe("Meeting link is required.");
    expect(mentorMeetingScheduleError({ ...valid, meetingUrl: "javascript:alert(1)" }))
      .toBe("Enter a valid meeting link.");
    expect(mentorMeetingScheduleError(valid)).toBeNull();
  });

  it("MEN-projects-meetings-29 accepts HTTP and HTTPS only, without embedded credentials", () => {
    expect(mentorMeetingHttpUrl("https://meet.example.com/room")).toBe(true);
    expect(mentorMeetingHttpUrl("http://meet.example.com/room")).toBe(true);
    expect(mentorMeetingHttpUrl("https://user:pass@meet.example.com")).toBe(false);
    expect(mentorMeetingHttpUrl("data:text/html,hi")).toBe(false);
    const server = source("src/modules/projects/validation.ts");
    expect(server).toContain('url.protocol === "https:" || url.protocol === "http:"');
    expect(server).toContain("meetingUrl: projectMeetingWebUrlSchema");
    const ui = source("src/components/projects/project-meeting-controls.tsx");
    expect(ui).toContain("minStart={scheduleMinStart}");
    expect(ui).toContain("mentorMeetingScheduleError");
  });
});
