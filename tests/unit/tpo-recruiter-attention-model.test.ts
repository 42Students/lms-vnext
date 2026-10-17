import { describe, expect, it } from "vitest";
import { recruiterAttentionFromPersistedFacts as derive, RECRUITER_ATTENTION_LABELS } from "@/modules/placements/tpo-recruiter-attention-model";
const now = new Date("2026-10-16T12:00:00.000Z");
const base = { createdAt: new Date("2026-09-15T00:00:00Z"), lastContactAt: null,
  nextFollowupAt: null, inviteBouncedAt: null, inviteSentAt: null,
  recruiterUserId: null, manualStage: "NEW", unsubscribedAt: null };
describe("T-S2-01 recruiter needs-attention chips", () => {
  it("reuses exactly the old LMS's chip labels", () => {
    expect(Object.values(RECRUITER_ATTENTION_LABELS)).toEqual(["Overdue","No next step","Quiet","Bounced","Unverified"]);
  });
  it("flags no-next-step and 14+ quiet days from creation when no contact", () => {
    expect(derive(base, now).chips).toEqual(["NO_NEXT_STEP", "QUIET"]);
    expect(derive({ ...base, createdAt: new Date("2026-10-10T00:00:00Z") }, now).chips).toEqual(["NO_NEXT_STEP"]);
  });
  it("uses yesterday vs today IST for overdue, not a rolling hour window", () => {
    const yesterday = new Date("2026-10-15T10:00:00Z");
    expect(derive({ ...base, nextFollowupAt: yesterday }, now).chips).toEqual(["OVERDUE", "QUIET"]);
    expect(derive({ ...base, nextFollowupAt: new Date("2026-10-16T00:00:00Z") }, now).chips).toEqual(["QUIET"]);
  });
  it("avoids chips on ended leads, keeps actionable chips on joined leads and reflects an invite bounce", () => {
    expect(derive({ ...base, inviteBouncedAt: now, inviteSentAt: now }, now).chips).toContain("BOUNCED");
    expect(derive({ ...base, recruiterUserId: "joined" }, now).chips).toEqual(["NO_NEXT_STEP", "QUIET"]);
    expect(derive({ ...base, manualStage: "NOT_NOW" }, now).chips).toEqual([]);
    expect(derive({ ...base, unsubscribedAt: now }, now).chips).toEqual([]);
  });
});
