import { describe, expect, it } from "vitest";
import {
  companyContactPersonSchema,
  companyContactChangeNote,
} from "@/modules/placements/tpo-company-person-model";
const id = "00000000-0000-4000-8000-000000000001";

describe("college company contact person input", () => {
  it("normalizes emails and requires confirmation", () => {
    expect(companyContactPersonSchema.parse({
      action: "CREATE", confirmed: true, name: " Lee ",
      email: "  LEE@EXAMPLE.ORG ", designation: "",
    })).toMatchObject({ name: "Lee", email: "lee@example.org" });
    expect(companyContactPersonSchema.safeParse({
      action: "CREATE", confirmed: false, name: "Lee", email: "lee@example.org",
    }).success).toBe(false);
    expect(companyContactPersonSchema.safeParse({
      action: "CREATE", confirmed: true, name: "Lee",
      email: "lee@example.org", companyRelationshipId: id,
    }).success).toBe(false);
  });
  it("requires stale-state proof for edits and prohibits tenant IDs", () => {
    const edit = {
      action: "EDIT" as const, confirmed: true, leadId: id,
      expectedUpdatedAt: "2026-10-14T04:00:00.000Z",
      name: "Lee", email: "lee@example.org",
    };
    expect(companyContactPersonSchema.safeParse(edit).success).toBe(true);
    expect(companyContactPersonSchema.safeParse({
      ...edit, expectedUpdatedAt: "",
    }).success).toBe(false);
    expect(companyContactPersonSchema.safeParse({
      ...edit, collegeId: id,
    }).success).toBe(false);
    expect(companyContactChangeNote("EDIT")).toContain("edited");
  });
});
