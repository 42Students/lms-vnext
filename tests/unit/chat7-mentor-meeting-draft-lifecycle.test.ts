import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { mentorMeetingDecisionStatus, mentorMeetingDecisionSchema } from "@/modules/projects/mentor-meeting-decision-model";
import { scheduleProjectMeetingInputSchema } from "@/modules/projects/validation";

const read = (path: string) => readFileSync(new URL("../../" + path, import.meta.url), "utf8");

describe("MEN-projects-meetings-27 meeting draft lifecycle", () => {
  it("MEN-projects-meetings-27 lets a mentor discard only mutable draft, requested or scheduled meetings", () => {
    expect(mentorMeetingDecisionStatus("CANCEL", "DRAFT")).toBe(true);
    expect(mentorMeetingDecisionStatus("CANCEL", "REQUESTED")).toBe(true);
    expect(mentorMeetingDecisionStatus("CANCEL", "SCHEDULED")).toBe(true);
    expect(mentorMeetingDecisionStatus("CANCEL", "RESCHEDULED")).toBe(true);
    expect(mentorMeetingDecisionStatus("CANCEL", "COMPLETED")).toBe(false);
    expect(mentorMeetingDecisionStatus("CANCEL", "CANCELLED")).toBe(false);
    expect(mentorMeetingDecisionStatus("COMPLETE", "DRAFT")).toBe(false);
    expect(mentorMeetingDecisionStatus("COMPLETE", "SCHEDULED")).toBe(true);
    expect(mentorMeetingDecisionStatus("COMPLETE", "RESCHEDULED")).toBe(true);
  });

  it("MEN-projects-meetings-27 requires a confirmed versioned mentor draft cancellation", () => {
    const valid = { action: "CANCEL", expectedUpdatedAt: "2099-01-01T00:00:00Z", confirmed: true };
    expect(mentorMeetingDecisionSchema.safeParse(valid).success).toBe(true);
    expect(mentorMeetingDecisionSchema.safeParse({ ...valid, confirmed: false }).success).toBe(false);
    expect(mentorMeetingDecisionSchema.safeParse({ action: "CANCEL", confirmed: true }).success).toBe(false);
    const mentorService = read("src/modules/projects/mentor-meeting-decision-service.ts");
    expect(mentorService).toContain('if(current.status==="DRAFT")return updated;');
    expect(mentorService).toContain('date_trunc(\'milliseconds\'');
    expect(mentorService.indexOf('if(current.status==="DRAFT")return updated;')).toBeLessThan(mentorService.indexOf("notifyActiveProjectMembers("));
  });

  it("MEN-projects-meetings-27 makes draft private and never notifies learners when cancelled", () => {
    const service = read("src/modules/projects/meeting-service.ts");
    const ui = read("src/components/projects/project-meeting-controls.tsx");
    expect(service).toContain('ne(projectMeetings.status, "DRAFT")');
    expect(service).toContain('inArray(projectMeetings.status,["DRAFT","REQUESTED","SCHEDULED","RESCHEDULED"])');
    expect(service).toContain('if (meeting.status === "DRAFT") return cancelled;');
    expect(service).toContain('const moderator = scope.access === "MENTOR" || scope.access === "ADMIN";');
    expect(service).toContain('...(!moderator ? [');
    expect(service).toMatch(/or\(\s*ne\(projectMeetings\.status,\s*"CANCELLED"\)/);
    expect(service).toContain('isNotNull(projectMeetings.requestedByMembershipId)');
    expect(service).toContain('isNotNull(projectMeetings.scheduledByUserId)');
    expect(service).toMatch(/rows\.map\(row\s*=>\s*\(\{\s*\.\.\.row,\s*facilitation:\s*emptyMentorMeetingFacilitation\s*\}\)\)/);
    expect(ui).toContain('meeting.status === "DRAFT" || meeting.status === "REQUESTED"');
    expect(ui).toContain('draftDiscard?"Discard draft":"Cancel meeting"');
    expect(ui).toContain('Drafts are visible to mentors only; no invitations are sent.');
    const draft = { title: "Planning", agenda: "Review", startsAt: "2099-03-01T10:00:00Z",
      endsAt: "2099-03-01T10:30:00Z", timeZone: "Asia/Kolkata", status: "DRAFT" };
    expect(scheduleProjectMeetingInputSchema.safeParse(draft).success).toBe(true);
    expect(scheduleProjectMeetingInputSchema.safeParse({ ...draft, status: "SCHEDULED" }).success).toBe(false);
  });
  it("MEN-projects-meetings-27 refuses mentor lifecycle changes on completed projects", () => {
    const code=read("src/modules/projects/mentor-meeting-decision-service.ts");
    expect(code).toContain('project.status==="ARCHIVED"||project.status==="COMPLETED"');
    expect(code).toContain('resolveOptionalModuleAccess(context)).projects.enabled');
    expect(code).toContain('if(current.status==="DRAFT")return updated;');
  });
  it("MEN-projects-meetings-27 preserves original organiser and linked work on edits", () => {
    const service=read("src/modules/projects/meeting-service.ts");
    expect(service).toContain("const organiserId=existing?.scheduledByUserId??context.user.id;");
    expect(service).toContain("eq(projectMeetings.scheduledByUserId,organiserId)");
    expect(service).toContain('scheduledByUserId: targetStatus==="DRAFT"?null:organiserId');
    expect(service).toContain('meetingType: input.meetingType ?? existing?.meetingType');
    expect(service).toContain("const effectiveSprintId=input.linkedSprintId===undefined");
    expect(service).toContain("existing?.linkedSprintId??null : input.linkedSprintId");
    expect(service).toContain("const effectiveTaskId=input.linkedTaskId===undefined");
    expect(service).toContain("existing?.linkedTaskId??null : input.linkedTaskId");
    expect(service).toContain('throw new ProjectsServiceError("PROJECT_MEETING_LINK_INVALID")');
  });
  it("MEN-projects-meetings-27 does not announce manager-only facilitator changes", () => {
    const service=read("src/modules/projects/meeting-service.ts");
    expect(service).toContain("const facilitatorOnlyChange=existing.status===targetStatus");
    expect(service).toContain('const facilitatorOnlyChange=existing.status===targetStatus');
    expect(service).toContain('if(targetStatus==="DRAFT" || facilitatorOnlyChange)return updated;');
    expect(service).toContain('if(targetStatus==="DRAFT" || facilitatorOnlyChange)return updated;');
    expect(service).toContain("(existing.outcome??null)===(values.outcome??null)");
    const decisions=read("src/modules/projects/mentor-meeting-decision-service.ts");
    expect(decisions).toContain("outcome:input.outcome??current.outcome??null");
  });
});
