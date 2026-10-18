import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/db/client";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import {
  createTpoCampaignDraft, getTpoCampaignDraft, listTpoCampaignDrafts,
  listTpoCampaignRecipientStatuses,
} from "@/modules/messaging/tpo-campaign-draft-service";
import {
  CAMPAIGN_DELIVERY_UNAVAILABLE, CAMPAIGN_DRAFT_UNAVAILABLE,
  previewTpoCampaignText, tpoCampaignDraftSchema,
} from "@/modules/messaging/tpo-campaign-draft-model";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("@/db/client", () => ({ getDb: vi.fn() }));
vi.mock("@/modules/placements/scope", () => ({ requirePlacementManageScope: vi.fn() }));

const collegeId = "11111111-1111-4111-8111-111111111111";
const orgId = "22222222-2222-4222-8222-222222222222";
const campaignId = "33333333-3333-4333-8333-333333333333";
const leadId = "44444444-4444-4444-8444-444444444444";
const ctx: RequestContext = {
  user: { id: "tpo-user", identityUid: "id-a", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: "tpo-membership", collegeId, organizationId: orgId,
    status: "ACTIVE", roles: ["TPO"] },
};
const draft = {
  title: "Recruiter outreach", subject: "Placement opportunity",
  body: "Hello {name} at {company}", segment: "ALL_ELIGIBLE" as const,
  templateKey: "campaign.recruiter-outreach", selectedLeadIds: [leadId],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("DB09_TPO_API_READY", "");
  vi.mocked(requirePlacementManageScope).mockResolvedValue({
    id: collegeId, organizationId: orgId,
  } as Awaited<ReturnType<typeof requirePlacementManageScope>>);
});
afterEach(() => vi.unstubAllEnvs());

describe("chat-16 campaign draft services when privileged infrastructure is unavailable", () => {
  it("MESSAGING-DRAFT-SCHEMA-16 rejects unsafe OTP templates, forged scopes and invalid selection", () => {
    expect(tpoCampaignDraftSchema.parse(draft)).toEqual(draft);
    for (const raw of [
      { ...draft, title: " " }, { ...draft, subject: "s" },
      { ...draft, templateKey: "auth.otp" },
      { ...draft, selectedLeadIds: [leadId, leadId] },
      { ...draft, selectedLeadIds: ["/admin"] },
      { ...draft, collegeId: "foreign" },
      { ...draft, body: "x".repeat(10001) },
    ]) expect(tpoCampaignDraftSchema.safeParse(raw).success).toBe(false);
  });

  it("MESSAGING-DRAFT-PREVIEW-16 expands only the two text placeholders and never renders HTML", () => {
    expect(previewTpoCampaignText(draft.body, {
      name: "Jane", company: "Company A",
    })).toBe("Hello Jane at Company A");
    expect(previewTpoCampaignText("<b>{name}</b>", {
      name: "<script>alert(1)</script>", company: "Acme",
    })).toBe("<b><script>alert(1)</script></b>");
    expect(() => previewTpoCampaignText("x".repeat(10001), {
      name: "Jane", company: "Acme",
    })).toThrow("CAMPAIGN_BODY_TOO_LONG");
    expect(CAMPAIGN_DRAFT_UNAVAILABLE).toMatch(/not ready/i);
    expect(CAMPAIGN_DELIVERY_UNAVAILABLE).toMatch(/not enabled/i);
  });

  it("MESSAGING-DRAFT-CREATE-16 validates before scope and denies absent persisted campaign storage", async () => {
    await expect(createTpoCampaignDraft(ctx, {
      ...draft, templateKey: "auth.password-reset",
    })).rejects.toThrow();
    expect(requirePlacementManageScope).not.toHaveBeenCalled();
    await expect(createTpoCampaignDraft(ctx, draft))
      .rejects.toMatchObject({ code: "NOT_READY" });
    expect(requirePlacementManageScope).toHaveBeenCalledWith(ctx, collegeId);
    expect(getDb).not.toHaveBeenCalled();
  });

  it("MESSAGING-DRAFT-READ-16 returns unavailable rather than fake zero draft records", async () => {
    await expect(listTpoCampaignDrafts(ctx)).resolves.toEqual({
      ready: false, rows: [],
    });
    await expect(getTpoCampaignDraft(ctx, campaignId)).resolves.toBeNull();
    await expect(listTpoCampaignRecipientStatuses(ctx, campaignId))
      .resolves.toEqual({ ready: false, rows: [] });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("MESSAGING-DRAFT-DENY-16 denies removed TPO and malformed IDs before touching private storage", async () => {
    const wrong: RequestContext = {
      ...ctx, membership: { ...ctx.membership!, roles: ["LEARNER"] },
    };
    await expect(listTpoCampaignDrafts(wrong)).rejects.toThrow();
    await expect(createTpoCampaignDraft(wrong, draft)).rejects.toThrow();
    await expect(listTpoCampaignRecipientStatuses(wrong, campaignId)).rejects.toThrow();
    await expect(listTpoCampaignRecipientStatuses(ctx, "../campaign")).rejects.toThrow();
    await expect(getTpoCampaignDraft(ctx, "not-an-id")).resolves.toBeNull();
    expect(getDb).not.toHaveBeenCalled();
  });
});
