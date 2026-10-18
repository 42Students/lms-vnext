import { describe, expect, it } from "vitest";
import { campaignFilterSchema, campaignFilterHref } from "@/modules/messaging/campaign-filter-model";
import { campaignSourceSchema } from "@/modules/messaging/campaign-source-model";
import {
  engageAudienceQuerySchema, summarizeEngageAudience,
} from "@/modules/messaging/engage-audience-model";
import {
  tpoCampaignHistoryTime, tpoCampaignHistoryStatus,
} from "@/modules/messaging/tpo-campaign-history-copy";
import {
  issueUnsubscribeToken, verifyUnsubscribeToken, unsubscribeConfirmation,
} from "@/modules/messaging/unsubscribe-model";
import { isCampaignTemplateKey } from "@/modules/messaging/template-boundary-model";
import { planTpoCampaignRecipients } from "@/modules/messaging/tpo-campaign-send-policy";

const secret = "secure-hmac-secret".repeat(4);
const claim = { version: 1 as const, recipientKey: "a".repeat(64), expiresAt: 2000 };
const baseContact = {
  id: "lead-1", emailNorm: "a@example.org", manualStage: "NEW",
  ownerMembershipId: null, unsubscribedAt: null, inviteBouncedAt: null,
};

describe("chat-16 campaign source, filters, recipient consent, and IST time behavior", () => {
  it("MSG-MODEL-FILTER-01 rejects unknown filters and canonicalizes bounded search query", () => {
    expect(campaignFilterSchema.parse({})).toEqual({
      state: "ALL", search: "", page: 1,
    });
    const url = campaignFilterHref({
      state: "NEEDS_FOLLOW_UP", search: "  A&B + referral  ", page: 2,
    });
    expect(url.startsWith("/tpo/recruiters?")).toBe(true);
    const parsed = new URL(url, "https://lms.example.org");
    expect(parsed.searchParams.get("q")).toBe("A&B + referral");
    expect(parsed.searchParams.get("page")).toBe("2");
    for (const invalid of [
      { state: "SEND_ALL" }, { page: 0 }, { page: 10001 },
      { search: "x".repeat(101) }, { role: "SUPER_ADMIN" },
    ]) expect(campaignFilterSchema.safeParse(invalid).success).toBe(false);
  });

  it("MSG-MODEL-SOURCE-02 mandatory OTHER source detail cannot be forged by unknown fields", () => {
    expect(campaignSourceSchema.safeParse({
      source: "OTHER",
    }).success).toBe(false);
    expect(campaignSourceSchema.safeParse({
      source: "OTHER", sourceDetail: "  ",
    }).success).toBe(false);
    expect(campaignSourceSchema.parse({
      source: "OTHER", sourceDetail: "  Placement event  ",
    })).toMatchObject({ sourceDetail: "Placement event" });
    expect(campaignSourceSchema.safeParse({
      source: "REFERRAL", sourceDetail: "Alumni", hidden: "admin",
    }).success).toBe(false);
    expect(campaignSourceSchema.safeParse({
      source: "OTHER", sourceDetail: "x".repeat(201),
    }).success).toBe(false);
  });

  it("MSG-MODEL-ENGAGE-03 suppresses opted-out, bounced and missing-address recipients by segment", () => {
    const rows = [
      baseContact,
      { ...baseContact, id: "lead-2", emailNorm: null },
      { ...baseContact, id: "lead-3", unsubscribedAt: new Date(0) },
      { ...baseContact, id: "lead-4", inviteBouncedAt: new Date(0) },
      { ...baseContact, id: "lead-5", manualStage: "NOT_NOW" },
      { ...baseContact, id: "lead-6", manualStage: "CONTACTED" },
      { ...baseContact, id: "lead-7", ownerMembershipId: "another-member" },
    ];
    expect(engageAudienceQuerySchema.safeParse({ segment: "OTHER" }).success).toBe(false);
    expect(summarizeEngageAudience(rows, "NEW")).toEqual({
      total: 7, eligible: 2, withoutEmail: 1, unsubscribed: 1, bounced: 1,
      notNow: 0, outsideSegment: 2,
    });
    expect(summarizeEngageAudience(rows, "UNASSIGNED")).toEqual({
      total: 7, eligible: 2, withoutEmail: 1, unsubscribed: 1, bounced: 1,
      notNow: 1, outsideSegment: 1,
    });
  });

  it("MSG-MODEL-IST-04 formats midnight crossing in IST without relying on browser locale", () => {
    const formatted = tpoCampaignHistoryTime(new Date("2026-10-18T18:40:00.000Z"));
    expect(formatted).toContain("00:10");
    expect(formatted).toContain("19 Oct 2026");
    expect(tpoCampaignHistoryStatus("SENT")).toBe("Sent");
    expect(tpoCampaignHistoryStatus("FORGED")).toBe("Recorded");
  });

  it("MSG-MODEL-UNSUBSCRIBE-05 verifies exact expiring HMAC, denies tamper, and never mutates on GET", () => {
    const token = issueUnsubscribeToken(claim, secret);
    expect(verifyUnsubscribeToken(token, secret, 1999)).toEqual(claim);
    expect(verifyUnsubscribeToken(token, secret, 2000)).toBeNull();
    expect(verifyUnsubscribeToken(token + ".extra", secret, 1999)).toBeNull();
    expect(verifyUnsubscribeToken(token, "short", 1999)).toBeNull();
    const [payload, mac] = token.split(".");
    expect(verifyUnsubscribeToken(payload + "A." + mac, secret, 1999)).toBeNull();
    expect(unsubscribeConfirmation(token, secret, 1999)).toEqual({
      canConfirm: true, willUnsubscribeOnView: false,
    });
    expect(unsubscribeConfirmation(token, secret, 2000).canConfirm).toBe(false);
  });

  it("MSG-MODEL-TEMPLATE-06 authentication templates cannot silently become campaign templates", () => {
    for (const key of ["login.otp", "account/password", "mfa.verify", "auth-reset", "magic-link"]) {
      expect(isCampaignTemplateKey(key)).toBe(false);
    }
    expect(isCampaignTemplateKey("campaign.recruiter-update")).toBe(true);
    expect(isCampaignTemplateKey("")).toBe(false);
    expect(isCampaignTemplateKey(" bad space ")).toBe(false);
  });
  it("T-S2-04 preview and send policy agree on whitespace, bounce and unsubscribe suppression precedence", () => {
    const contacts = [
      { ...baseContact, id: "lead-a", emailNorm: "  " },
      { ...baseContact, id: "lead-b", emailNorm: "  ", inviteBouncedAt: new Date(0) },
      { ...baseContact, id: "lead-c", emailNorm: "  ", unsubscribedAt: new Date(0) },
      { ...baseContact, id: "lead-d", emailNorm: "  ", manualStage: "NOT_NOW" },
      { ...baseContact, id: "lead-e", emailNorm: "eligible@example.org" },
    ];
    const preview = summarizeEngageAudience(contacts, "ALL_ELIGIBLE");
    const dispatch = planTpoCampaignRecipients(contacts);
    expect(preview).toMatchObject({
      total: 5, eligible: 1, withoutEmail: 3,
      unsubscribed: 1, bounced: 0, notNow: 0,
    });
    expect(dispatch.recipientIds).toEqual(["lead-e"]);
    expect(dispatch.suppressed).toMatchObject({
      NO_EMAIL: preview.withoutEmail, UNSUBSCRIBED: preview.unsubscribed,
      BOUNCED: preview.bounced, NOT_NOW: preview.notNow,
    });
  });

});
