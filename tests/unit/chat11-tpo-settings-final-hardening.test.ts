import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { tpoRulesChangeSchema } from "@/modules/placements/tpo-season-write-model";
import { tpoPrepConfigSchema } from "@/modules/placements/tpo-configuration-model";
import { tpoRuleBoundsValid } from "@/modules/placements/tpo-rule-limits";
import { deriveTpoPrepCourseOutcome } from "@/modules/placements/tpo-prep-readiness-derivation";
import {
  resolveTpoNotificationPreferences, TPO_NOTIFICATION_PREFERENCE_FIELDS,
} from "@/modules/placements/tpo-my-notifications-model";

const rules = {
  confirmed: true as const, expectedVersion: 2, countsAsPlacedAt: "OFFER_RELEASED",
  maxHeldOffers: 3, upliftPct: 50, minResponseHours: 36,
};
const policy = { courseIds: ["course-a", "course-b"],
  minimumCompleted: 1, progressThresholdPct: 75 };

describe("TPO settings final-sprint hardening (chat-11)", () => {
  it("TPO-settings-audit-11 allows only released/accepted and enforces legacy values at the API boundary", () => {
    expect(tpoRulesChangeSchema.safeParse(rules).success).toBe(true);
    expect(tpoRulesChangeSchema.safeParse({ ...rules, countsAsPlacedAt: "SELECTED" }).success).toBe(false);
    expect(tpoRulesChangeSchema.safeParse({ ...rules, countsAsPlacedAt: "OFFER_ACCEPTED" }).success).toBe(true);
    for (const invalid of [
      { maxHeldOffers: 6 }, { maxHeldOffers: 0 }, { upliftPct: 201 },
      { upliftPct: -1 }, { minResponseHours: 11 }, { minResponseHours: 169 },
    ]) {
      expect(tpoRulesChangeSchema.safeParse({ ...rules, ...invalid }).success).toBe(false);
    }
    expect(tpoRuleBoundsValid({ maxHeldOffers: 3, upliftPct: 50, minResponseHours: 36 })).toBe(true);
    const ui = readFileSync("src/components/placements/tpo-college-rules-control.tsx", "utf8");
    expect(ui).not.toContain('value="SELECTED"');
    expect(ui).toContain('value="OFFER_RELEASED"');
    expect(ui).toContain('value="OFFER_ACCEPTED"');
    expect(ui).toContain("inFlight.current = true");
    expect(ui).toContain("if (inFlight.current||!dirty) return;");
    expect(ui).toContain("min-h-11");
  });

  it("TPO-settings-audit-41 distinguishes genuinely prepared, insufficient and unavailable course evidence", () => {
    const partial = [
      { courseId: "course-a", totalContent: 2, completedContent: 2 },
      { courseId: "course-b", totalContent: 2, completedContent: 1 },
    ];
    expect(deriveTpoPrepCourseOutcome(policy, partial)).toBe("READY");
    expect(deriveTpoPrepCourseOutcome(policy, [
      { ...partial[0], completedContent: 1 }, { ...partial[1], completedContent: 1 },
    ])).toBe("NEEDS_PREP");
    expect(deriveTpoPrepCourseOutcome(policy, null)).toBe("UNAVAILABLE");
    expect(deriveTpoPrepCourseOutcome(policy, [partial[0]])).toBe("UNAVAILABLE");
    expect(deriveTpoPrepCourseOutcome(policy, [
      { ...partial[0], completedContent: 1.5 }, partial[1],
    ])).toBe("UNAVAILABLE");
    expect(deriveTpoPrepCourseOutcome(policy, [
      partial[0], partial[0], partial[1],
    ])).toBe("UNAVAILABLE");
    expect(deriveTpoPrepCourseOutcome({ ...policy, courseIds: ["course-a", "course-a"] },
      partial)).toBe("UNAVAILABLE");
    expect(deriveTpoPrepCourseOutcome({ ...policy, progressThresholdPct: 101 },
      partial)).toBe("UNAVAILABLE");
  });

  it("TPO-settings-audit-41 rejects duplicate configured course IDs before saving", () => {
    const c1 = "11111111-1111-4111-8111-111111111111";
    const c2 = "22222222-2222-4222-8222-222222222222";
    expect(tpoPrepConfigSchema.safeParse({
      courseIds: [c1, c2], minimumCompleted: 1,
    }).success).toBe(true);
    expect(tpoPrepConfigSchema.safeParse({
      courseIds: [c1, c1], minimumCompleted: 1,
    }).success).toBe(false);
    expect(tpoPrepConfigSchema.safeParse({
      courseIds: [c1], minimumCompleted: 2,
    }).success).toBe(false);
  });

  it("TPO-settings-audit-41 never confuses missing course evidence with being unprepared", () => {
    const source = readFileSync("src/modules/placements/tpo-students-service.ts", "utf8");
    expect(source).toContain("readTpoLearnerPrepOutcomes(context,college.id,");
    expect(source).toContain('prep.outcomes.get(row.membershipId)==="NEEDS_PREP"');
    expect(source).toContain("prepCourseEvidenceAvailable:prep.available");
  });

  it("TPO-settings-audit-80 preserves user preferences across unavailable storage without fake persisted choices", () => {
    expect(resolveTpoNotificationPreferences(false, null)).toEqual({
      source: "UNAVAILABLE", values: null,
    });
    expect(resolveTpoNotificationPreferences(true, null).source).toBe("SOURCE_DEFAULT");
    expect(resolveTpoNotificationPreferences(true, {
      morningDigest: true, recruiterMessages: false, requests: false,
      resultsReady: true, followUps: true,
    })).toMatchObject({ source: "PERSISTED", values: { morningDigest: true, recruiterMessages: false } });
    expect(TPO_NOTIFICATION_PREFERENCE_FIELDS).toHaveLength(5);
  });

  it("TPO-settings-audit-80 guards repeat saves, handles session expiry and never renders arbitrary API error text", () => {
    const ui = readFileSync("src/components/tpo/tpo-my-notification-preferences-editor.tsx", "utf8");
    expect(ui).toContain("saving.current=true");
    expect(ui).toContain("if((!dirty&&currentVersion!==null)||saving.current)return");
    expect(ui).toContain("Your session expired. Sign in again.");
    expect(ui).toContain("Preferences changed elsewhere. Refresh and try again.");
    expect(ui).not.toContain("result.error??");
    expect(ui).not.toContain("result?.error??");
    expect(ui).toContain('<InlineNotice tone="error" message={error}');
    const notice=readFileSync("src/components/ui/inline-notice.tsx","utf8");
    expect(notice).toContain('role={tone === "error" ? "alert" : "status"}');
  });
});
