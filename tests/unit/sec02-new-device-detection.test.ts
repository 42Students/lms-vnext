import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  record: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ getDb: () => ({ execute: mocks.execute }) }));
vi.mock("@/modules/auth/config", () => ({
  getAuthConfig: () => ({ secret: "a-secret-longer-than-thirty-two-characters", sessionMaxAgeSeconds: 432000 }),
}));
vi.mock("@/security/audit-store", () => ({ recordSecurityEvent: mocks.record }));

import { createSession } from "@/modules/auth/session-service";

describe("SEC-02-011 new-device detection on sign-in", () => {
  beforeEach(() => {
    mocks.execute.mockReset();
    mocks.record.mockReset();
  });

  it("does not alert on a user's very first session", async () => {
    mocks.execute.mockResolvedValue({ rows: [{ total: 0, same_device: 0 }] });
    await createSession("user-a", { deviceName: "phone", userAgent: "agent-1", ipAddress: "203.0.113.5" });
    expect(mocks.record).not.toHaveBeenCalled();
  });

  it("does not alert when the same device name and agent were seen before", async () => {
    mocks.execute.mockResolvedValue({ rows: [{ total: 3, same_device: 2 }] });
    await createSession("user-a", { deviceName: "phone", userAgent: "agent-1", ipAddress: "203.0.113.5" });
    expect(mocks.record).not.toHaveBeenCalled();
  });

  it("records one auth.new_device event for a device never seen before, without the address or agent", async () => {
    mocks.execute.mockResolvedValue({ rows: [{ total: 3, same_device: 0 }] });
    await createSession("user-a", { deviceName: "Windows laptop", userAgent: "agent-9", ipAddress: "203.0.113.77" });
    expect(mocks.record).toHaveBeenCalledTimes(1);
    const event = mocks.record.mock.calls[0]![0];
    expect(event).toMatchObject({ event: "auth.new_device", outcome: "ok", userId: "user-a" });
    expect(JSON.stringify(event)).not.toContain("203.0.113.77");
    expect(JSON.stringify(event)).not.toContain("agent-9");
  });

  it("still creates the session when the statement returns no rows", async () => {
    mocks.execute.mockResolvedValue(undefined);
    const session = await createSession("user-a", { deviceName: "phone" });
    expect(session.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(mocks.record).not.toHaveBeenCalled();
  });
});
