import { describe, expect, it } from "vitest";
import { companyJoinOutcome, publicCompanyJoinInputSchema } from "@/modules/placements/public-company-join-model";

const invitation = {
  invitationValid: true,
  expectedCompanyDomain: "example.com",
  workEmail: "talent@example.com",
  alreadyJoined: false,
  codeVerified: false,
};

describe("company-specific public invitations", () => {
  it("fails closed before any state that could reveal membership", () => {
    expect(companyJoinOutcome({ ...invitation, invitationValid: false, alreadyJoined: true })).toBe("INVALID_OR_EXPIRED");
  });
  it("will not allow joining the company from a different work domain", () => {
    expect(companyJoinOutcome({ ...invitation, workEmail: "staff@other.com", codeVerified: true })).toBe("EMAIL_DOMAIN_MISMATCH");
    expect(companyJoinOutcome({ ...invitation, expectedCompanyDomain: "", codeVerified: true })).toBe("EMAIL_DOMAIN_MISMATCH");
  });
  it("handles a persisted already-joined grant and verified code separately", () => {
    expect(companyJoinOutcome({ ...invitation, alreadyJoined: true })).toBe("ALREADY_JOINED");
    expect(companyJoinOutcome({ ...invitation, codeVerified: true })).toBe("VERIFIED");
    expect(companyJoinOutcome(invitation)).toBe("AWAITING_VERIFICATION");
  });
  it("rejects unvalidated fields at the public boundary", () => {
    expect(publicCompanyJoinInputSchema.safeParse({
      token: "x".repeat(40), workEmail: "talent@example.com", code: "004123", collegeId: "forged",
    }).success).toBe(false);
  });
});
