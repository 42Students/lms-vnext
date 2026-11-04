import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isSameOriginRequest } from "@/auth/origin";
import {
  previewRecruiterInvite,
  recordRecruiterInviteFirstOpen,
  markRecruiterInviteNotHiring,
  unsubscribeRecruiterInvite,
} from "@/modules/placements/tpo-recruiter-invite-service";
import { GET as preview } from "@/app/api/public/recruiter-invite/[token]/route";
import { POST as opened } from "@/app/api/public/recruiter-invite/[token]/opened/route";
import { POST as unsubscribe } from "@/app/api/public/recruiter-invite/[token]/unsubscribe/route";
import { POST as notHiring } from "@/app/api/public/recruiter-invite/[token]/not-hiring/route";
import { POST as sendCode } from "@/app/api/public/recruiter-invite/[token]/send-code/route";
import { POST as accept } from "@/app/api/public/recruiter-invite/[token]/accept/route";

vi.mock("@/auth/origin", () => ({ isSameOriginRequest: vi.fn() }));
vi.mock("@/modules/placements/tpo-recruiter-invite-service", () => ({
  previewRecruiterInvite: vi.fn(),
  recordRecruiterInviteFirstOpen: vi.fn(),
  markRecruiterInviteNotHiring: vi.fn(),
  unsubscribeRecruiterInvite: vi.fn(),
}));

const token = "a".repeat(43);
const params = { params: Promise.resolve({ token }) };
const base = "https://college.example.edu/api/public/recruiter-invite/" + token;
const post = (suffix: string, options: { body?: BodyInit; contentType?: string; query?: string } = {}) =>
  new Request(base + suffix + (options.query ?? ""), {
    method: "POST",
    headers: { host: "college.example.edu", origin: "https://college.example.edu",
      ...(options.contentType ? { "content-type": options.contentType } : {}) },
    ...(options.body === undefined ? {} : { body: options.body }),
  });
const assertPrivate = (response: Response) => {
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("referrer-policy")).toBe("no-referrer");
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("DB09_TPO_API_READY", "DB09_VERIFIED");
  vi.stubEnv("TPO_RECRUITER_OTP_READY", "VERIFIED");
  vi.stubEnv("TPO_RECRUITER_OTP_DELIVERY_READY", "VERIFIED");
  vi.mocked(isSameOriginRequest).mockReturnValue(true);
  vi.mocked(previewRecruiterInvite).mockResolvedValue({
    collegeName: "College", companyName: "Employer", contactName: "Recruiter",
    contactEmail: "person@example.org", email: "person@example.org",
    reviewDrive: null, designation: null, expiresAt: new Date("2099-01-01T00:00:00Z"),
  });
  vi.mocked(recordRecruiterInviteFirstOpen).mockResolvedValue({ recorded: false });
  vi.mocked(unsubscribeRecruiterInvite).mockResolvedValue({ status: "UNSUBSCRIBED" });
  vi.mocked(markRecruiterInviteNotHiring).mockResolvedValue({ status: "NOT_HIRING" });
});
afterEach(() => vi.unstubAllEnvs());

describe("public recruiter invitation bearer-token confidentiality", () => {
  it("makes preview PII uncacheable and nonindexable without changing read-only behavior", async () => {
    const response = await preview(new Request(base), params);
    expect(response.status).toBe(200);
    assertPrivate(response);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect((await response.json()).invite.contactEmail).toBe("person@example.org");
    expect(previewRecruiterInvite).toHaveBeenCalledOnce();
    expect(recordRecruiterInviteFirstOpen).not.toHaveBeenCalled();
  });

  it("rejects malformed bearer links without querying private lead records", async () => {
    const bad = { params: Promise.resolve({ token: "../bad" }) };
    const response = await preview(new Request(base), bad);
    expect(response.status).toBe(404);
    assertPrivate(response);
    expect(previewRecruiterInvite).not.toHaveBeenCalled();
  });

  it("keeps successful no-argument open and unsubscribe actions functional", async () => {
    const opening = await opened(post("/opened", { body: "{}", contentType: "application/json" }), params);
    const optout = await unsubscribe(post("/unsubscribe"), params);
    expect(opening.status).toBe(200);
    expect(optout.status).toBe(200);
    assertPrivate(opening);
    assertPrivate(optout);
    expect(recordRecruiterInviteFirstOpen).toHaveBeenCalledWith(token);
    expect(unsubscribeRecruiterInvite).toHaveBeenCalledWith(token);
  });

  it("does not allow a public bearer link to select a different target or action", async () => {
    const badOpen = await opened(post("/opened", { query: "?collegeId=foreign" }), params);
    const badUnsubscribe = await unsubscribe(post("/unsubscribe", {
      body: '{"organizationId":"foreign"}', contentType: "application/json",
    }), params);
    expect(badOpen.status).toBe(400);
    expect(badUnsubscribe.status).toBe(400);
    assertPrivate(badOpen);
    assertPrivate(badUnsubscribe);
    expect(recordRecruiterInviteFirstOpen).not.toHaveBeenCalled();
    expect(unsubscribeRecruiterInvite).not.toHaveBeenCalled();
  });

  it("blocks oversized streams before they reach a public invite write", async () => {
    const response = await opened(post("/opened", {
      body: " ".repeat(300), contentType: "application/json",
    }), params);
    expect(response.status).toBe(413);
    assertPrivate(response);
    expect(recordRecruiterInviteFirstOpen).not.toHaveBeenCalled();
  });

  it("preserves validated decline notes while refusing unsupported and extra fields", async () => {
    const good = await notHiring(post("/not-hiring", {
      body: JSON.stringify({ note: "Hiring paused" }), contentType: "application/json",
    }), params);
    expect(good.status).toBe(200);
    assertPrivate(good);
    expect(markRecruiterInviteNotHiring).toHaveBeenCalledWith(token, expect.any(Date), "Hiring paused");
    vi.mocked(markRecruiterInviteNotHiring).mockClear();
    const unsupported = await notHiring(post("/not-hiring", {
      body: '{"note":"ignored"}', contentType: "text/plain",
    }), params);
    const extra = await notHiring(post("/not-hiring", {
      body: '{"note":"ok","manualStage":"JOINED"}', contentType: "application/json",
    }), params);
    expect(unsupported.status).toBe(415);
    expect(extra.status).toBe(400);
    assertPrivate(unsupported);
    assertPrivate(extra);
    expect(markRecruiterInviteNotHiring).not.toHaveBeenCalled();
  });

  it("returns no-store errors on cross-origin and unready OTP routes", async () => {
    vi.mocked(isSameOriginRequest).mockReturnValue(false);
    const crossOrigin = await sendCode(post("/send-code"), params);
    expect(crossOrigin.status).toBe(403);
    assertPrivate(crossOrigin);
    vi.mocked(isSameOriginRequest).mockReturnValue(true);
    vi.stubEnv("DB09_TPO_API_READY", "");
    const unavailable = await accept(post("/accept"), params);
    expect(unavailable.status).toBe(503);
    assertPrivate(unavailable);
  });
});
