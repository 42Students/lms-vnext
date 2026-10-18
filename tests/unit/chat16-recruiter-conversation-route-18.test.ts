import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  acknowledgeRecruiterThreads, openRecruiterMessageThread,
} from "@/modules/placements/tpo-messaging-service";
import { POST as acknowledge } from "@/app/api/placements/recruiter/conversations/acknowledge/route";
import { POST as open } from "@/app/api/placements/recruiter/conversations/open/route";

vi.mock("@/auth/request-context", () => ({ getCurrentRequestContext: vi.fn() }));
vi.mock("@/auth/origin", () => ({ isSameOriginRequest: vi.fn() }));
vi.mock("@/lib/api-error", () => ({ apiErrorResponse: vi.fn() }));
vi.mock("@/modules/placements/tpo-messaging-service", () => ({
  acknowledgeRecruiterThreads: vi.fn(), openRecruiterMessageThread: vi.fn(),
  TpoMessagingError: class TpoMessagingError extends Error {},
}));

const userId = "11111111-1111-4111-8111-111111111111";
const collegeId = "22222222-2222-4222-8222-222222222222";
const threadId = "33333333-3333-4333-8333-333333333333";
const context = {
  user: { id: userId, identityUid: userId, platformStatus: "ACTIVE", systemRoles: [] },
  membership: null,
  recruiter: {
    userId, companyId: collegeId, companyName: "Company", title: null,
    status: "ACTIVE", grants: [],
  },
};
const req = (action: "open" | "acknowledge", fields: Record<string, string> = {}) =>
  new Request("https://lms.example.org/api/placements/recruiter/conversations/" + action, {
    method: "POST",
    headers: {
      Origin: "https://lms.example.org",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(action === "open" ? {
      collegeId, ...fields,
    } : { threadId, ...fields }).toString(),
  });
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCurrentRequestContext).mockResolvedValue(context as never);
  vi.mocked(isSameOriginRequest).mockReturnValue(true);
  vi.mocked(apiErrorResponse).mockReturnValue(new Response(
    JSON.stringify({ error: "SESSION_EXPIRED", message: "Sign in again." }),
    { status: 401, headers: { "Content-Type": "application/json" } },
  ) as never);
});

describe("chat-16 recruiter conversations route-level expired session and CSRF journeys", () => {
  it.each(["open", "acknowledge"] as const)(
    "HR-BREAK-SESSION-09/10 %s rejects cross-origin before reading account or touching messages",
    async action => {
      vi.mocked(isSameOriginRequest).mockReturnValue(false);
      const response = await (action === "open" ? open(req(action)) : acknowledge(req(action)));
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: "INVALID_ORIGIN" });
      expect(getCurrentRequestContext).not.toHaveBeenCalled();
      expect(openRecruiterMessageThread).not.toHaveBeenCalled();
      expect(acknowledgeRecruiterThreads).not.toHaveBeenCalled();
    },
  );

  it.each(["open", "acknowledge"] as const)(
    "HR-BREAK-SESSION-09/10 %s returns friendly 401 when session is revoked before mutation",
    async action => {
      vi.mocked(getCurrentRequestContext).mockRejectedValue(new Error("private-session-secret"));
      const response = await (action === "open" ? open(req(action)) : acknowledge(req(action)));
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        error: "SESSION_EXPIRED", message: "Sign in again.",
      });
      expect(apiErrorResponse).toHaveBeenCalledOnce();
      expect(openRecruiterMessageThread).not.toHaveBeenCalled();
      expect(acknowledgeRecruiterThreads).not.toHaveBeenCalled();
    },
  );

  it.each(["open", "acknowledge"] as const)(
    "HR-BREAK-ROLE-11 %s denies missing recruiter account without touching message service",
    async action => {
      vi.mocked(getCurrentRequestContext).mockResolvedValue({
        ...context, recruiter: null,
      } as never);
      const response = await (action === "open" ? open(req(action)) : acknowledge(req(action)));
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: "FORBIDDEN" });
      expect(openRecruiterMessageThread).not.toHaveBeenCalled();
      expect(acknowledgeRecruiterThreads).not.toHaveBeenCalled();
    },
  );

  it("HR-BREAK-CONVERSATIONS-12 invalid open-thread UUID never resolves session or hits storage", async () => {
    const response = await open(req("open", { collegeId: "invalid" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "INVALID_BODY" });
    expect(getCurrentRequestContext).not.toHaveBeenCalled();
    expect(openRecruiterMessageThread).not.toHaveBeenCalled();
  });

  it("HR-BREAK-CONVERSATIONS-13 valid open redirects only to its first-party thread", async () => {
    vi.mocked(openRecruiterMessageThread).mockResolvedValue({ id: threadId } as never);
    const response = await open(req("open"));
    expect(response.status).toBe(303);
    expect(response.headers.get("location"))
      .toBe("https://lms.example.org/hr/conversations/" + threadId);
  });

  it("HR-BREAK-CONVERSATIONS-14 read acknowledgement strips external returnTo destination", async () => {
    vi.mocked(acknowledgeRecruiterThreads).mockResolvedValue(undefined as never);
    const response = await acknowledge(req("acknowledge", {
      returnTo: "https://attacker.example.org/collect",
    }));
    expect(response.status).toBe(303);
    expect(response.headers.get("location"))
      .toBe("https://lms.example.org/hr/conversations");
  });
});
