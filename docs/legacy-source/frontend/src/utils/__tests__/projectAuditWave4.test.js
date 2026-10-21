import { resolveProjectMeetingViewerInstant } from "../projectMeetingTime";
import { findProjectBoardTask, buildProjectBoardUndoPayload } from "../projectBoardUndo";

describe("Projects: meeting timezone display", () => {
  const base = { meetingDate: "2026-09-25", startTime: "10:00:00" };
  test("valid source zone converts to viewer zone", () => {
    const value = resolveProjectMeetingViewerInstant({ ...base, timezone: "Asia/Kolkata" }, "UTC");
    expect(value).not.toBeNull();
    expect(value.format("HH:mm")).toBe("04:30");
  });
  test("invalid legacy IANA zone returns null rather than throwing during render", () => {
    expect(() => resolveProjectMeetingViewerInstant({ ...base, timezone: "Not/AReal_Time_Zone" }, "UTC")).not.toThrow();
    expect(resolveProjectMeetingViewerInstant({ ...base, timezone: "Not/AReal_Time_Zone" }, "UTC")).toBeNull();
  });
  test("missing source time zone uses existing raw-date fallback", () => {
    expect(resolveProjectMeetingViewerInstant(base, "UTC")).toBeNull();
  });
  test("invalid meeting time returns null", () => {
    expect(resolveProjectMeetingViewerInstant({ ...base, startTime: "invalid", timezone: "Asia/Kolkata" }, "UTC")).toBeNull();
  });
});

describe("Projects: board Undo restores original lane using latest saved row", () => {
  const original = {
    taskKey: "kickoff-review", id: null, title: "Original title", status: "To Do",
    sprintKey: "phase-one", sprintLabel: "Phase One", sortOrder: 2,
  };
  const latest = {
    id: 55, taskKey: "kickoff-review", title: "Current saved title", status: "In Progress",
    sprintKey: "phase-one", version: 4, assigneeId: 18,
  };
  test("finds task by stable key after virtual task gains numeric database id", () => {
    expect(findProjectBoardTask([latest], original)).toBe(latest);
  });
  test("restores source status with latest server version and unrelated fields", () => {
    const payload = buildProjectBoardUndoPayload(original, latest);
    expect(payload).toMatchObject({
      taskKey: "kickoff-review", version: 4, status: "To Do", sprintKey: "phase-one",
      assigneeId: 18, title: "Current saved title", sortOrder: 2, clearSprint: false,
    });
  });
  test("moving back to unscheduled backlog sends explicit sprint clear signal", () => {
    const payload = buildProjectBoardUndoPayload({ ...original, sprintKey: null, sprintId: null }, latest);
    expect(payload.sprintKey).toBeNull();
    expect(payload.clearSprint).toBe(true);
  });
  test("restoring previously blocked status includes its original blocker reason", () => {
    const payload = buildProjectBoardUndoPayload({ ...original, status: "Blocked", blockerReason: "Waiting on API" }, latest);
    expect(payload.blockerReason).toBe("Waiting on API");
  });
  test("returns null when moved task no longer exists", () => {
    expect(findProjectBoardTask([], original)).toBeNull();
  });
});
