import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { hasAmbiguousQuerySelectors } from "@/lib/security-query-selectors";

const mocks = vi.hoisted(() => ({
  context: vi.fn(), origin: vi.fn(), superAdmin: vi.fn(),
  listActivity: vi.fn(), listNotifications: vi.fn(), unread: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/auth/request-context", () => ({
  getCurrentRequestContext: mocks.context,
}));
vi.mock("@/auth/origin", () => ({
  isSameOriginRequest: mocks.origin,
}));
vi.mock("@/modules/identity/context", () => ({
  isSuperAdmin: mocks.superAdmin,
}));
vi.mock("@/modules/activity/service", () => ({
  listActivityEvents: mocks.listActivity,
}));
vi.mock("@/modules/activity/notification-service", () => ({
  listOwnNotifications: mocks.listNotifications,
  countOwnUnreadNotifications: mocks.unread,
}));
vi.mock("@/lib/api-error", () => ({
  apiErrorResponse: () => NextResponse.json({ error: "FAIL_CLOSED" }, { status: 400 }),
}));

import { GET as getActivity } from "@/app/api/activity/route";
import { GET as getNotifications, POST as postNotifications } from "@/app/api/notifications/route";

const college = "11111111-1111-4111-8111-111111111111";
const user = "22222222-2222-4222-8222-222222222222";
const base = "https://college.example.test";
const ctx = { user: { id: user } };
const get = (route: string) => new Request(base + route);
const post = (route: string) => new Request(base + route, {
  method: "POST", headers: { host: "college.example.test", origin: base },
});
const privateError = async (response: Response) => {
  expect(response.status).toBe(400);
  expect(response.headers.get("cache-control")).toContain("no-store");
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.context.mockResolvedValue(ctx);
  mocks.origin.mockReturnValue(true);
  mocks.superAdmin.mockReturnValue(false);
  mocks.unread.mockResolvedValue(5);
  mocks.listNotifications.mockResolvedValue([]);
  mocks.listActivity.mockResolvedValue({ items: [], remainingCount: 0, nextCursor: null });
});

describe("shared selector ambiguity model", () => {
  it("flags duplicate values even if they are textually identical", () => {
    expect(hasAmbiguousQuerySelectors(new URLSearchParams("collegeId=a&collegeId=a"),
      ["collegeId"])).toBe(true);
  });
  it("flags competing aliases, including blank aliases", () => {
    expect(hasAmbiguousQuerySelectors(new URLSearchParams("actorUserId=&actorId=a"),
      ["actorUserId","actorId"], [["actorUserId","actorId"]])).toBe(true);
  });
  it("rejects a present-but-blank required tenant hint, but not an absent one", () => {
    expect(hasAmbiguousQuerySelectors(new URLSearchParams("collegeId=%20"),
      ["collegeId"], [], ["collegeId"])).toBe(true);
    expect(hasAmbiguousQuerySelectors(new URLSearchParams("limit=40"),
      ["collegeId","limit"], [], ["collegeId"])).toBe(false);
  });
});

describe("private activity-log query boundary", () => {
  it.each([
    "collegeId="+college+"&collegeId="+college,
    "organizationId=&limit=40",
    "actorUserId="+user+"&actorId="+user,
    "subjectType=learner&targetType=learner",
    "from=2026-10-01&startDate=2026-10-01",
    "to=2026-11-01&endDate=2026-11-01",
    "beforeId=&beforeOccurredAt=2026-11-01T12%3A00%3A00Z",
    "limit=20&limit=100",
  ])("denies ambiguous/empty audit selector %s before reading private rows", async suffix => {
    await privateError(await getActivity(get("/api/activity?" + suffix)));
    expect(mocks.listActivity).not.toHaveBeenCalled();
  });

  it("preserves a valid single-college audit filter and private result", async () => {
    const response = await getActivity(get("/api/activity?collegeId=" + college + "&limit=20"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(mocks.listActivity).toHaveBeenCalledWith(ctx, expect.objectContaining({
      collegeId: college, limit: "20",
    }));
  });
  it("preserves a single legacy alias without expanding its scope", async () => {
    const response = await getActivity(get("/api/activity?actorId=" + user));
    expect(response.status).toBe(200);
    expect(mocks.listActivity).toHaveBeenCalledWith(ctx, expect.objectContaining({
      actorUserId: user,
    }));
  });
});

describe("own-recipient notifications query boundary", () => {
  it.each([
    "view=search&view=stats",
    "query=a&q=b",
    "classId="+college+"&classId="+college,
    "courseId=",
    "limit=10&limit=20",
    "unreadOnly=yes",
    "unreadOnly=",
  ])("rejects ambiguous recipient filters %s before notification reads", async suffix => {
    await privateError(await getNotifications(get("/api/notifications?" + suffix)));
    expect(mocks.listNotifications).not.toHaveBeenCalled();
    expect(mocks.unread).not.toHaveBeenCalled();
  });

  it("preserves own-notifications filtering with one trusted selector", async () => {
    const response = await getNotifications(get(
      "/api/notifications?view=search&unreadOnly=true&classId="+college+"&query=hello&limit=15",
    ));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(mocks.listNotifications).toHaveBeenCalledWith(ctx, {
      unreadOnly: true, limit: 15, query: "hello", classId: college,
    });
  });
  it("preserves own-notification stats for normal authenticated users", async () => {
    const response = await getNotifications(get("/api/notifications?view=stats"));
    expect(response.status).toBe(200);
    expect(mocks.unread).toHaveBeenCalledWith(ctx);
    expect((await response.json()).data.unread).toBe(5);
  });
  it("rejects repeated legacy refresh selectors before privilege inspection", async () => {
    await privateError(await postNotifications(post("/api/notifications?view=refresh&view=stats")));
    expect(mocks.superAdmin).not.toHaveBeenCalled();
  });
  it("retains cross-origin denial for legacy refresh", async () => {
    mocks.origin.mockReturnValue(false);
    const response = await postNotifications(post("/api/notifications?view=refresh"));
    expect(response.status).toBe(403);
    expect(mocks.context).not.toHaveBeenCalled();
  });
});
