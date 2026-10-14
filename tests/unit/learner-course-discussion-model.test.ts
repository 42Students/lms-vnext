import { describe, expect, it } from "vitest";
import {
  buildDiscussionFeed,
  countNewDiscussionMessages,
  mergeDiscussionHistory,
  reconcileLatestDiscussionPage,
} from "@/components/courses/learner-course-discussion-model";

describe("learner discussion feed model", () => {
  it("groups consecutive messages from the same sender within five minutes", () => {
    const rows = buildDiscussionFeed([
      {
        id: "one",
        senderMembershipId: "learner-a",
        createdAt: "2026-10-05T10:00:00.000Z",
      },
      {
        id: "two",
        senderMembershipId: "learner-a",
        createdAt: "2026-10-05T10:04:00.000Z",
      },
      {
        id: "three",
        senderMembershipId: "learner-b",
        createdAt: "2026-10-05T10:05:00.000Z",
      },
      {
        id: "four",
        senderMembershipId: "learner-a",
        createdAt: "2026-10-05T10:11:00.000Z",
      },
    ]);

    const messageRows = rows.filter(
      (row) => row.kind === "message",
    );

    expect(messageRows.map((row) => row.grouped)).toEqual([
      false,
      true,
      false,
      false,
    ]);
  });

  it("does not group across calendar-day boundaries", () => {
    const rows = buildDiscussionFeed([
      {
        id: "one",
        senderMembershipId: "learner-a",
        createdAt: "2026-10-05T12:00:00.000Z",
      },
      {
        id: "two",
        senderMembershipId: "learner-a",
        createdAt: "2026-10-06T12:00:00.000Z",
      },
    ]);

    expect(rows.filter((row) => row.kind === "day")).toHaveLength(2);
    expect(
      rows
        .filter((row) => row.kind === "message")
        .map((row) => row.grouped),
    ).toEqual([false, false]);
  });

  it("counts only messages that appeared after a prior snapshot", () => {
    expect(
      countNewDiscussionMessages(
        [{ id: "one" }, { id: "two" }],
        [{ id: "one" }, { id: "two" }, { id: "three" }, { id: "four" }],
      ),
    ).toBe(2);

    expect(
      countNewDiscussionMessages([], [{ id: "one" }]),
    ).toBe(0);
  });
});

describe("Faculty course discussion paged history", () => {
  it("sorts same-millisecond messages using the persisted microsecond cursor", () => {
    const older = [
      { id: "mid", createdAtExact: "2026-10-14T08:00:00.123004Z", pinned: false },
      { id: "new", createdAtExact: "2026-10-14T08:00:00.123006Z", pinned: false },
    ];
    const incoming = [
      { id: "early", createdAtExact: "2026-10-14T08:00:00.123001Z", pinned: false },
      { id: "new", createdAtExact: "2026-10-14T08:00:00.123006Z", pinned: true },
    ];
    const merged = mergeDiscussionHistory(older, incoming);
    expect(merged.map(row => row.id)).toEqual(["early", "mid", "new"]);
    expect(merged.find(row => row.id === "new")?.pinned).toBe(true);
    expect(older[1]?.pinned).toBe(false);
  });

  it("keeps deterministic UUID ordering for messages with exactly equal timestamps", () => {
    const rows = mergeDiscussionHistory([], [
      { id: "b", createdAtExact: "2026-10-14T08:00:00.123004Z" },
      { id: "a", createdAtExact: "2026-10-14T08:00:00.123004Z" },
    ]);
    expect(rows.map(row => row.id)).toEqual(["a", "b"]);
  });
});

describe("discussion live refresh reconciliation", () => {
  const row = (id: string, microsecond: number) => ({
    id,
    createdAtExact: "2026-10-14T08:00:00." + String(microsecond).padStart(6, "0") + "Z",
  });
  it("drops a deleted newest message while retaining already loaded older history", () => {
    const previous = [row("old", 1), row("a", 2), row("deleted", 3), row("c", 4)];
    const latest = [row("a", 2), row("c", 4), row("d", 5)];
    expect(reconcileLatestDiscussionPage(previous, latest, 3, 3)
      .map(item => item.id)).toEqual(["old", "a", "c", "d"]);
  });
  it("discards all stale rows when the server has fewer than a full page", () => {
    const previous = [row("old", 1), row("deleted", 2), row("current", 3)];
    expect(reconcileLatestDiscussionPage(previous, [row("current", 3)], 1, 3)
      .map(item => item.id)).toEqual(["current"]);
  });
  it("preserves old pages when a local deletion was filtered from a full server response", () => {
    const previous = [row("old", 1), row("visible", 4)];
    const incoming = [row("visible", 4), row("new", 5)];
    expect(reconcileLatestDiscussionPage(previous, incoming, 3, 3)
      .map(item => item.id)).toEqual(["old", "visible", "new"]);
  });
});
