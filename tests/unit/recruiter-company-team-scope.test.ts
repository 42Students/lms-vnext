import { describe, expect, it } from "vitest";
import {readFileSync} from "node:fs";
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

  it("HR-TEAM-OWNER-30 never returns college choices from another recruiter's session", () => {
    const second = grant(
      "00000000-0000-4000-8000-000000000012",
      "00000000-0000-4000-8000-000000000022", "College B",
    );
    const forged: RequestContext = {
      ...base,
      recruiter: {...base.recruiter!, userId:"00000000-0000-4000-8000-000000000099",
        grants:[second]},
    };
    expect(() => resolveRecruiterCompanyScope(forged)).toThrow();
    expect(() => resolveRecruiterCompanyScope(forged,second.collegeId)).toThrow();
    expect(resolveRecruiterCompanyScope({
      ...base,recruiter:{...base.recruiter!,grants:[second]},
    },second.collegeId)).toMatchObject({status:"READY",grant:second});
  });

  it("HR-TEAM-REVOKE-32 revalidates persisted recruiter and grant before disclosing colleagues",()=>{
    const source=readFileSync(
      "src/modules/placements/recruiter-company-team-service.ts","utf8");
    const scopeQuery=source.slice(source.indexOf("const [company]"),
      source.indexOf('if (!company) throw new AuthorizationError'));
    for(const check of [
      "eq(placementRecruiterProfiles.userId,context.user.id)",
      'eq(placementRecruiterProfiles.status,"ACTIVE")',
      "eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id)",
      'eq(placementRecruiterCollegeGrants.status,"ACTIVE")',
      'eq(users.platformStatus,"ACTIVE")',
      'eq(placementCompanyRelationships.status, "ACTIVE")',
      'eq(placementCompanies.status, "ACTIVE")',
      'eq(colleges.status,"ACTIVE")',
    ])expect(scopeQuery).toContain(check);
    expect(source.indexOf('if (!company) throw new AuthorizationError'))
      .toBeLessThan(source.indexOf("const team = await db"));
  });

  it("HR-TEAM-RECIPIENT-45 returns only verified and unexpired colleague contact grants",()=>{
    const source=readFileSync("src/modules/placements/recruiter-company-team-service.ts","utf8");
    const roster=source.slice(source.indexOf("const team = await db"));
    for(const clause of [
      'eq(placementRecruiterCollegeGrants.companyRelationshipId, company.relationshipId)',
      'eq(placementRecruiterCollegeGrants.status, "ACTIVE")',
      'eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED")',
      'gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`)',
      'eq(placementRecruiterProfiles.status, "ACTIVE")',
      'eq(users.platformStatus, "ACTIVE")',
    ])expect(roster).toContain(clause);
    expect(roster).not.toContain("select * from users");
  });

  it("rejects a forged college id instead of falling back", () => {
    const a = grant("00000000-0000-4000-8000-000000000011", "00000000-0000-4000-8000-000000000021", "A");
    const context = { ...base, recruiter: { ...base.recruiter!, grants: [a] } };
    expect(() => resolveRecruiterCompanyScope(
      context, "00000000-0000-4000-8000-000000000099",
    )).toThrow();
  });
});
