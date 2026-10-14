import { describe, expect, it } from "vitest";
import {
  confirmedTpoCompanyInteractionSchema,
  interactionConfirmationSummary,
  tpoCompanyInteractionCompanyIdSchema,
} from "@/modules/placements/tpo-company-interaction-model";

const companyId = "00000000-0000-4000-8000-000000000001";
const leadId = "00000000-0000-4000-8000-000000000002";
const valid = {
  confirmed: true,
  leadId,
  expectedLeadUpdatedAt: "2026-10-14T08:15:00.000Z",
  type: "CALL",
  outcome: "REACHED",
  note: "Discussed placement interview availability",
};

describe("confirmed company interaction input", () => {
  it("requires explicit confirmation, scoped linked lead and exact typed fields", () => {
    expect(confirmedTpoCompanyInteractionSchema.parse(valid)).toEqual(valid);
    expect(confirmedTpoCompanyInteractionSchema.safeParse({
      ...valid, confirmed: false,
    }).success).toBe(false);
    expect(confirmedTpoCompanyInteractionSchema.safeParse({
      ...valid, collegeId: companyId,
    }).success).toBe(false);
    expect(confirmedTpoCompanyInteractionSchema.safeParse({
      ...valid, type: "SYSTEM",
    }).success).toBe(false);
    expect(confirmedTpoCompanyInteractionSchema.safeParse({
      ...valid, expectedLeadUpdatedAt: "yesterday",
    }).success).toBe(false);
    expect(confirmedTpoCompanyInteractionSchema.safeParse({
      ...valid, note: "no",
    }).success).toBe(false);
    expect(confirmedTpoCompanyInteractionSchema.safeParse({
      ...valid, outcome: "x".repeat(31),
    }).success).toBe(false);
    expect(tpoCompanyInteractionCompanyIdSchema.safeParse(companyId).success).toBe(true);
    expect(tpoCompanyInteractionCompanyIdSchema.safeParse("foreign-id").success).toBe(false);
  });

  it("accepts internal CRM types but never invented send/delivery operations", () => {
    for (const type of ["CALL", "WHATSAPP", "EMAIL", "MEETING", "NOTE"]) {
      expect(confirmedTpoCompanyInteractionSchema.safeParse({
        ...valid, type,
      }).success).toBe(true);
    }
    for (const type of ["SMS", "SENT", "DELIVERED", "SYSTEM"]) {
      expect(confirmedTpoCompanyInteractionSchema.safeParse({
        ...valid, type,
      }).success).toBe(false);
    }
  });

  it("creates an accurate confirmation without claiming outbound delivery", () => {
    const message = interactionConfirmationSummary({
      type: "EMAIL", contactName: "Recruiter",
    });
    expect(message).toContain("Recruiter");
    expect(message).toContain("immutable internal CRM activity");
    expect(message).toContain("no message is sent");
  });
});
