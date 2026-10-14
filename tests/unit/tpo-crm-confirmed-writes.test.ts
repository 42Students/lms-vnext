import { describe, expect, it } from "vitest";
import {
  confirmedCreateTpoLeadSchema,
  confirmedMarkTpoNotNowSchema,
} from "@/modules/placements/tpo-crm-validation";
import {
  isSameNotNowDecision,
  leadCreatedAuditNote,
  leadNotNowAuditNote,
} from "@/modules/placements/tpo-crm-confirmed-write-model";

const collegeId = "20000000-0000-4000-8000-000000000001";
const lead = { collegeId, name: "Recruiter", email: "lead@example.org" };

describe("confirmed TPO lead writes", () => {
  it("requires a confirmed and strictly scoped create payload", () => {
    expect(confirmedCreateTpoLeadSchema.parse({
      confirmed: true,
      lead: { ...lead, email: "  LEAD@EXAMPLE.ORG " },
    })).toMatchObject({
      confirmed: true,
      lead: { ...lead, email: "lead@example.org" },
    });
    for (const payload of [
      { confirmed: false, lead },
      { lead },
      { confirmed: true, lead, ownerMembershipId: collegeId },
      { confirmed: true, lead: { ...lead, manualStage: "CONTACTED" } },
      { confirmed: true, lead: { collegeId, name: "No contact" } },
    ]) {
      expect(confirmedCreateTpoLeadSchema.safeParse(payload).success).toBe(false);
    }
  });

  it("requires confirmation and valid typed Not Now state", () => {
    const decision = { collegeId, reason: "Try later", revisitDate: "2027-03-10" };
    expect(confirmedMarkTpoNotNowSchema.parse({
      confirmed: true, decision,
    })).toEqual({ confirmed: true, decision });
    for (const payload of [
      { confirmed: false, decision },
      { decision },
      { confirmed: true, decision, ownerMembershipId: collegeId },
      { confirmed: true, decision: { ...decision, manualStage: "CONTACTED" } },
      { confirmed: true, decision: { ...decision, revisitDate: "03/10/2027" } },
    ]) {
      expect(confirmedMarkTpoNotNowSchema.safeParse(payload).success).toBe(false);
    }
  });

  it("audits only meaningful Not Now changes and never forges SYSTEM activity", () => {
    const previous = {
      manualStage: "NOT_NOW",
      notNowReason: "Try later",
      notNowUntil: "2027-03-10",
    };
    expect(isSameNotNowDecision(previous, {
      reason: "Try later", revisitDate: "2027-03-10",
    })).toBe(true);
    expect(isSameNotNowDecision(previous, {
      reason: "Hiring paused", revisitDate: "2027-03-10",
    })).toBe(false);
    expect(isSameNotNowDecision({
      ...previous, manualStage: "NEW",
    }, {
      reason: "Try later", revisitDate: "2027-03-10",
    })).toBe(false);
    expect(leadCreatedAuditNote()).toBe("Recruiter lead created");
    expect(leadNotNowAuditNote("NEW")).toBe("Manual stage changed to Not Now");
    expect(leadNotNowAuditNote("NOT_NOW")).toBe("Not Now reason or revisit date updated");
  });
});
