import { describe, expect, it, vi } from "vitest";
import {
  deliverInAppNotificationInTransaction,
} from "@/modules/activity/notification-service";

type Writer = Parameters<typeof deliverInAppNotificationInTransaction>[0];
const eventId = "11111111-1111-4111-8111-111111111111";
const collegeId = "22222222-2222-4222-8222-222222222222";
const organizationId = "33333333-3333-4333-8333-333333333333";
const learner = "44444444-4444-4444-8444-444444444444";
const other = "55555555-5555-4555-8555-555555555555";
const message = {
  title: "Task updated", body: "Check the project workspace.",
  actionHref: "/learn/projects/" + eventId,
};
function fakeTransaction(input: {
  recipients: Array<{ id: string; platformStatus: string }>;
  memberUsers?: string[];
  grantUsers?: string[];
  superUsers?: string[];
  inserted?: number;
}) {
  const responses = [
    [{ id: eventId, collegeId, organizationId }],
    input.recipients,
    (input.memberUsers ?? []).map(userId => ({ userId })),
    (input.grantUsers ?? []).map(userId => ({ userId })),
    (input.superUsers ?? []).map(userId => ({ userId })),
  ];
  const select = vi.fn(() => {
    const rows = responses.shift() ?? [];
    const chain = {
      innerJoin: vi.fn(),
      where: vi.fn(),
      limit: vi.fn(async () => rows),
      then: (resolve: (value: unknown) => unknown, reject?: (error: unknown) => unknown) =>
        Promise.resolve(rows).then(resolve, reject),
    };
    chain.innerJoin.mockReturnValue(chain);
    chain.where.mockReturnValue(chain);
    return { from: vi.fn(() => chain) };
  });
  let lastValues: unknown = null;
  const returning = vi.fn(async () => Array.from({
    length: input.inserted ?? 1,
  }, (_, i) => ({ id: "new-" + i })));
  const onConflictDoNothing = vi.fn(() => ({ returning }));
  const values = vi.fn((v: unknown) => {
    lastValues = v;
    return { onConflictDoNothing };
  });
  const insert = vi.fn(() => ({ values }));
  return {
    tx: { select, insert } as unknown as Writer, select, insert,
    values: () => lastValues, returning,
  };
}

describe("chat-16 PROJ-BREAK project notification writer tenant and idempotency enforcement", () => {
  it("PROJ-BREAK-NOTIFY-WRITER-01 refuses wrong-college recipients before any bell write", async () => {
    const db = fakeTransaction({
      recipients: [{ id: other, platformStatus: "ACTIVE" }],
      memberUsers: [], grantUsers: [], superUsers: [],
    });
    await expect(deliverInAppNotificationInTransaction(db.tx, eventId, [other], message))
      .rejects.toThrow("NOTIFICATION_SCOPE_MISMATCH");
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("PROJ-BREAK-NOTIFY-WRITER-02 dedupes same event/recipient and reports duplicates truthfully", async () => {
    const db = fakeTransaction({
      recipients: [{ id: learner, platformStatus: "ACTIVE" }],
      memberUsers: [learner], inserted: 0,
    });
    const result = await deliverInAppNotificationInTransaction(
      db.tx, eventId, [learner, learner], message,
    );
    expect(result).toEqual({
      delivered: 0, skippedInactive: 0, skippedDuplicate: 1,
    });
    expect(db.values()).toEqual([expect.objectContaining({
      userId: learner, eventId, title: message.title,
    })]);
    expect(db.returning).toHaveBeenCalledOnce();
  });

  it("PROJ-BREAK-NOTIFY-WRITER-03 disabled users never get a notification", async () => {
    const db = fakeTransaction({
      recipients: [{ id: learner, platformStatus: "DISABLED" }],
    });
    expect(await deliverInAppNotificationInTransaction(
      db.tx, eventId, [learner], message,
    )).toEqual({
      delivered: 0, skippedInactive: 1, skippedDuplicate: 0,
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("PROJ-BREAK-NOTIFY-WRITER-04 malicious action URLs or malformed IDs deny before DB writes", async () => {
    const db = fakeTransaction({ recipients: [] });
    await expect(deliverInAppNotificationInTransaction(
      db.tx, "bad", [learner], message,
    )).rejects.toThrow();
    await expect(deliverInAppNotificationInTransaction(
      db.tx, eventId, [learner], { ...message, actionHref: "//evil.example.org/path" },
    )).rejects.toThrow();
    expect(db.select).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("PROJ-BREAK-NOTIFY-WRITER-05 a zero-sized audience does not query or emit an event", async () => {
    const db = fakeTransaction({ recipients: [] });
    expect(await deliverInAppNotificationInTransaction(
      db.tx, eventId, [], message,
    )).toEqual({ delivered: 0, skippedInactive: 0, skippedDuplicate: 0 });
    expect(db.select).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });
});
