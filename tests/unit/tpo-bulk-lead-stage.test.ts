import { describe, expect, it } from "vitest";
import {
  confirmedTpoBulkLeadStageSchema,
  decideTpoBulkLeadStage,
  summarizeTpoBulkLeadStages,
  type TpoBulkLeadState,
} from "@/modules/placements/tpo-bulk-lead-stage-model";

const uuid = (value: number) =>
  "00000000-0000-4000-8000-" + String(value).padStart(12, "0");
const contact = {
  manualStage: "NEW",
  recruiterUserId: null,
  unsubscribedAt: null,
  notNowReason: null,
  notNowUntil: null,
} satisfies TpoBulkLeadState;
const selected = { id: uuid(1), expectedStage: "NEW" as const };
const contacted = {
  action: "CONTACTED" as const,
  confirmed: true as const,
  selections: [selected],
};
const notNow = {
  action: "NOT_NOW" as const,
  confirmed: true as const,
  selections: [selected],
  reason: "Hiring delayed",
  revisitDate: "2026-11-15",
};

describe("TPO bulk lead manual-stage validation", () => {
  it("accepts only confirmed, unique, bounded, strict actions", () => {
    expect(confirmedTpoBulkLeadStageSchema.safeParse(contacted).success).toBe(true);
    expect(confirmedTpoBulkLeadStageSchema.safeParse(notNow).success).toBe(true);
    expect(confirmedTpoBulkLeadStageSchema.safeParse({ ...contacted, confirmed: false }).success).toBe(false);
    expect(confirmedTpoBulkLeadStageSchema.safeParse({ ...notNow, reason: "" }).success).toBe(false);
    expect(confirmedTpoBulkLeadStageSchema.safeParse({ ...notNow, revisitDate: "invalid" }).success).toBe(false);
    expect(confirmedTpoBulkLeadStageSchema.safeParse({
      ...contacted, selections: [selected, selected],
    }).success).toBe(false);
    expect(confirmedTpoBulkLeadStageSchema.safeParse({
      ...contacted, selections: Array.from({ length: 101 }, (_, i) => ({
        id: uuid(i + 1), expectedStage: "NEW",
      })),
    }).success).toBe(false);
    expect(confirmedTpoBulkLeadStageSchema.safeParse({
      ...contacted, collegeId: uuid(2),
    }).success).toBe(false);
    expect(confirmedTpoBulkLeadStageSchema.safeParse({
      ...contacted, action: "CONVERTED",
    }).success).toBe(false);
  });

  it("excludes joined/unsubscribed leads and stale selections", () => {
    expect(decideTpoBulkLeadStage(null, selected, contacted).status).toBe("ineligible");
    expect(decideTpoBulkLeadStage({
      ...contact, recruiterUserId: uuid(3),
    }, selected, contacted).status).toBe("ineligible");
    expect(decideTpoBulkLeadStage({
      ...contact, unsubscribedAt: new Date(),
    }, selected, contacted).status).toBe("ineligible");
    expect(decideTpoBulkLeadStage({
      ...contact, manualStage: "CONTACTED",
    }, selected, contacted).status).toBe("ineligible");
  });

  it("preserves no-op status and recognizes only real changes", () => {
    expect(decideTpoBulkLeadStage(contact, selected, contacted).status).toBe("updated");
    expect(decideTpoBulkLeadStage({
      ...contact, manualStage: "CONTACTED",
    }, { ...selected, expectedStage: "CONTACTED" }, contacted).status).toBe("unchanged");
    expect(decideTpoBulkLeadStage({
      ...contact, manualStage: "NOT_NOW",
      notNowReason: "Hiring delayed",
      notNowUntil: "2026-11-15",
    }, { ...selected, expectedStage: "NOT_NOW" }, notNow).status).toBe("unchanged");
    expect(summarizeTpoBulkLeadStages([
      { leadId: uuid(1), status: "updated", reason: null },
      { leadId: uuid(2), status: "unchanged", reason: null },
      { leadId: uuid(3), status: "ineligible", reason: "Stage changed" },
    ])).toEqual({ total: 3, updated: 1, unchanged: 1, ineligible: 1 });
  });
});
