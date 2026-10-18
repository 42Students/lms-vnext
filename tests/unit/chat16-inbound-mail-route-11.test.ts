import { beforeEach, describe, expect, it, vi } from "vitest";
import { isSameOriginRequest } from "@/auth/origin";
import { getCurrentRequestContext } from "@/auth/request-context";
import { changeInboundMailStatusForAdmin } from "@/modules/inbound-mail/admin-service";
import { apiErrorResponse } from "@/lib/api-error";
import { PATCH } from "@/app/api/admin/inbound-mail/status/route";

vi.mock("@/auth/origin", () => ({ isSameOriginRequest: vi.fn() }));
vi.mock("@/auth/request-context", () => ({ getCurrentRequestContext: vi.fn() }));
vi.mock("@/modules/inbound-mail/admin-service", () => ({
  changeInboundMailStatusForAdmin: vi.fn(),
}));
vi.mock("@/lib/api-error", () => ({ apiErrorResponse: vi.fn() }));

const id = "11111111-1111-4111-8111-111111111111";
const actor = {
  user: { id, identityUid: id, platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] },
  membership: null, adminScope: null,
};
const body = { id, expectedStatus: "NEW", expectedVersion: 3, status: "RESOLVED" };
const req = (value: unknown) => new Request(
  "https://lms.example.org/api/admin/inbound-mail/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Origin: "https://lms.example.org" },
    body: JSON.stringify(value),
  },
);
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(isSameOriginRequest).mockReturnValue(true);
  vi.mocked(getCurrentRequestContext).mockResolvedValue(actor as never);
  vi.mocked(apiErrorResponse).mockReturnValue(new Response(
    JSON.stringify({ error: "FORBIDDEN" }), { status: 403 },
  ) as never);
});

describe("chat-16 private inbound-mail mutation route break-it tests", () => {
  it("HR-BREAK-INBOUND-ROUTE-01 rejects cross-site PATCH before parsing JSON or resolving account", async () => {
    vi.mocked(isSameOriginRequest).mockReturnValue(false);
    const response = await PATCH(req(body));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "INVALID_ORIGIN" });
    expect(getCurrentRequestContext).not.toHaveBeenCalled();
    expect(changeInboundMailStatusForAdmin).not.toHaveBeenCalled();
  });

  it("HR-BREAK-INBOUND-ROUTE-02 dispatches only the authenticated context and submitted CAS token", async () => {
    vi.mocked(changeInboundMailStatusForAdmin).mockResolvedValue({
      kind: "UPDATED", id, version: 4, status: "RESOLVED",
    } as never);
    const response = await PATCH(req(body));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      kind: "UPDATED", id, version: 4, status: "RESOLVED",
    });
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(changeInboundMailStatusForAdmin).toHaveBeenCalledWith(actor, body);
  });

  it("HR-BREAK-INBOUND-ROUTE-03 maps stale tab without pretending the write succeeded", async () => {
    vi.mocked(changeInboundMailStatusForAdmin).mockResolvedValue({ kind: "STALE" } as never);
    const response = await PATCH(req(body));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "MESSAGE_CHANGED" });
  });

  it("HR-BREAK-INBOUND-ROUTE-04 storage missing is a retryable unavailable state, not an empty result", async () => {
    vi.mocked(changeInboundMailStatusForAdmin).mockResolvedValue({ kind: "UNAVAILABLE" } as never);
    const response = await PATCH(req(body));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "INBOUND_MAIL_STORAGE_UNAVAILABLE" });
  });

  it("HR-BREAK-INBOUND-ROUTE-05 expired/wrong-role actor returns bounded error without leaking private mail", async () => {
    vi.mocked(getCurrentRequestContext).mockRejectedValue(new Error("internal session secret"));
    const response = await PATCH(req(body));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "FORBIDDEN" });
    expect(changeInboundMailStatusForAdmin).not.toHaveBeenCalled();
    expect(apiErrorResponse).toHaveBeenCalledOnce();
  });
});
