import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";

const fakes = vi.hoisted(() => ({
  execute: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ getDb: () => ({ execute: fakes.execute }) }));
vi.mock("@/modules/auth/config", () => ({
  getAuthConfig: () => ({ secret: "a-secret-longer-than-thirty-two-characters", sessionMaxAgeSeconds: 432000 }),
}));

import {
  createSession,
  listActiveSessions,
  resolveSession,
  revokeAllSessionsForUser,
  revokeOtherSessions,
  revokeOwnSession,
  revokeSessionByToken,
} from "@/modules/auth/session-service";
import { sessionDigest } from "@/modules/auth/crypto";

type CompiledSql = { sql: string; params: unknown[] };
const dialect = new PgDialect();

function statement(index: number): CompiledSql {
  const call = fakes.execute.mock.calls[index];
  if (!call) throw new Error("Expected SQL statement was not issued");
  return dialect.sqlToQuery(call[0] as SQL);
}

beforeEach(() => {
  fakes.execute.mockReset();
  fakes.execute.mockResolvedValue({ rows: [] });
});

describe("auth and sessions: persisted device-token ownership and revocation", () => {
  it("AUTH-SESSION-01 stores a keyed digest, never the device token, with a bounded expiry", async () => {
    const session = await createSession("user-a", { deviceName: "phone", userAgent: "u".repeat(600), ipAddress: "i".repeat(90) });
    expect(session.maxAgeSeconds).toBe(432000);
    expect(session.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const compiled = statement(0);
    expect(compiled.sql).toContain("INSERT INTO identity_device_sessions");
    expect(compiled.sql).toContain("make_interval");
    expect(compiled.params).toContain("user-a");
    expect(compiled.params).toContain(sessionDigest("a-secret-longer-than-thirty-two-characters", session.token));
    expect(compiled.params).not.toContain(session.token);
    expect(compiled.params).toContain("u".repeat(512));
    expect(compiled.params).toContain("i".repeat(64));
  });

  it("AUTH-SESSION-02 rejects unknown, revoked, expired and disabled sessions before heartbeat writes", async () => {
    expect(await resolveSession("unknown")).toEqual({ ok: false, reason: "SESSION_INVALID" });
    for (const [row, reason] of [
      [{ revoked: true, expired: false, platform_status: "ACTIVE" }, "SESSION_REVOKED"],
      [{ revoked: false, expired: true, platform_status: "ACTIVE" }, "SESSION_EXPIRED"],
      [{ revoked: false, expired: false, platform_status: "DISABLED" }, "SESSION_REVOKED"],
    ] as const) {
      fakes.execute.mockReset();
      fakes.execute.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [row] });
      expect(await resolveSession("token")).toEqual({ ok: false, reason });
      expect(fakes.execute).toHaveBeenCalledTimes(2);
    }
  });

  it("AUTH-SESSION-03 returns only a live identity and throttles the last-seen heartbeat", async () => {
    fakes.execute.mockResolvedValueOnce({ rows: [{
      session_id: "session-a", user_id: "user-a", identity_uid: "identity-a",
      platform_status: "ACTIVE", revoked: false, expired: false,
    }] });
    const result = await resolveSession("token");
    expect(result).toMatchObject({
      ok: true, session: { sessionId: "session-a", userId: "user-a", identityUid: "identity-a", platformStatus: "ACTIVE" },
    });
    expect(fakes.execute).toHaveBeenCalledTimes(1);
    expect(statement(0).sql).toContain("s.revoked_at IS NULL");
    expect(statement(0).sql).toContain("s.expires_at > clock_timestamp()");
    expect(statement(0).sql).toContain("interval '60 seconds'");
    expect(statement(0).sql).toContain("FOR SHARE OF u");
  });

  it("AUTH-SESSION-04 revokes one device only with its persisted owning user and a live-row predicate", async () => {
    fakes.execute.mockResolvedValueOnce({ rows: [{ id: "session-a" }] });
    expect(await revokeOwnSession("session-a", "user-a")).toBe(true);
    const compiled = statement(0);
    expect(compiled.sql).toMatch(/WHERE id = \$\d+ AND user_id = \$\d+ AND revoked_at IS NULL/);
    expect(compiled.sql).toContain("expires_at > now()");
    expect(compiled.params).toEqual(expect.arrayContaining(["session-a", "user-a"]));
    fakes.execute.mockResolvedValueOnce({ rows: [] });
    expect(await revokeOwnSession("session-from-another-college", "user-a")).toBe(false);
  });

  it("AUTH-SESSION-05 leaves the current device alone when revoking other devices", async () => {
    fakes.execute.mockResolvedValueOnce({ rows: [{ id: "session-b" }, { id: "session-c" }] });
    expect(await revokeOtherSessions("user-a", "session-a")).toBe(2);
    const compiled = statement(0);
    expect(compiled.sql).toContain("id <>");
    expect(compiled.sql).toContain("revoked_at IS NULL");
    expect(compiled.sql).toContain("expires_at > now()");
    expect(compiled.params).toEqual(expect.arrayContaining(["user-a", "session-a"]));
    expect(compiled.params).not.toContain("user-b");
  });

  it("AUTH-SESSION-06 logs out by token digest rather than trusting a device id supplied by the browser", async () => {
    await revokeSessionByToken("opaque-token");
    const compiled = statement(0);
    expect(compiled.sql).toContain("credential_digest");
    expect(compiled.sql).toContain("revoked_at IS NULL");
    expect(compiled.params).toContain(sessionDigest("a-secret-longer-than-thirty-two-characters", "opaque-token"));
    expect(compiled.params).not.toContain("opaque-token");
  });

  it("AUTH-SESSION-07 restricts user-wide revocation and device listing to the subject user", async () => {
    await revokeAllSessionsForUser("user-a", "security-admin", "ACCOUNT_DISABLED");
    const revoke = statement(0);
    expect(revoke.sql).toContain("WHERE user_id =");
    expect(revoke.sql).toContain("revoked_at IS NULL");
    expect(revoke.params).toEqual(expect.arrayContaining(["user-a", "security-admin", "ACCOUNT_DISABLED"]));
    fakes.execute.mockResolvedValueOnce({ rows: [{ id: "session-a", device_name: "laptop" }] });
    const list = await listActiveSessions("user-a");
    expect(list).toEqual([{ id: "session-a", device_name: "laptop" }]);
    expect(statement(1).sql).toContain("WHERE user_id =");
    expect(statement(1).sql).toContain("revoked_at IS NULL");
    expect(statement(1).params).toContain("user-a");
  });
});
