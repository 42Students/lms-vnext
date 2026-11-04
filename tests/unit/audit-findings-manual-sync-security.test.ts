import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { POST } from "@/app/api/tracker/audit-findings/sync/route";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { requireRecentDeviceAuthentication } from "@/auth/recent-device-auth";
import { apiErrorResponse } from "@/lib/api-error";
import { requirePermission } from "@/modules/permissions/policy";
import {
  independentAuditImporterReady,
  syncIndependentAuditInbox,
} from "@/modules/bug-tracker/independent-audit-inbox-importer";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("@/auth/request-context", () => ({ getCurrentRequestContext: vi.fn() }));
vi.mock("@/auth/origin", () => ({ isSameOriginRequest: vi.fn() }));
vi.mock("@/auth/recent-device-auth", () => ({ requireRecentDeviceAuthentication: vi.fn() }));
vi.mock("@/lib/api-error", () => ({ apiErrorResponse: vi.fn() }));
vi.mock("@/modules/permissions/policy", () => ({
  AuthorizationError: class AuthorizationError extends Error {},
  requirePermission: vi.fn(),
}));
vi.mock("@/modules/bug-tracker/independent-audit-findings-service", () => ({
  readIndependentFindingSyncState: vi.fn(),
}));
vi.mock("@/modules/bug-tracker/independent-audit-github-client", () => ({
  independentAuditGithubConfigured: vi.fn(),
}));
vi.mock("@/modules/bug-tracker/independent-audit-inbox-importer", () => ({
  independentAuditImporterReady: vi.fn(),
  syncIndependentAuditInbox: vi.fn(),
}));

const actor: RequestContext = {
  user: {
    id: "11111111-1111-4111-8111-111111111111",
    identityUid: "test-superadmin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
  adminScope: null,
};

function request(body?: string, search = "", extraHeaders: Record<string, string> = {}) {
  return new Request(`https://lms.example.com/api/tracker/audit-findings/sync${search}`, {
    method: "POST",
    headers: { origin: "https://lms.example.com", host: "lms.example.com", ...extraHeaders },
    ...(body === undefined ? {} : { body }),
  });
}

describe("manual audit synchronization privilege boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(isSameOriginRequest).mockReturnValue(true);
    vi.mocked(getCurrentRequestContext).mockResolvedValue(actor);
    vi.mocked(requireRecentDeviceAuthentication).mockResolvedValue(undefined as never);
    vi.mocked(independentAuditImporterReady).mockReturnValue(true);
    vi.mocked(syncIndependentAuditInbox).mockResolvedValue({
      ran: true, busy: false, commit: "abc", imported: 1, updates: 0,
      refused: 0, tampered: 0, deleted: 0, message: "SUCCESS",
    });
    vi.mocked(apiErrorResponse).mockImplementation(() =>
      NextResponse.json({ error: "DENIED" }, { status: 403 }));
  });

  it("denies foreign Origin before resolving identity or touching importer", async () => {
    vi.mocked(isSameOriginRequest).mockReturnValueOnce(false);
    const response = await POST(request());
    expect(response.status).toBe(403);
    expect(getCurrentRequestContext).not.toHaveBeenCalled();
    expect(syncIndependentAuditInbox).not.toHaveBeenCalled();
  });

  it("rejects caller-supplied query or body before identity and writes", async () => {
    for (const input of [
      request(undefined, "?source=foreign"),
      request("{}"),
      request(undefined, "", { "content-length": "7" }),
      request(undefined, "", { "transfer-encoding": "chunked" }),
    ]) {
      const response = await POST(input);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "INVALID_REQUEST" });
    }
    expect(getCurrentRequestContext).not.toHaveBeenCalled();
    expect(syncIndependentAuditInbox).not.toHaveBeenCalled();
  });

  it("denies a normal user and scoped platform admin before importer", async () => {
    vi.mocked(getCurrentRequestContext).mockResolvedValueOnce({
      ...actor, user: { ...actor.user, systemRoles: [] },
    });
    expect((await POST(request())).status).toBe(403);
    vi.mocked(getCurrentRequestContext).mockResolvedValueOnce({
      ...actor, adminScope: {
        organizationId: "22222222-2222-4222-8222-222222222222",
        collegeId: null,
      },
    });
    expect((await POST(request())).status).toBe(403);
    expect(requireRecentDeviceAuthentication).not.toHaveBeenCalled();
    expect(syncIndependentAuditInbox).not.toHaveBeenCalled();
  });

  it("rejects stale or revoked device authentication without sync side effects", async () => {
    vi.mocked(requireRecentDeviceAuthentication).mockRejectedValueOnce(
      new Error("RECENT_SIGN_IN_REQUIRED"),
    );
    const response = await POST(request());
    expect(response.status).toBe(403);
    expect(requirePermission).toHaveBeenCalledWith(actor, "admin-scope.select");
    expect(requireRecentDeviceAuthentication).toHaveBeenCalledWith(actor.user.id);
    expect(syncIndependentAuditInbox).not.toHaveBeenCalled();
  });

  it("binds the exact authenticated actor to the importer transaction", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(requireRecentDeviceAuthentication).toHaveBeenCalledWith(actor.user.id);
    expect(syncIndependentAuditInbox).toHaveBeenCalledOnce();
    expect(syncIndependentAuditInbox).toHaveBeenCalledWith({
      kind: "SUPER_ADMIN", actor,
    });
  });

  it("refuses an unavailable importer after recent-auth but before mutation", async () => {
    vi.mocked(independentAuditImporterReady).mockReturnValueOnce(false);
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(requireRecentDeviceAuthentication).toHaveBeenCalledWith(actor.user.id);
    expect(syncIndependentAuditInbox).not.toHaveBeenCalled();
  });
});
