import { describe, expect, it } from "vitest";
import {
  candidateScheduleJobIdSchema, projectTpoCandidateScheduleReadiness,
} from "@/modules/placements/tpo-candidate-schedule-model";
describe("TPO candidate round schedule read-only readiness", () => {
  it("never fabricates individual slots or panel assignment", () => {
    const result = projectTpoCandidateScheduleReadiness([{
      id: "r1", name: "Interview", kind: "INTERVIEW", status: "SCHEDULED",
      scheduledAt: new Date("2026-10-14T04:30:00.000Z"),
      mode: "ON_CAMPUS", venue: "Room 2",
      participants: [{ applicationId: "a1", displayName: "Learner" }],
    }]);
    expect(result.displayed[0]).toMatchObject({
      roundStartIso: "2026-10-14T04:30:00.000Z",
      candidateSlot: null, panelAssignment: null, evidence: "ROUND_ONLY",
    });
  });
  it("excludes explicitly suspended memberships rather than advertising a slot", () => {
    const projected = projectTpoCandidateScheduleReadiness([{
      id: "r", name: "Round", kind: "INTERVIEW", status: "SCHEDULED",
      scheduledAt: null, mode: "VIRTUAL", venue: null,
      participants: [
        { applicationId: "a", displayName: "Active", membershipStatus: "ACTIVE" },
        { applicationId: "s", displayName: "Suspended", membershipStatus: "SUSPENDED" },
      ],
    }]);
    expect(projected.displayed.map((x) => x.applicationId)).toEqual(["a"]);
  });
  it("validates IDs and returns zero for a drive without rounds", () => {
    expect(candidateScheduleJobIdSchema.safeParse("unsafe").success).toBe(false);
    expect(projectTpoCandidateScheduleReadiness([]).total).toBe(0);
  });
});
