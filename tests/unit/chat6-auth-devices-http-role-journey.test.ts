import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentDeviceSession } from "@/auth/current-session";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { listActiveSessions, revokeOtherSessions, revokeOwnSession } from "@/modules/auth/session-service";
import { GET, DELETE as DELETE_OTHERS } from "@/app/api/auth/devices/route";
import { DELETE as DELETE_ONE } from "@/app/api/auth/devices/[sessionId]/route";

vi.mock("@/auth/current-session", () => ({ getCurrentDeviceSession: vi.fn() }));
vi.mock("@/auth/origin", () => ({ isSameOriginRequest: vi.fn() }));
vi.mock("@/lib/api-error", () => ({ apiErrorResponse: vi.fn() }));
vi.mock("@/modules/auth/session-service", () => ({
  listActiveSessions: vi.fn(), revokeOtherSessions: vi.fn(), revokeOwnSession: vi.fn(),
}));

const userId = "11111111-1111-4111-8111-111111111111";
const sessionId = "22222222-2222-4222-8222-222222222222";
const otherSessionId = "33333333-3333-4333-8333-333333333333";
const deviceUrl = "https://campus.example.test/api/auth/devices";
const request = (url = deviceUrl) => new Request(url, { method: "DELETE" });
const route = (id: string) => ({ params: Promise.resolve({ sessionId: id }) });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(isSameOriginRequest).mockReturnValue(true);
  vi.mocked(getCurrentDeviceSession).mockResolvedValue({
    userId, sessionId, identityUid: "identity-1", platformStatus: "ACTIVE",
  });
  vi.mocked(apiErrorResponse).mockImplementation((error) => error instanceof ZodError
    ? NextResponse.json({ error: "INVALID_REQUEST", message: "Please check the device identifier.",
      requestId: "test-ref" }, { status: 400, headers: { "x-request-id": "test-ref" } })
    : NextResponse.json({ error: "INTERNAL_ERROR", message: "Please try again.",
      requestId: "test-ref" }, { status: 503, headers: { "x-request-id": "test-ref" } }));
});

describe("AUTH-sessions-10 device list and revocation HTTP hostile journeys", () => {
  it("AUTH-sessions-10 GET binds to persisted signed-in identity, flags only current device, and blocks caches", async () => {
    const lastSeen = new Date("2099-01-01T12:00:00Z");
    vi.mocked(listActiveSessions).mockResolvedValue([
      { id: sessionId, device_name: "Current laptop", user_agent: "Browser A",
        created_at: lastSeen, last_seen_at: lastSeen, expires_at: lastSeen },
      { id: otherSessionId, device_name: null, user_agent: null,
        created_at: lastSeen, last_seen_at: lastSeen, expires_at: lastSeen },
    ]);
    const result = await GET();
    expect(result.status).toBe(200);
    expect(result.headers.get("Cache-Control")).toBe("private, no-store");
    expect(listActiveSessions).toHaveBeenCalledOnce();
    expect(listActiveSessions).toHaveBeenCalledWith(userId);
    expect(await result.json()).toEqual({ devices: [
      { id: sessionId, deviceName: "Current laptop", userAgent: "Browser A",
        createdAt: lastSeen.toISOString(), lastSeenAt: lastSeen.toISOString(),
        expiresAt: lastSeen.toISOString(), current: true },
      { id: otherSessionId, deviceName: null, userAgent: null,
        createdAt: lastSeen.toISOString(), lastSeenAt: lastSeen.toISOString(),
        expiresAt: lastSeen.toISOString(), current: false },
    ] });
    expect(revokeOwnSession).not.toHaveBeenCalled();
    expect(revokeOtherSessions).not.toHaveBeenCalled();
  });

  it("AUTH-sessions-10 an absent/revoked session fails closed before reading any device records", async () => {
    vi.mocked(getCurrentDeviceSession).mockRejectedValue(new Error("private-token"));
    const result = await GET();
    expect(result.status).toBe(503);
    expect(result.headers.get("x-request-id")).toBe("test-ref");
    expect(await result.text()).not.toContain("private-token");
    expect(listActiveSessions).not.toHaveBeenCalled();
  });

  it("AUTH-sessions-10 cross-origin bulk revoke is denied before identity resolution or SQL writes", async () => {
    vi.mocked(isSameOriginRequest).mockReturnValue(false);
    const result = await DELETE_OTHERS(request());
    expect(result.status).toBe(403);
    expect(await result.json()).toEqual({ error: "INVALID_ORIGIN" });
    expect(getCurrentDeviceSession).not.toHaveBeenCalled();
    expect(revokeOtherSessions).not.toHaveBeenCalled();
  });

  it("AUTH-sessions-10 bulk revoke forwards only caller identity/current device and reports zero-row retries truthfully", async () => {
    vi.mocked(revokeOtherSessions).mockResolvedValueOnce(2).mockResolvedValueOnce(0);
    const first = await DELETE_OTHERS(request());
    expect(await first.json()).toEqual({ ok: true, revoked: 2 });
    expect(first.headers.get("Cache-Control")).toBe("private, no-store");
    const second = await DELETE_OTHERS(request());
    expect(await second.json()).toEqual({ ok: true, revoked: 0 });
    expect(revokeOtherSessions).toHaveBeenNthCalledWith(1, userId, sessionId);
    expect(revokeOtherSessions).toHaveBeenNthCalledWith(2, userId, sessionId);
    expect(revokeOwnSession).not.toHaveBeenCalled();
  });

  it("AUTH-sessions-10 single-session revoke requires origin and valid UUID before a user-owned UPDATE", async () => {
    vi.mocked(isSameOriginRequest).mockReturnValue(false);
    const denied = await DELETE_ONE(request(deviceUrl + "/" + otherSessionId), route(otherSessionId));
    expect(denied.status).toBe(403);
    expect(getCurrentDeviceSession).not.toHaveBeenCalled();
    vi.mocked(isSameOriginRequest).mockReturnValue(true);
    const malformed = await DELETE_ONE(request(deviceUrl + "/invalid-id"), route("invalid-id"));
    expect(malformed.status).toBe(400);
    expect((await malformed.json()).error).toBe("INVALID_REQUEST");
    expect(revokeOwnSession).not.toHaveBeenCalled();
    expect(getCurrentDeviceSession).toHaveBeenCalledOnce();
  });

  it("AUTH-sessions-10 guessed foreign device does not become a success even when its UUID is syntactically valid", async () => {
    vi.mocked(revokeOwnSession).mockResolvedValue(false);
    const denied = await DELETE_ONE(request(deviceUrl + "/" + otherSessionId), route(otherSessionId));
    expect(denied.status).toBe(404);
    expect(await denied.json()).toEqual({ error: "SESSION_NOT_FOUND" });
    expect(revokeOwnSession).toHaveBeenCalledWith(otherSessionId, userId);
    expect(revokeOtherSessions).not.toHaveBeenCalled();
  });

  it("AUTH-sessions-10 an owned device is revoked and a simultaneous database outage cannot claim success", async () => {
    vi.mocked(revokeOwnSession).mockResolvedValueOnce(true).mockRejectedValueOnce(
      new Error("secret connection string"),
    );
    const first = await DELETE_ONE(request(deviceUrl + "/" + otherSessionId), route(otherSessionId));
    expect(first.status).toBe(200);
    expect(first.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await first.json()).toEqual({ ok: true });
    const second = await DELETE_ONE(request(deviceUrl + "/" + otherSessionId), route(otherSessionId));
    expect(second.status).toBe(503);
    expect(second.headers.get("x-request-id")).toBe("test-ref");
    expect(await second.text()).not.toContain("secret connection string");
    expect(revokeOwnSession).toHaveBeenCalledTimes(2);
  });
});
