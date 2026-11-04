import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/db/client";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { independentAuditFindingsReady } from "@/modules/bug-tracker/independent-audit-findings-service";
import { independentAuditGithubConfigured, readAuditGithubInbox } from "@/modules/bug-tracker/independent-audit-github-client";
import { syncIndependentAuditInbox } from "@/modules/bug-tracker/independent-audit-inbox-importer";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("@/db/client", () => ({ getDb: vi.fn() }));
vi.mock("@/modules/permissions/persisted-actor", () => ({
  assertPersistedPlatformPermission: vi.fn(),
}));
vi.mock("@/modules/bug-tracker/independent-audit-findings-service", () => ({
  independentAuditFindingsReady: vi.fn(),
}));
vi.mock("@/modules/bug-tracker/independent-audit-github-client", () => ({
  independentAuditGithubConfigured: vi.fn(),
  readAuditGithubInbox: vi.fn(),
}));

const actor: RequestContext = {
  user: {
    id: "11111111-1111-4111-8111-111111111111",
    identityUid: "test-superadmin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null, adminScope: null,
};

describe("independent audit importer live authority before SQL effects", () => {
  const originalLedgerReady = process.env["DB10_AUDIT_FINDINGS_LEDGER_READY"];
  const tx = {
    execute: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  };
  const transaction = vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) =>
    callback(tx));

  beforeEach(() => {
    vi.resetAllMocks();
    transaction.mockImplementation(async (callback: (input: typeof tx) => Promise<unknown>) =>
      callback(tx));
    process.env["DB10_AUDIT_FINDINGS_LEDGER_READY"] = "LEDGER_VERIFIED";
    vi.mocked(independentAuditFindingsReady).mockReturnValue(true);
    vi.mocked(independentAuditGithubConfigured).mockReturnValue(true);
    vi.mocked(readAuditGithubInbox).mockResolvedValue({
      items: [], commit: "a".repeat(40), readBlob: vi.fn(),
    } as never);
    vi.mocked(getDb).mockReturnValue({ transaction } as never);
    tx.execute.mockResolvedValue({ rows: [{ acquired: true }] });
    vi.mocked(assertPersistedPlatformPermission).mockResolvedValue(actor);
  });

  afterEach(() => {
    if (originalLedgerReady === undefined) delete process.env["DB10_AUDIT_FINDINGS_LEDGER_READY"];
    else process.env["DB10_AUDIT_FINDINGS_LEDGER_READY"] = originalLedgerReady;
  });

  // This module is exercised without actual PostgreSQL; the explicit
  // disposable-PostgreSQL revoke/lock race remains a release requirement.
  it("rechecks live Super Admin inside the transaction before any SQL read/write", async () => {
    vi.mocked(assertPersistedPlatformPermission).mockRejectedValueOnce(new Error("REVOKED"));
    await expect(syncIndependentAuditInbox({
      kind: "SUPER_ADMIN", actor,
    })).rejects.toThrow("REVOKED");
    expect(transaction).toHaveBeenCalledOnce();
    expect(assertPersistedPlatformPermission).toHaveBeenCalledWith(
      tx, actor, "admin-scope.select",
    );
    expect(tx.select).not.toHaveBeenCalled();
    expect(tx.insert).not.toHaveBeenCalled();
    expect(tx.update).not.toHaveBeenCalled();
  });

  it("denies scoped or non-admin actors before consulting persisted grants", async () => {
    for (const rejected of [
      { ...actor, adminScope: {
        organizationId: "22222222-2222-4222-8222-222222222222",
        collegeId: null,
      }},
      { ...actor, user: { ...actor.user, systemRoles: [] as RequestContext["user"]["systemRoles"] }},
    ]) {
      await expect(syncIndependentAuditInbox({
        kind: "SUPER_ADMIN", actor: rejected,
      })).rejects.toBeInstanceOf(Error);
    }
    expect(assertPersistedPlatformPermission).not.toHaveBeenCalled();
    expect(tx.select).not.toHaveBeenCalled();
    expect(tx.insert).not.toHaveBeenCalled();
  });

  it("keeps scheduler authority explicit and separate from a human role snapshot", async () => {
    const STOP = new Error("STOP_AT_FIRST_SQL_READ");
    tx.select.mockImplementationOnce(() => { throw STOP; });
    await expect(syncIndependentAuditInbox({
      kind: "SCHEDULER",
    })).rejects.toThrow("STOP_AT_FIRST_SQL_READ");
    expect(assertPersistedPlatformPermission).not.toHaveBeenCalled();
    expect(tx.insert).not.toHaveBeenCalled();
  });
});
