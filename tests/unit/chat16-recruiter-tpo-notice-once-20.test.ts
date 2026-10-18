import { describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { activityEvents, inAppNotifications } from "@/db/schema";
import { notifyTpoOfRecruiterMessage } from "@/modules/placements/recruiter-message-tpo-notification-service";

type Transaction = Parameters<typeof notifyTpoOfRecruiterMessage>[0];
const collegeId = "11111111-1111-4111-8111-111111111111";
const organizationId = "22222222-2222-4222-8222-222222222222";
const threadId = "33333333-3333-4333-8333-333333333333";
const messageId = "44444444-4444-4444-8444-444444444444";
const senderUserId = "55555555-5555-4555-8555-555555555555";
const officerId = "66666666-6666-4666-8666-666666666666";
const eventId = "77777777-7777-4777-8777-777777777777";
const input = {
  collegeId, threadId, messageId, senderUserId,
  at: new Date("2026-10-18T12:00:00Z"),
};

function repository({
  source = [{ body: "New message with team update" }],
  event = [{ id: eventId }],
}: {
  source?: { body: string }[];
  event?: { id: string }[];
} = {}) {
  const datasets = [
    [{ organizationId }],
    [{ userId: officerId }, { userId: officerId }, { userId: senderUserId }],
    source,
  ];
  const predicates: unknown[] = [];
  const select = vi.fn(() => {
    const data = datasets.shift() ?? [];
    const query = {
      innerJoin: vi.fn(),
      where: vi.fn((condition: unknown) => {
        predicates.push(condition);
        return query;
      }),
      limit: vi.fn(async () => data),
      then: (resolve: (value: unknown) => unknown, reject?: (error: unknown) => unknown) =>
        Promise.resolve(data).then(resolve, reject),
    };
    query.innerJoin.mockReturnValue(query);
    return { from: vi.fn(() => query) };
  });
  const activityValues = vi.fn((value: unknown) => ({
    onConflictDoNothing: vi.fn(() => ({
      returning: vi.fn(async () => event),
    })),
  }));
  const notificationValues = vi.fn(async (_value: unknown) => undefined);
  const insert = vi.fn((table: unknown) => ({
    values: table === activityEvents ? activityValues : notificationValues,
  }));
  const tx = { select, insert } as unknown as Transaction;
  return { tx, predicates, activityValues, notificationValues, insert, select };
}

describe("chat-16 recruiter-to-TPO notification must be tenant-bound and once per message", () => {
  it("REC-MESSAGE-NOTIFY-01 persists a stable unique event with one bell per TPO", async () => {
    const db = repository();
    const result = await notifyTpoOfRecruiterMessage(db.tx, input);
    expect(result).toEqual({ notified: 1 });
    expect(db.activityValues).toHaveBeenCalledWith(expect.objectContaining({
      organizationId, collegeId, actorUserId: senderUserId,
      subjectId: threadId,
      dedupeKey: "placements.recruiter.message.received:" + messageId,
    }));
    expect(db.notificationValues).toHaveBeenCalledTimes(1);
    expect(db.notificationValues).toHaveBeenCalledWith([
      expect.objectContaining({ userId: officerId, eventId }),
    ]);
    expect(db.insert).toHaveBeenCalledWith(activityEvents);
    expect(db.insert).toHaveBeenCalledWith(inAppNotifications);
  });

  it("REC-MESSAGE-NOTIFY-02 duplicate event claim makes no second notification, never throws", async () => {
    const db = repository({ event: [] });
    expect(await notifyTpoOfRecruiterMessage(db.tx, input)).toEqual({ notified: 0 });
    expect(db.activityValues).toHaveBeenCalledTimes(1);
    expect(db.notificationValues).not.toHaveBeenCalled();
  });

  it("REC-MESSAGE-NOTIFY-03 rejects source from other tenant, thread or sender before event insert", async () => {
    const db = repository({ source: [] });
    await expect(notifyTpoOfRecruiterMessage(db.tx, input))
      .rejects.toThrow("RECRUITER_MESSAGE_NOTIFICATION_SOURCE_MISSING");
    expect(db.activityValues).not.toHaveBeenCalled();
    expect(db.notificationValues).not.toHaveBeenCalled();
    const sql = new PgDialect().sqlToQuery(db.predicates[2] as never);
    for (const expected of [collegeId, threadId, messageId, senderUserId]) {
      expect(sql.params).toContain(expected);
    }
    expect(sql.sql).toContain("sender_type");
    expect(sql.sql).toContain("recruiter_user_id");
    expect(sql.sql).toContain("college_id");
  });
});
