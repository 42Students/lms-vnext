import {
  describe,
  expect,
  it,
} from "vitest";
import {
  groupActivityEvents,
  type ActivityEventRow,
} from "@/modules/activity/service";

function row(
  id: string,
  occurredAt: string,
  groupKey: string | null,
): ActivityEventRow {
  return {
    event: {
      id,
      organizationId: "organization-1",
      collegeId: "college-1",
      actorUserId: "user-1",
      actorMembershipId:
        "membership-1",
      module: "PLACEMENTS",
      eventType:
        "placements.job.published",
      importance: "NORMAL",
      subjectType: "placement_job",
      subjectId: id,
      subjectLabel: null,
      summary: "Placement changed",
      metadata: {},
      groupKey,
      dedupeKey: null,
      occurredAt: new Date(
        occurredAt,
      ),
    },
    actor: {
      id: "user-1",
      displayName: "User One",
      email: "user@example.com",
    },
  };
}

describe("activity grouping", () => {
  it("groups adjacent matching events inside the noise window and keeps distant events separate", () => {
    const groups =
      groupActivityEvents([
        row(
          "00000000-0000-4000-8000-000000000001",
          "2026-10-04T08:30:00.000Z",
          "job-1",
        ),
        row(
          "00000000-0000-4000-8000-000000000002",
          "2026-10-04T08:10:00.000Z",
          "job-1",
        ),
        row(
          "00000000-0000-4000-8000-000000000003",
          "2026-10-04T07:00:00.000Z",
          "job-1",
        ),
        row(
          "00000000-0000-4000-8000-000000000004",
          "2026-10-04T06:50:00.000Z",
          null,
        ),
      ]);

    expect(
      groups.map((group) => group.count),
    ).toEqual([2, 1, 1]);
  });
});
