import { describe, expect, it } from "vitest";
import {
  confirmedTpoBulkLeadOwnerSchema,
  decideTpoLeadOwnerChange,
  summarizeTpoBulkLeadOwners,
  tpoLeadOwnerAuditNote,
} from "@/modules/placements/tpo-bulk-lead-owner-model";

const first = "10000000-0000-4000-8000-000000000001";
const second = "10000000-0000-4000-8000-000000000002";
const third = "10000000-0000-4000-8000-000000000003";

describe("confirmed TPO bulk lead owner contract", () => {
  const valid = {
    confirmed: true,
    ownerMembershipId: second,
    selections: [{ id: first, expectedOwnerMembershipId: null }],
  };

  it("accepts only explicit, unique, bounded confirmed owner selections", () => {
    expect(confirmedTpoBulkLeadOwnerSchema.parse(valid)).toEqual(valid);
    expect(confirmedTpoBulkLeadOwnerSchema.safeParse({
      ...valid, confirmed: false,
    }).success).toBe(false);
    expect(confirmedTpoBulkLeadOwnerSchema.safeParse({
      ...valid, collegeId: first,
    }).success).toBe(false);
    expect(confirmedTpoBulkLeadOwnerSchema.safeParse({
      ...valid, selections: [],
    }).success).toBe(false);
    expect(confirmedTpoBulkLeadOwnerSchema.safeParse({
      ...valid, selections: [valid.selections[0], valid.selections[0]],
    }).success).toBe(false);
    expect(confirmedTpoBulkLeadOwnerSchema.safeParse({
      ...valid, selections: Array.from({ length: 101 }, (_, n) => ({
        id: "10000000-0000-4000-8000-" + String(n + 1).padStart(12, "0"),
        expectedOwnerMembershipId: null,
      })),
    }).success).toBe(false);
    expect(confirmedTpoBulkLeadOwnerSchema.safeParse({
      ...valid, ownerMembershipId: "not-a-uuid",
    }).success).toBe(false);
  });

  it("distinguishes eligible, unchanged, stale, unknown and protected leads", () => {
    const selection = { id: first, expectedOwnerMembershipId: first };
    const current = {
      ownerMembershipId: first,
      recruiterUserId: null,
      unsubscribedAt: null,
    };
    expect(decideTpoLeadOwnerChange(current, selection, second)).toEqual({
      status: "updated", reason: null,
    });
    expect(decideTpoLeadOwnerChange(current, selection, first).status)
      .toBe("unchanged");
    expect(decideTpoLeadOwnerChange(current, {
      ...selection, expectedOwnerMembershipId: third,
    }, second)).toMatchObject({ status: "ineligible" });
    expect(decideTpoLeadOwnerChange(null, selection, second).status)
      .toBe("ineligible");
    expect(decideTpoLeadOwnerChange({
      ...current, recruiterUserId: third,
    }, selection, second).status).toBe("ineligible");
    expect(decideTpoLeadOwnerChange({
      ...current, unsubscribedAt: new Date("2026-10-14T00:00:00Z"),
    }, selection, second).status).toBe("ineligible");
  });

  it("renders stable audit meaning and truthful per-lead counts", () => {
    expect(tpoLeadOwnerAuditNote(null, second))
      .toBe("Lead owner reassigned from unassigned to " + second);
    expect(tpoLeadOwnerAuditNote(first, second))
      .toBe("Lead owner reassigned from " + first + " to " + second);
    expect(summarizeTpoBulkLeadOwners([
      { leadId: first, status: "updated", reason: null },
      { leadId: second, status: "unchanged", reason: null },
      { leadId: third, status: "ineligible", reason: "Unavailable" },
    ])).toEqual({ total: 3, updated: 1, unchanged: 1, ineligible: 1 });
  });
});
