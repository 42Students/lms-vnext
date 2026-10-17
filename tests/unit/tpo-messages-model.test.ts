import {
  describe,
  expect,
  it,
} from "vitest";

import {
  deriveRecruiterThreadStatus,
  getTpoMessagesPage,
  safePlacementNotificationSubject,
  summarizeTpoMessages,
  tpoMessagesHref,
  type TpoInboxRecord,
} from "@/modules/placements/tpo-messages-model";
import { tpoMessagesQuerySchema } from "@/modules/placements/tpo-messages-service";

const records: TpoInboxRecord[] = [
  {
    id: "thread-a",
    source: "RECRUITER_THREADS",
    participantName: "Anita",
    subject: "Engineering Drive",
    status: "UNREAD",
    occurredAt: new Date("2026-10-14T10:00:00.000Z"),
    jobId: "job-a",
    messageCount: 3,
    unreadCount: 1,
  },
  {
    id: "thread-b",
    source: "RECRUITER_THREADS",
    participantName: "Bala",
    subject: "General recruiter conversation",
    status: "READ",
    occurredAt: new Date("2026-10-13T10:00:00.000Z"),
    jobId: null,
    messageCount: 2,
    unreadCount: 0,
  },
  {
    id: "thread-c",
    source: "RECRUITER_THREADS",
    participantName: "Chandra",
    subject: "Data Analyst",
    status: "EMPTY",
    occurredAt: new Date("2026-10-12T10:00:00.000Z"),
    jobId: null,
    messageCount: 0,
    unreadCount: 0,
  },
];

const allFilters = {
  status: "ALL" as const,
  q: "",
  from: null,
  to: null,
  page: 1,
  pageSize: 25,
};

describe("TPO Messages read model", () => {
  it("distinguishes empty, read and recruiter-unread threads", () => {
    expect(
      deriveRecruiterThreadStatus({
        messageCount: 0,
        unreadRecruiterMessages: 0,
      }),
    ).toBe("EMPTY");

    expect(
      deriveRecruiterThreadStatus({
        messageCount: 4,
        unreadRecruiterMessages: 0,
      }),
    ).toBe("READ");

    expect(
      deriveRecruiterThreadStatus({
        messageCount: 4,
        unreadRecruiterMessages: 2,
      }),
    ).toBe("UNREAD");
  });

  it("summarizes persisted records without inventing delivery totals", () => {
    expect(summarizeTpoMessages(records)).toEqual({
      total: 3,
      unread: 1,
      read: 1,
      empty: 1,
      reply: 0,
    });
  });

  it("applies status, search, dates and stable pagination", () => {
    const first = getTpoMessagesPage(
      records,
      {
        ...allFilters,
        pageSize: 1,
      },
    );

    expect(first.total).toBe(3);
    expect(first.totalPages).toBe(3);
    expect(first.items[0].id).toBe("thread-a");

    const second = getTpoMessagesPage(
      records,
      {
        ...allFilters,
        page: 2,
        pageSize: 1,
      },
    );

    expect(second.items[0].id).toBe("thread-b");

    const filtered = getTpoMessagesPage(
      records,
      {
        ...allFilters,
        status: "UNREAD",
        q: "anita",
        from: new Date("2026-10-14T00:00:00.000Z"),
        to: new Date("2026-10-14T23:59:59.999Z"),
      },
    );

    expect(filtered.total).toBe(1);
    expect(filtered.items[0].id).toBe("thread-a");
  });

  it("does not search hidden free-text message bodies", () => {
    const result = getTpoMessagesPage(
      records,
      {
        ...allFilters,
        q: "secret@example.com",
      },
    );

    expect(result.items).toEqual([]);
  });

  it("does not expose arbitrary notification titles or untrusted event strings", () => {
    expect(
      safePlacementNotificationSubject(
        "PLACEMENT_OFFER_ACCEPTED",
      ),
    ).toBe(
      "Placement notification · PLACEMENT OFFER ACCEPTED",
    );

    expect(
      safePlacementNotificationSubject(
        "Applicant jane@example.com",
      ),
    ).toBe("Placement notification");

    expect(
      safePlacementNotificationSubject(
        "PLACEMENT\n+919999999999",
      ),
    ).toBe("Placement notification");
  });

  it("rejects reversed ranges, invalid dates and unrecognized filters", () => {
    expect(
      tpoMessagesQuerySchema.safeParse({
        from: "2026-10-15",
        to: "2026-10-14",
      }).success,
    ).toBe(false);

    expect(
      tpoMessagesQuerySchema.safeParse({
        from: "2026-02-30",
      }).success,
    ).toBe(false);

    expect(
      tpoMessagesQuerySchema.safeParse({
        status: "SENT",
      }).success,
    ).toBe(false);

    expect(
      tpoMessagesQuerySchema.safeParse({
        collegeId: "00000000-0000-4000-8000-000000000001",
      }).success,
    ).toBe(false);
  });

  it("builds safe filtered URLs without tenant parameters", () => {
    expect(
      tpoMessagesHref({
        status: "UNREAD",
        q: "A&B",
        page: 2,
      }),
    ).toBe(
      "/tpo/messages?status=UNREAD&q=A%26B&page=2",
    );

    expect(tpoMessagesHref({})).toBe("/tpo/messages");
  });
});
