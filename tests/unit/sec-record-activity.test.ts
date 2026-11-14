import { describe, expect, it, vi } from "vitest";
import { buildActivityRow, recordActivity, type ActivityWriter } from "@/modules/activity/record-activity";

const base = { module: "ACADEMICS", eventType: "academics.class.selected", subjectType: "section", subjectId: "s1", summary: "Class selected" };

function fakeWriter(returned: unknown[]) {
  const values = vi.fn();
  const writer: ActivityWriter = {
    insert: () => ({
      values: (row) => {
        values(row);
        return { onConflictDoNothing: () => ({ returning: async () => returned }) };
      },
    }),
  };
  return { writer, values };
}

describe("recordActivity", () => {
  it("fills defaults and keeps the required fields", () => {
    const row = buildActivityRow(base);
    expect(row).toMatchObject({ importance: "NORMAL", metadata: {}, collegeId: null, actorUserId: null, dedupeKey: null });
    expect(row).not.toHaveProperty("occurredAt");
  });
  it("refuses an incomplete event", () => {
    for (const bad of [{ module: "NOPE" as never }, { eventType: "" }, { subjectType: "" }, { subjectId: "" }, { summary: "  " }]) {
      expect(() => buildActivityRow({ ...base, ...bad })).toThrow("ACTIVITY_EVENT_INCOMPLETE");
    }
  });
  it("strips credential-like metadata before it is stored", () => {
    const row = buildActivityRow({ ...base, metadata: { origin: "X", password: "hunter2", token: "abc", nested: { secret: "s", ok: 1 } } });
    const json = JSON.stringify(row["metadata"]);
    expect(json).not.toContain("hunter2");
    expect(json).not.toContain("abc");
    expect(json).toContain("origin");
  });
  it("reports whether the event was recorded or was a replay of its dedupe key", async () => {
    const first = fakeWriter([{ id: "e1" }]);
    expect(await recordActivity(first.writer, { ...base, dedupeKey: "k1" })).toEqual({ recorded: true });
    expect(first.values).toHaveBeenCalledWith(expect.objectContaining({ dedupeKey: "k1" }));
    const replay = fakeWriter([]);
    expect(await recordActivity(replay.writer, { ...base, dedupeKey: "k1" })).toEqual({ recorded: false });
  });
});
