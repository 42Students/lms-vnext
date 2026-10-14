import { describe, expect, it } from "vitest";
import {
  presentOwnLearnerPlacementAlerts,
  type OwnPlacementAlert,
} from "@/modules/placements/learner-placement-alerts-model";

function make(id: string, time: string, href: string | null): OwnPlacementAlert {
  return {
    id, title: "Placement update", body: "A recorded status update",
    actionHref: href,
    createdAt: new Date(time),
    readAt: null,
  };
}

describe("Learner personal placement alerts projection", () => {
  it("preserves actual timestamps, sorts newest first, and does not invent a notice", () => {
    const a = make("first", "2026-10-13T08:00:00Z", "/learn/my-placements");
    const b = make("second", "2026-10-14T08:00:00Z", null);
    const rows = [a, b] as const;
    const result = presentOwnLearnerPlacementAlerts(rows);
    expect(result.map((row) => row.id)).toEqual(["second", "first"]);
    expect(result[0]?.createdAt).toEqual(b.createdAt);
    expect(result[0]?.unread).toBe(true);
    expect(Object.keys(result[0]!)).not.toContain("officialNotice");
    expect(rows[0]).toBe(a);
  });

  it("does not expose dangerous persisted action URLs or false unread state", () => {
    const a = { ...make("a", "2026-10-01T00:00:00Z", "//evil.example/"),
      readAt: new Date("2026-10-02T00:00:00Z") };
    const b = make("b", "2026-10-02T00:00:00Z", "javascript:alert(1)");
    const result = presentOwnLearnerPlacementAlerts([a, b]);
    expect(result[0]?.actionHref).toBeNull();
    expect(result[1]?.actionHref).toBeNull();
    expect(result[1]?.unread).toBe(false);
    expect(presentOwnLearnerPlacementAlerts([])).toEqual([]);
  });
});
