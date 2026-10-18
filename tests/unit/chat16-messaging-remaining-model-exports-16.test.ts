import { describe, expect, it } from "vitest";
import { campaignFilterHref, campaignFilterSchema } from "@/modules/messaging/campaign-filter-model";
import { campaignSourceSchema } from "@/modules/messaging/campaign-source-model";
import {
  engageAudienceQuerySchema, summarizeEngageAudience,
  type EngageContact,
} from "@/modules/messaging/engage-audience-model";
import { isCampaignTemplateKey } from "@/modules/messaging/template-boundary-model";
import {
  tpoCampaignHistoryTime, tpoCampaignHistoryStatus,
} from "@/modules/messaging/tpo-campaign-history-copy";
import { tpoCampaignUnsubscribeEvent } from "@/modules/messaging/tpo-campaign-unsubscribe-notification-model";
import {
  issueUnsubscribeToken, unsubscribeConfirmation, verifyUnsubscribeToken,
} from "@/modules/messaging/unsubscribe-model";

describe("chat-16 messaging audience, history and token model contracts", () => {
  it("MESSAGING-FILTER-16 validates allowed filters and builds encoded recruiter links", () => {
    expect(campaignFilterSchema.parse({})).toEqual({ state: "ALL", search: "", page: 1 });
    expect(campaignFilterHref({ state: "NEEDS_FOLLOW_UP", search: " A&B ", page: "2" }))
      .toBe("/tpo/recruiters?state=NEEDS_FOLLOW_UP&page=2&q=A%26B");
    for (const raw of [
      { state: "ALL", page: 0 }, { state: "DELETED" }, { page: 10001 },
      { search: "a".repeat(101) }, { collegeId: "victim-college" },
    ]) {
      expect(campaignFilterSchema.safeParse(raw).success).toBe(false);
      expect(() => campaignFilterHref(raw)).toThrow();
    }
  });

  it("MESSAGING-SOURCE-16 requires details for Other but forbids arbitrary source fields", () => {
    expect(campaignSourceSchema.parse({
      source: "OTHER", sourceDetail: "  Career fair contact  ",
    })).toEqual({ source: "OTHER", sourceDetail: "Career fair contact" });
    expect(campaignSourceSchema.parse({ source: "REFERRAL" })).toEqual({ source: "REFERRAL" });
    for (const raw of [
      { source: "OTHER" }, { source: "OTHER", sourceDetail: "   " },
      { source: "UNVERIFIED" }, { source: "DIRECTORY", foreignCollege: "x" },
      { source: "OTHER", sourceDetail: "x".repeat(201) },
    ]) expect(campaignSourceSchema.safeParse(raw).success).toBe(false);
  });

  it("MESSAGING-AUDIENCE-16 enforces segment enums and suppression precedence", () => {
    expect(engageAudienceQuerySchema.parse({})).toEqual({ segment: "ALL_ELIGIBLE" });
    expect(engageAudienceQuerySchema.safeParse({ segment: "ALL" }).success).toBe(false);
    expect(engageAudienceQuerySchema.safeParse({ collegeId: "other" }).success).toBe(false);
    const now = new Date("2026-10-18T00:00:00Z");
    const base: EngageContact = {
      id: "lead-1", emailNorm: "lead@example.org", manualStage: "NEW",
      ownerMembershipId: null, unsubscribedAt: null, inviteBouncedAt: null,
    };
    const rows: EngageContact[] = [
      base,
      { ...base, id: "lead-2", emailNorm: null },
      { ...base, id: "lead-3", emailNorm: "opt@example.org", unsubscribedAt: now },
      { ...base, id: "lead-4", emailNorm: "bounce@example.org", inviteBouncedAt: now },
      { ...base, id: "lead-5", emailNorm: "later@example.org", manualStage: "NOT_NOW" },
      { ...base, id: "lead-6", emailNorm: "assigned@example.org", ownerMembershipId: "owner" },
    ];
    expect(summarizeEngageAudience(rows, "ALL_ELIGIBLE")).toEqual({
      total: 6, eligible: 2, withoutEmail: 1, unsubscribed: 1,
      bounced: 1, notNow: 1, outsideSegment: 0,
    });
    expect(summarizeEngageAudience(rows, "UNASSIGNED")).toMatchObject({
      total: 6, eligible: 1, outsideSegment: 1,
    });
    expect(summarizeEngageAudience(rows, "NEW")).toMatchObject({
      total: 6, eligible: 2, outsideSegment: 1,
    });
  });

  it("MESSAGING-TEMPLATE-16 never reuses login/OTP/recovery templates for campaigns", () => {
    for (const bad of [
      "", " ", "auth.otp", "campaign.password-reset", "login", "campaign/verify",
      "campaign.mfa", "otp-v2", "magic-link", "marketing message",
      "x".repeat(161),
    ]) expect(isCampaignTemplateKey(bad)).toBe(false);
    for (const allowed of ["placement.campaign", "recruiter.digest-v2", "tpo/email.notice"])
      expect(isCampaignTemplateKey(allowed)).toBe(true);
  });

  it("MESSAGING-HISTORY-16 preserves IST timestamp and safe status wording", () => {
    expect(tpoCampaignHistoryTime(new Date("2026-10-18T00:00:00.000Z")))
      .toBe("05:30 18 Oct 2026");
    expect(tpoCampaignHistoryStatus("DRAFT")).toBe("Draft");
    expect(tpoCampaignHistoryStatus("SENDING")).toBe("Sending");
    expect(tpoCampaignHistoryStatus("SENT")).toBe("Sent");
    expect(tpoCampaignHistoryStatus("CANCELLED")).toBe("Cancelled");
    expect(tpoCampaignHistoryStatus("PRIVATE_SECRET_STATUS")).toBe("Recorded");
  });

  it("MESSAGING-UNSUB-NOTICE-16 strips control characters and exposes only scoped legacy copy", () => {
    const event = tpoCampaignUnsubscribeEvent(
      " \n  Recruiter\t Person  ", "thread/../../admin",
    );
    expect(event.eventType).toBe("PLACEMENTS_RECRUITER_UNSUBSCRIBED");
    expect(event.summary).toBe("Recruiter Person unsubscribed from emails");
    expect(event.notification).toEqual({
      title: "Recruiter Person unsubscribed",
      body: "This recruiter asked not to receive placement-cell emails.",
      actionHref: "/tpo/recruiters/thread%2F..%2F..%2Fadmin",
    });
    expect(event.timeline).toBe("Unsubscribed from emails");
    expect(tpoCampaignUnsubscribeEvent(" \t ", "lead").summary)
      .toBe("Recruiter unsubscribed from emails");
  });

  it("MESSAGING-UNSUB-TOKEN-16 signs canonical expiring tokens and forbids GET mutation", () => {
    const secret = "test-only-campaign-optout-key-with-more-than-32-bytes";
    const claim = { version: 1 as const, recipientKey: "a".repeat(64), expiresAt: 2000 };
    const token = issueUnsubscribeToken(claim, secret);
    expect(verifyUnsubscribeToken(token, secret, 1999)).toEqual(claim);
    expect(verifyUnsubscribeToken(token, secret, 2000)).toBeNull();
    expect(unsubscribeConfirmation(token, secret, 1999)).toEqual({
      canConfirm: true, willUnsubscribeOnView: false,
    });
    expect(unsubscribeConfirmation(token, secret, 2000)).toEqual({
      canConfirm: false, willUnsubscribeOnView: false,
    });
    for (const forged of [
      "not-a-token", token + ".", token.slice(0, -1) + (token.endsWith("A") ? "B" : "A"),
      token.replace(".", ".."), "x".repeat(2049),
    ]) expect(verifyUnsubscribeToken(forged, secret, 1999)).toBeNull();
    expect(verifyUnsubscribeToken(token, "wrong-but-still-very-long-signature-secret", 1999))
      .toBeNull();
    expect(verifyUnsubscribeToken(token, "short", 1999)).toBeNull();
    expect(() => issueUnsubscribeToken(claim, "short")).toThrow();
    expect(() => issueUnsubscribeToken({ ...claim, recipientKey: "invalid" }, secret))
      .toThrow();
  });
});
