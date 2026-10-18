import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { getDb } from "@/db/client";
import {
  changeInboundMailStatusForAdmin, listInboundMailForAdmin,
  type InboundMailAdminRepository,
} from "@/modules/inbound-mail/admin-service";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("@/db/client", () => ({ getDb: vi.fn() }));

const id = "11111111-1111-4111-8111-111111111111";
const admin: RequestContext = {
  user: { id: "admin", identityUid: "admin-identity", platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"] },
  membership: null,
};
const message = (n: number) => ({
  id: "message-" + n, receivedAt: new Date("2026-10-18T00:00:00.000Z"),
  fromAddress: "sender@example.org", toAddress: "campus@example.org",
  subject: "Hello", bodyPlain: "Private message", status: "NEW", version: 0,
});
const raw = {
  id, expectedStatus: "NEW", expectedVersion: 0, status: "RESOLVED",
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("chat-16 Super Admin inbound mail adversarial actions and boundaries", () => {
  it("HR-BREAK-INBOUND-01 blocks wrong role, disabled principal, and acting-tenant scope before storage", async () => {
    const repo: InboundMailAdminRepository = {
      tableExists: vi.fn(async () => true),
      list: vi.fn(async () => []),
    };
    for (const actor of [
      { ...admin, user: { ...admin.user, systemRoles: [] } },
      { ...admin, user: { ...admin.user, platformStatus: "DISABLED" as const } },
      { ...admin, adminScope: { organizationId: id, collegeId: id } },
    ]) {
      await expect(listInboundMailForAdmin(actor, {}, repo)).rejects.toThrow();
    }
    expect(repo.tableExists).not.toHaveBeenCalled();
    expect(repo.list).not.toHaveBeenCalled();
    expect(getDb).not.toHaveBeenCalled();
  });

  it("HR-BREAK-INBOUND-02 validates all inputs before attempting to read private mail", async () => {
    const repo: InboundMailAdminRepository = {
      tableExists: vi.fn(async () => true), list: vi.fn(async () => []),
    };
    for (const invalid of [
      { status: "PRIVATE" }, { page: 0 }, { page: 10001 },
      { q: "x".repeat(121) }, { recipient: "not-mail" }, { unknown: id },
    ]) {
      await expect(listInboundMailForAdmin(admin, invalid, repo)).rejects.toThrow();
    }
    expect(repo.tableExists).not.toHaveBeenCalled();
    expect(repo.list).not.toHaveBeenCalled();
  });

  it("HR-BREAK-INBOUND-03 bounds the requested page and counts unread independently of the search", async () => {
    const list = vi.fn(async () => Array.from({ length: 51 }, (_, i) => message(i)));
    const count = vi.fn(async (filters: { status: string }) =>
      filters.status === "NEW" ? 22 : 350);
    const repo: InboundMailAdminRepository = {
      tableExists: vi.fn(async () => true), list, count,
    };
    const page = await listInboundMailForAdmin(admin, {
      status: "RESOLVED", page: 2, q: "  subject  ", recipient: " CAMPUS@example.org ",
    }, repo);
    expect(page).toMatchObject({
      available: true, page: 2, hasMore: true, total: 350, toReadCount: 22,
    });
    expect(page.items).toHaveLength(50);
    expect(list).toHaveBeenCalledWith(expect.objectContaining({
      status: "RESOLVED", page: 2, q: "subject", recipient: "campus@example.org",
    }));
    expect(count).toHaveBeenCalledWith(expect.objectContaining({
      status: "NEW", page: 1, q: "",
    }));
  });

  it("HR-BREAK-INBOUND-04 returns honest storage-unavailable state with no message query", async () => {
    const repo: InboundMailAdminRepository = {
      tableExists: vi.fn(async () => false), list: vi.fn(async () => []),
      count: vi.fn(async () => 0),
    };
    expect(await listInboundMailForAdmin(admin, { page: 3 }, repo))
      .toMatchObject({ available: false, page: 3, items: [], total: null });
    expect(repo.list).not.toHaveBeenCalled();
    expect(repo.count).not.toHaveBeenCalled();
  });

  it("HR-BREAK-INBOUND-05 denies stale CAS writes and includes tenant-safe expected version/status", async () => {
    const execute = vi.fn(async () => ({ rows: [{ found: true }] }));
    let predicate: unknown = null;
    const returning = vi.fn(async () => []);
    const where = vi.fn((condition: unknown) => {
      predicate = condition;
      return { returning };
    });
    const set = vi.fn(() => ({ where }));
    const update = vi.fn(() => ({ set }));
    vi.mocked(getDb).mockReturnValue({ execute, update } as never);
    expect(await changeInboundMailStatusForAdmin(admin, raw))
      .toEqual({ kind: "STALE" });
    const sql = new PgDialect().sqlToQuery(predicate as never);
    expect(sql.params).toContain(id);
    expect(sql.params).toContain("NEW");
    expect(sql.params).toContain(0);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("HR-BREAK-INBOUND-06 failed role/validation never reaches DB or writes statuses", async () => {
    await expect(changeInboundMailStatusForAdmin({
      ...admin, adminScope: { organizationId: id, collegeId: id },
    }, raw)).rejects.toThrow();
    await expect(changeInboundMailStatusForAdmin(admin, {
      ...raw, expectedVersion: -1,
    })).rejects.toThrow();
    await expect(changeInboundMailStatusForAdmin(admin, {
      ...raw, status: "UNKNOWN",
    })).rejects.toThrow();
    expect(getDb).not.toHaveBeenCalled();
  });
});
