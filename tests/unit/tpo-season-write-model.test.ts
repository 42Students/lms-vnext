import { describe, expect, it } from "vitest";
import {
  tpoRulesChangeSchema,
  tpoSeasonChangeSchema,
} from "@/modules/placements/tpo-season-write-model";

describe("TPO confirmed season/rules boundaries", () => {
  const create = {
    action: "CREATE" as const, confirmed: true as const,
    name: "2027 Placements", code: "P27",
    startDate: "2027-01-01", endDate: "2027-12-31",
  };
  it("validates exact calendar strings and chronological boundaries", () => {
    expect(tpoSeasonChangeSchema.safeParse(create).success).toBe(true);
    expect(tpoSeasonChangeSchema.safeParse({ ...create, endDate: "2026-12-31" }).success).toBe(false);
    expect(tpoSeasonChangeSchema.safeParse({ ...create, startDate: "2027-02-30" }).success).toBe(false);
    expect(tpoSeasonChangeSchema.safeParse({ ...create, confirmed: false }).success).toBe(false);
    expect(tpoSeasonChangeSchema.safeParse({ ...create, collegeId: "anything" }).success).toBe(false);
  });
  it("requires a version snapshot for editing", () => {
    const edit = { ...create, action: "EDIT" as const,
      seasonId: "10000000-0000-4000-8000-000000000001",
      expectedUpdatedAt: "2026-10-14T06:30:00.000Z" };
    expect(tpoSeasonChangeSchema.safeParse(edit).success).toBe(true);
    expect(tpoSeasonChangeSchema.safeParse({ ...edit, expectedUpdatedAt: "yesterday" }).success).toBe(false);
  });
  it("rejects unconfirmed or malformed college rules", () => {
    const rules = { confirmed: true, expectedVersion: 0,
      countsAsPlacedAt: "OFFER_ACCEPTED", maxHeldOffers: 2, upliftPct: 40,
      minResponseHours: 48 };
    expect(tpoRulesChangeSchema.safeParse(rules).success).toBe(true);
    expect(tpoRulesChangeSchema.safeParse({ ...rules, confirmed: false }).success).toBe(false);
    expect(tpoRulesChangeSchema.safeParse({ ...rules, maxHeldOffers: 0 }).success).toBe(false);
    expect(tpoRulesChangeSchema.safeParse({ ...rules, collegeId: "forged" }).success).toBe(false);
  });
});
