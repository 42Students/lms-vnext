import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("chat-7 project merge-regression coverage", () => {
  it("MEN-projects-meetings-27 keeps retrospective and follow-up inputs inside the mentor schedule form", () => {
    const src = read("src/components/projects/project-meeting-controls.tsx");
    const scheduleIndex = src.indexOf("export function ScheduleProjectMeetingControl");
    const transitionIndex = src.indexOf("export function ProjectMeetingTransitionActions");
    expect(scheduleIndex).toBeGreaterThan(0);
    expect(transitionIndex).toBeGreaterThan(scheduleIndex);

    const learnerRequest = src.slice(0, scheduleIndex);
    const mentorSchedule = src.slice(scheduleIndex, transitionIndex);
    expect(learnerRequest).not.toContain('value={facilitation[field]}');
    expect(mentorSchedule).toContain('value={facilitation[field]}');
    expect(mentorSchedule).toContain('onChange={event=>setFacilitation(prev=>');
    expect(mentorSchedule).toContain('value={outcome}');
    expect(mentorSchedule).toContain('value={followUpAt}');
    expect(mentorSchedule).toContain('followUpStatus:event.target.value');
    expect(mentorSchedule).toContain('followUpAt:followUpAt?toIso(followUpAt):null');
    expect(mentorSchedule).toContain('JSON.stringify(facilitation)!==JSON.stringify(initialFacilitation)');
  });

  it("MEN-projects-meetings-R09 accepts the workspace estimation unit without discarding sprint fields", () => {
    const workspace = read("src/components/projects/project-workspace.tsx");
    const editor = read("src/components/projects/mentor-sprint-details-edit.tsx");
    expect(workspace).toContain('estimationUnit={workspace.project.estimationUnit}');
    expect(editor).toContain('status,estimationUnit,');
    expect(editor).toMatch(/estimationUnit\\??:string\\|null;/);
    expect(editor).toContain('Project estimation unit:');
    for (const field of ["goal:originalGoal", "definitionOfDone:originalDone", "expectedUpdatedAt:updatedAt"]) {
      expect(editor).toContain(field);
    }
  });
});
