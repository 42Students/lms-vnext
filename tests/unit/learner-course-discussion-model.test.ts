import { describe, expect, it } from "vitest";
import {
  buildDiscussionFeed,
  countNewDiscussionMessages,
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
