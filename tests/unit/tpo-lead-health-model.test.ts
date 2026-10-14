import { describe, expect, it } from "vitest";
import { summarizeTpoLeadHealth, type LeadHealthFact } from "@/modules/placements/tpo-lead-health-model";
const now = "2026-10-14T12:30:00.000Z";
function lead(id: string, fields: Partial<LeadHealthFact> = {}): LeadHealthFact {
  return { id, manualStage: "NEW", ownerMembershipId: null,
    recruiterUserId: null, unsubscribedAt: null, ...fields };
}
describe("TPO lead pipeline health", () => {
  it("does not confuse quiet, recent, unknown or paused leads", () => {
    const health = summarizeTpoLeadHealth(
      [lead("recent"), lead("quiet"), lead("unknown"),
        lead("paused", { manualStage: "NOT_NOW" }),
        lead("linked", { recruiterUserId: "recruiter" })],
      [{ leadId: "recent", at: "2026-10-13T12:00:00Z" },
        { leadId: "quiet", at: "2026-09-01T12:00:00Z" }],
      [{ leadId: "recent", dueAt: "2026-10-12T12:00:00Z" },
        { leadId: "quiet", dueAt: "2026-10-21T12:00:00Z" },
        { leadId: "paused", dueAt: "2026-10-12T12:00:00Z" }], now);
    expect(health).toMatchObject({
      actionableLeads: 3, contactedLast14Days: 1, goneQuiet14Days: 1,
      noContactEvidence: 1, noNextStep: 1, dueFollowups: 1,
      unassigned: 3, recentContactRatePercent: 33,
      lastContactAt: "2026-10-13T12:00:00.000Z",
    });
  });
  it("keeps rate and recency null without any actionable observations", () => {
    expect(summarizeTpoLeadHealth([], [], [], now)).toMatchObject({
      actionableLeads: 0, recentContactRatePercent: null, lastContactAt: null,
    });
  });
});
