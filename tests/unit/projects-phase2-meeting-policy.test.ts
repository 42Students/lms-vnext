import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { isFutureProjectMeetingWindow } from "@/modules/projects/meeting-window-policy";
const read = (name: string) => readFileSync(new URL("../../src/modules/projects/" + name, import.meta.url), "utf8");
describe("PR-S2-13: timezone and meeting conflicts", () => {
  it("compares UTC instants with strict future and positive duration gates", () => {
    const now = Date.parse("2026-10-16T00:00:00Z");
    expect(isFutureProjectMeetingWindow(new Date("2026-10-16T00:30:00+00:00"),new Date("2026-10-16T06:30:00+05:30"),now)).toBe(true);
    expect(isFutureProjectMeetingWindow(new Date(now),new Date(now+60000),now)).toBe(false);
    expect(isFutureProjectMeetingWindow(new Date(now+120000),new Date(now+60000),now)).toBe(false);
  });
  it("serializes project meeting conflict checks and preserves the original zone on reschedule", () => {
    expect(read("meeting-service.ts")).toContain("PROJECT_MEETING_SCHEDULE_CONFLICT");
    expect(read("meeting-service.ts")).toContain('.for("update").limit(1)');
    expect(read("mentor-meeting-reschedule-service.ts")).toContain("timeZone:meeting.timeZone");
    expect(read("mentor-meeting-reschedule-service.ts")).not.toContain('timeZone:"Asia/Kolkata"');
  });
});
