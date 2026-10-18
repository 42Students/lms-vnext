import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/db/client";
import { tpoCampaignDraftStorageReady } from "@/modules/messaging/tpo-campaign-draft-service";
import {
  dispatchTpoCampaign, tpoCampaignDispatchReady,
} from "@/modules/messaging/tpo-campaign-dispatch-service";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("@/db/client", () => ({ getDb: vi.fn() }));
vi.mock("@/modules/messaging/tpo-campaign-draft-service", () => ({
  tpoCampaignDraftStorageReady: vi.fn(), getTpoCampaignDraft: vi.fn(),
}));

const userId = "11111111-1111-4111-8111-111111111111";
const collegeId = "22222222-2222-4222-8222-222222222222";
const context: RequestContext = {
  user: { id: userId, identityUid: userId, platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: "33333333-3333-4333-8333-333333333333",
    collegeId, organizationId: "44444444-4444-4444-8444-444444444444",
    status: "ACTIVE", roles: ["TPO"] },
};
const env = {
  TPO_CAMPAIGNS_READY: "VERIFIED",
  TPO_CAMPAIGN_ZEPTO_TEMPLATE_KEY: "campaign-outbound",
  TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET: "t".repeat(64),
  APP_PUBLIC_URL: "https://lms.example.org",
  ZEPTOMAIL_TOKEN: "  ",
  ZEPTOMAIL_OTP_TEMPLATE_KEY: "login-otp",
};
beforeEach(() => {
  vi.resetAllMocks();
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
  vi.mocked(tpoCampaignDraftStorageReady).mockResolvedValue(true);
});
afterEach(() => vi.unstubAllEnvs());

describe("chat-16 TPO campaign provider readiness cannot consume drafts on misconfiguration", () => {
  it("T-S2-04-CREDENTIAL-01 refuses whitespace-only mail credentials before querying or mutating", async () => {
    expect(await tpoCampaignDispatchReady()).toBe(false);
    await expect(dispatchTpoCampaign(context, collegeId))
      .rejects.toMatchObject({ code: "NOT_READY" });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("T-S2-04-CREDENTIAL-02 refuses authentication-template IDs even with valid mail token", async () => {
    vi.stubEnv("ZEPTOMAIL_TOKEN", "token-value");
    for (const template of ["auth.login", "login.otp", "magic-link", "password-reset"]) {
      vi.stubEnv("TPO_CAMPAIGN_ZEPTO_TEMPLATE_KEY", template);
      expect(await tpoCampaignDispatchReady()).toBe(false);
      expect(getDb).not.toHaveBeenCalled();
    }
  });

  it("T-S2-04-CREDENTIAL-03 invalid or credentialed public origin disables delivery", async () => {
    vi.stubEnv("ZEPTOMAIL_TOKEN", "token-value");
    for (const publicOrigin of [
      "http://lms.example.org", "https://person:password@lms.example.org",
      "https://lms.example.org/path?key=1", "javascript:alert(1)",
    ]) {
      vi.stubEnv("APP_PUBLIC_URL", publicOrigin);
      expect(await tpoCampaignDispatchReady()).toBe(false);
    }
    expect(getDb).not.toHaveBeenCalled();
  });
});
