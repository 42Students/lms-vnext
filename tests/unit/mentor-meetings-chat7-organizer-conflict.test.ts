import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
const read = (file: string) => readFileSync(new URL("../../" + file, import.meta.url), "utf8");
describe("mentor meeting organiser collision protection", () => {
  it("MEN-projects-meetings-R02 guards normal meeting scheduling across all the organiser's projects", () => {
    const source = read("src/modules/projects/meeting-service.ts");
    expect(source).toContain("pg_advisory_xact_lock");
    expect(source).toContain("eq(projectMeetings.scheduledByUserId,context.user.id)");
    expect(source).toContain("eq(projectMeetings.projectId,scope.project.id)");
    expect(source).toContain('eq(projectMeetings.status,"SCHEDULED")');
    expect(source).toContain("lt(projectMeetings.startsAt,endsAt)");
    expect(source).toContain("gt(projectMeetings.endsAt,startsAt)");
    expect(source).toContain("ne(projectMeetings.id,existing.id)");
    expect(source).toContain("PROJECT_MEETING_SCHEDULE_CONFLICT");
  });
  it("MEN-projects-meetings-R02 preserves the original organiser when rescheduling", () => {
    const source = read("src/modules/projects/mentor-meeting-reschedule-service.ts");
    expect(source).toContain("const organiserUserId = meeting.scheduledByUserId ?? context.user.id");
    expect(source).toContain("pg_advisory_xact_lock");
    expect(source).toContain("eq(projectMeetings.scheduledByUserId,organiserUserId)");
    expect(source).toContain("ne(projectMeetings.id,meeting.id)");
    expect(source).toContain("PROJECT_MEETING_SCHEDULE_CONFLICT");
  });
});
