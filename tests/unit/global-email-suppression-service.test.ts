import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ getDb: mocks.getDb }));

import {
  persistVerifiedGlobalEmailSuppression,
  GlobalEmailSuppressionUnavailable,
} from "@/modules/operations/global-email-suppression-service";

const recipientHash = "a".repeat(64);
const dialect = new PgDialect();

function simulatedStore(ready = true, failAt: number | null = null) {
  const statements: Array<{ text: string; params: unknown[] }> = [];
  let committed = false;
  let callIndex = 0;
  const execute = vi.fn(async (query: Parameters<PgDialect["sqlToQuery"]>[0]) => {
    callIndex++;
    const rendered = dialect.sqlToQuery(query);
    statements.push({ text: rendered.sql, params: rendered.params });
    if (failAt === callIndex) throw new Error("TRANSACTION_ABORT");
    if (callIndex === 1) {
      return { rows: [{ global_ready: ready, outbound_ready: ready }] };
    }
    return { rows: [] };
  });
  mocks.getDb.mockReturnValue({
    transaction: vi.fn(async (fn: (tx: { execute: typeof execute }) => Promise<void>) => {
      await fn({ execute });
      committed = true;
    }),
  });
  return { statements, execute, wasCommitted: () => committed };
}

describe("DB-050 verified global EMAIL suppression persistence", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unverified shapes before querying storage", async () => {
    const invalid = [
      { recipientHash: "not-a-hash", reason: "UNSUBSCRIBED" },
      { recipientHash, reason: "ADMIN_BLOCK" },
      { recipientHash, reason: "BOUNCE", sourceEventId: "not-a-uuid" },
      { recipientHash: "A".repeat(64), reason: "COMPLAINT" },
    ] as never[];
    for (const data of invalid) {
      await expect(persistVerifiedGlobalEmailSuppression(data))
        .rejects.toBeInstanceOf(GlobalEmailSuppressionUnavailable);
    }
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it("fails closed when the registered DB10 tables are absent", async () => {
    const store = simulatedStore(false);
    await expect(persistVerifiedGlobalEmailSuppression({
      recipientHash, reason: "UNSUBSCRIBED",
    })).rejects.toThrow("GLOBAL_EMAIL_SUPPRESSION_UNAVAILABLE");
    expect(store.statements).toHaveLength(1);
    expect(store.wasCommitted()).toBe(false);
  });

  it("records only a hash and cancels unsent matching EMAIL in one transaction", async () => {
    const store = simulatedStore();
    await expect(persistVerifiedGlobalEmailSuppression({
      recipientHash, reason: "UNSUBSCRIBED",
    })).resolves.toBeUndefined();
    expect(store.wasCommitted()).toBe(true);
    expect(store.statements).toHaveLength(3);
    const insert = store.statements[1]!;
    const cancel = store.statements[2]!;
    expect(insert.text).toContain("insert into outbound_global_email_suppressions");
    expect(insert.text).toContain("on conflict (recipient_hash) where cleared_at is null do nothing");
    expect(insert.params).toContain(recipientHash);
    expect(cancel.text).toContain("update outbound_messages");
    expect(cancel.text).toContain("message.status in ('PENDING', 'RETRY')");
    expect(cancel.text).toContain("message.channel = 'EMAIL'");
    expect(cancel.text).toContain("db10-global-email-binding-v1:");
    expect(cancel.text).toContain("sha256");
    expect(cancel.params).toContain(recipientHash);
    expect(cancel.text).not.toContain("CLAIMED");
    expect(JSON.stringify(store.statements)).not.toContain("contact@example");
  });

  it("a storage failure rolls back both suppression and cancellation", async () => {
    const store = simulatedStore(true, 3);
    await expect(persistVerifiedGlobalEmailSuppression({
      recipientHash, reason: "BOUNCE",
    })).rejects.toThrow("TRANSACTION_ABORT");
    expect(store.wasCommitted()).toBe(false);
    expect(store.statements).toHaveLength(3);
  });

  it("preserves optional verified source event ID without raw recipient PII", async () => {
    const store = simulatedStore();
    const event = "a0000000-0000-4000-8000-000000000001";
    await persistVerifiedGlobalEmailSuppression({
      recipientHash, reason: "COMPLAINT", sourceEventId: event,
    });
    expect(store.statements[1]!.params).toContain(event);
    expect(store.statements[1]!.params).toContain("COMPLAINT");
    expect(store.wasCommitted()).toBe(true);
  });
});
