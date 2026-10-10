import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { resolveRecruiterCompanyScope } from "@/modules/placements/recruiter-company-team-service";

const base: RequestContext = {
  user: {
    id: "00000000-0000-4000-8000-000000000001",
    identityUid: "recruiter-scope-test",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: null,
  recruiter: {
    userId: "00000000-0000-4000-8000-000000000001",
    companyId: "00000000-0000-4000-8000-000000000002",
    companyName: "Acme",
    title: "Recruiter",
    status: "ACTIVE",
    grants: [],
  },
};

function grant(id: string, collegeId: string, name: string) {
  return {
    id,
    organizationId: "00000000-0000-4000-8000-000000000010",
    collegeId,
    collegeName: name,
    companyRelationshipId: id,
  };
}

describe("W05 recruiter company college scope", () => {
  it("returns no-access instead of inventing a college", () => {
    expect(resolveRecruiterCompanyScope(base)).toEqual({
      status: "NO_ACCESS", choices: [],
    });
  });

  it("selects the only grant without ambiguity", () => {
    const one = grant(
      "00000000-0000-4000-8000-000000000011",
      "00000000-0000-4000-8000-000000000021",
      "College A",
    );
    const context = { ...base, recruiter: { ...base.recruiter!, grants: [one] } };
    expect(resolveRecruiterCompanyScope(context)).toMatchObject({
      status: "READY", grant: one,
    });
  });

  it("requires an explicit choice when multiple colleges are active", () => {
    const a = grant("00000000-0000-4000-8000-000000000011", "00000000-0000-4000-8000-000000000021", "A");
    const b = grant("00000000-0000-4000-8000-000000000012", "00000000-0000-4000-8000-000000000022", "B");
    const context = { ...base, recruiter: { ...base.recruiter!, grants: [a, b] } };
    expect(resolveRecruiterCompanyScope(context)).toMatchObject({
      status: "CHOOSE_COLLEGE", choices: [a, b],
    });
    expect(resolveRecruiterCompanyScope(context, b.collegeId)).toMatchObject({
      status: "READY", grant: b,
    });
  });

  it("rejects a forged college id instead of falling back", () => {
    const a = grant("00000000-0000-4000-8000-000000000011", "00000000-0000-4000-8000-000000000021", "A");
    const context = { ...base, recruiter: { ...base.recruiter!, grants: [a] } };
    expect(() => resolveRecruiterCompanyScope(
      context, "00000000-0000-4000-8000-000000000099",
    )).toThrow();
  });
});
