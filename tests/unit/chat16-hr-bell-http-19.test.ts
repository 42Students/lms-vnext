import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  readHrRecruiterBell, markHrRecruiterBellRead,
} from "@/modules/placements/hr-recruiter-bell-service";
import { GET, POST } from "@/app/api/placements/recruiter/bell/route";

vi.mock("@/auth/request-context", () => ({ getCurrentRequestContext: vi.fn() }));
vi.mock("@/auth/origin", () => ({ isSameOriginRequest: vi.fn() }));
vi.mock("@/lib/api-error", () => ({ apiErrorResponse: vi.fn() }));
vi.mock("@/modules/placements/hr-recruiter-bell-service", () => ({
  readHrRecruiterBell: vi.fn(), markHrRecruiterBellRead: vi.fn(),
}));

const actor = {
  user: { id: "u-1", identityUid: "identity-u-1",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: null,
  recruiter: { userId: "u-1", companyId: "company-1", companyName: "Company",
    status: "ACTIVE", title: null, grants: [] },
};
const req = () => new Request("https://lms.example.org/api/placements/recruiter/bell", {
  method: "POST",
  headers: { Origin: "https://lms.example.org", "Content-Type": "application/json" },
  body: "{}",
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(isSameOriginRequest).mockReturnValue(true);
  vi.mocked(getCurrentRequestContext).mockResolvedValue(actor as never);
  vi.mocked(apiErrorResponse).mockReturnValue(new Response(
    JSON.stringify({ error: "SESSION_EXPIRED", message: "Sign in again." }),
    { status: 401, headers: { "content-type": "application/json" } },
  ) as never);
});

describe("chat-16 recruiter bell real route permissions, privacy and idempotent response", () => {
  it("HR-BELL-HTTP-01 GET projects only authorized notifications in private cache", async () => {
    vi.mocked(readHrRecruiterBell).mockResolvedValue({
      status: "READY", unread: 1, items: [{
        id: "n-1", label: "New message", unread: true,
        at: "2026-10-18T12:00:00.000Z", href: "/hr/conversations",
      }],
    } as never);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toMatchObject({ unread: 1 });
    expect(readHrRecruiterBell).toHaveBeenCalledWith(actor);
    expect(markHrRecruiterBellRead).not.toHaveBeenCalled();
  });

  it("HR-BELL-HTTP-02 POST rejects forged origins before session and mutation", async () => {
    vi.mocked(isSameOriginRequest).mockReturnValue(false);
    const response = await POST(req());
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "INVALID_ORIGIN" });
    expect(getCurrentRequestContext).not.toHaveBeenCalled();
    expect(markHrRecruiterBellRead).not.toHaveBeenCalled();
  });

  it("HR-BELL-HTTP-03 duplicate read submits may safely return zero updated rows", async () => {
    vi.mocked(markHrRecruiterBellRead).mockResolvedValue({ marked: 0 } as never);
    const response = await POST(req());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ marked: 0 });
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(markHrRecruiterBellRead).toHaveBeenCalledWith(actor);
  });

  it("HR-BELL-HTTP-04 expired sessions map to customer-safe error without mutation", async () => {
    vi.mocked(getCurrentRequestContext).mockRejectedValue(new Error("private-session-token"));
    const response = await POST(req());
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "SESSION_EXPIRED", message: "Sign in again.",
    });
    expect(markHrRecruiterBellRead).not.toHaveBeenCalled();
    expect(apiErrorResponse).toHaveBeenCalledOnce();
  });

  it("HR-BELL-HTTP-05 failed read cannot expose cached notifications from another college", async () => {
    vi.mocked(readHrRecruiterBell).mockRejectedValue(new Error("private-message"));
    const response = await GET();
    expect(response.status).toBe(401);
    expect(await response.json()).not.toHaveProperty("items");
    expect(apiErrorResponse).toHaveBeenCalledOnce();
  });
});
