import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { ownRecruiterGrant } from "@/modules/placements/recruiter-profile-service";

const context: RequestContext = {
  user: { id: "u1", identityUid: "uid1", platformStatus: "ACTIVE", systemRoles: [] },
  membership: null,
  recruiter: {
    userId: "u1", companyId: "c1", companyName: "Acme", title: null, status: "ACTIVE",
    grants: [{
      id: "11111111-1111-4111-8111-111111111111",
      organizationId: "o1",
      collegeId: "college-1",
      collegeName: "College One",
      companyRelationshipId: "rel-1",
    }],
  },
};

describe("W05 recruiter self-access policy", () => {
  it("returns only an active grant from the current recruiter context", () => {
    expect(ownRecruiterGrant(context, "11111111-1111-4111-8111-111111111111").collegeId)
      .toBe("college-1");
  });

  it("rejects another recruiter grant id without revealing it", () => {
    expect(() => ownRecruiterGrant(context, "22222222-2222-4222-8222-222222222222"))
      .toThrow();
  });

  it("rejects a non-recruiter caller", () => {
    expect(() => ownRecruiterGrant({ ...context, recruiter: null }, "11111111-1111-4111-8111-111111111111"))
      .toThrow();
  });
});
