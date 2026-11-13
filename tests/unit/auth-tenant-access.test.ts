import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { isTenantAccessAllowed, scopeContextToTenant } from "@/modules/auth/tenant-access";

const COLLEGE_A = "college-a";
const COLLEGE_B = "college-b";

function context(overrides: Partial<RequestContext> = {}): RequestContext {
  return {
    user: {
      id: "u",
      identityUid: "i",
      platformStatus: "ACTIVE",
      systemRoles: [],
    },
    membership: null,
    ...overrides,
  };
}

const memberOf = (collegeId: string) =>
  context({
    membership: {
      id: "m",
      collegeId,
      organizationId: "o",
      status: "ACTIVE",
      roles: ["LEARNER"],
    },
  });

const recruiterAt = (collegeId: string) =>
  context({
    recruiter: {
      userId: "u",
      companyId: "c",
      companyName: "Acme",
      title: null,
      status: "ACTIVE",
      grants: [
        {
          id: "g",
          organizationId: "o",
          collegeId,
          collegeName: "College",
          companyRelationshipId: "r",
        },
      ],
    },
  });

describe("isTenantAccessAllowed", () => {
  it("allows everyone signed in on the platform host", () => {
    expect(isTenantAccessAllowed(context(), { kind: "platform" })).toBe(true);
    expect(
      isTenantAccessAllowed(memberOf(COLLEGE_A), { kind: "platform" }),
    ).toBe(true);
  });

  it("lets a member use only their own college host", () => {
    const tenantA = { kind: "college", collegeId: COLLEGE_A } as const;
    const tenantB = { kind: "college", collegeId: COLLEGE_B } as const;
    expect(isTenantAccessAllowed(memberOf(COLLEGE_A), tenantA)).toBe(true);
    expect(isTenantAccessAllowed(memberOf(COLLEGE_A), tenantB)).toBe(false);
  });

  it("lets a recruiter use only colleges they hold a grant at", () => {
    const tenantA = { kind: "college", collegeId: COLLEGE_A } as const;
    const tenantB = { kind: "college", collegeId: COLLEGE_B } as const;
    expect(isTenantAccessAllowed(recruiterAt(COLLEGE_A), tenantA)).toBe(true);
    expect(isTenantAccessAllowed(recruiterAt(COLLEGE_A), tenantB)).toBe(false);
  });

  it("refuses a person with no college on a college host, even a super admin", () => {
    const tenantA = { kind: "college", collegeId: COLLEGE_A } as const;
    expect(isTenantAccessAllowed(context(), tenantA)).toBe(false);
    expect(
      isTenantAccessAllowed(
        context({
          user: {
            id: "u",
            identityUid: "i",
            platformStatus: "ACTIVE",
            systemRoles: ["SUPER_ADMIN"],
          },
        }),
        tenantA,
      ),
    ).toBe(false);
  });

  it("WEAK-auth-tenant-access-06 denies disabled users even when a stale college or recruiter grant matches",()=>{
    const tenant={kind:"college",collegeId:COLLEGE_A} as const;
    const member=memberOf(COLLEGE_A);
    const disabledMember={
      ...member,user:{...member.user,platformStatus:"DISABLED" as const},
    };
    expect(isTenantAccessAllowed(disabledMember,tenant)).toBe(false);
    expect(isTenantAccessAllowed(disabledMember,{kind:"platform"})).toBe(false);
    const recruiter=recruiterAt(COLLEGE_A);
    const disabledRecruiter={
      ...recruiter,user:{...recruiter.user,platformStatus:"DISABLED" as const},
    };
    expect(isTenantAccessAllowed(disabledRecruiter,tenant)).toBe(false);
    expect(isTenantAccessAllowed(disabledRecruiter,{kind:"platform"})).toBe(false);
  });

  it.each(["SUSPENDED","ENDED"] as const)(
    "WEAK-auth-tenant-access-07 %s membership cannot authorize college Host", status=>{
      const original=memberOf(COLLEGE_A);
      const stale={...original,membership:{...original.membership!,status}};
      expect(isTenantAccessAllowed(stale,{kind:"college",collegeId:COLLEGE_A})).toBe(false);
      expect(isTenantAccessAllowed(stale,{kind:"platform"})).toBe(true);
    });

  it("WEAK-auth-tenant-access-08 a cached recruiter grant for another user cannot authorize a college",()=>{
    const original=recruiterAt(COLLEGE_A);
    const stale={...original,recruiter:{...original.recruiter!,userId:"other-user"}};
    const host={kind:"college",collegeId:COLLEGE_A} as const;
    expect(isTenantAccessAllowed(original,host)).toBe(true);
    expect(isTenantAccessAllowed(stale,host)).toBe(false);
    expect(isTenantAccessAllowed(stale,{kind:"platform"})).toBe(true);
  });

  it("blocks a College A membership from borrowing a College B recruiter grant to enter host B", () => {
    const member = memberOf(COLLEGE_A);
    const recruiter = recruiterAt(COLLEGE_B);
    const combined: RequestContext = { ...member, recruiter: recruiter.recruiter };
    expect(isTenantAccessAllowed(combined, {kind:"college",collegeId:COLLEGE_A})).toBe(true);
    expect(isTenantAccessAllowed(combined, {kind:"college",collegeId:COLLEGE_B})).toBe(false);
    expect(isTenantAccessAllowed({...combined,membership:null}, {kind:"college",collegeId:COLLEGE_B})).toBe(true);
  });

  it("drops cross-college recruiter grants on a member's college host while retaining them on the platform host", () => {
    const a = recruiterAt(COLLEGE_A).recruiter!;
    const b = recruiterAt(COLLEGE_B).recruiter!.grants[0]!;
    const member = memberOf(COLLEGE_A);
    const combined: RequestContext = {
      ...member, recruiter: {...a,grants:[...a.grants,b]},
    };
    const scoped = scopeContextToTenant(combined,{kind:"college",collegeId:COLLEGE_A});
    expect(scoped.membership).toEqual(member.membership);
    expect(scoped.recruiter?.grants.map(g=>g.collegeId)).toEqual([COLLEGE_A]);
    expect(scopeContextToTenant(combined,{kind:"platform"})).toBe(combined);
    expect(scopeContextToTenant(combined,{kind:"unknown"})).toBe(combined);
    expect(scopeContextToTenant(member,{kind:"college",collegeId:COLLEGE_A})).toBe(member);
  });

  it("does not expose a recruiter workspace on a college host when that user holds only an unrelated college grant", () => {
    const combined: RequestContext = {
      ...memberOf(COLLEGE_A), recruiter: recruiterAt(COLLEGE_B).recruiter,
    };
    const scoped=scopeContextToTenant(combined,{kind:"college",collegeId:COLLEGE_A});
    expect(scoped.recruiter).toBeNull();
    expect(isTenantAccessAllowed(scoped,{kind:"college",collegeId:COLLEGE_A})).toBe(true);
  });

  it("fails closed on unknown hosts", () => {
    expect(
      isTenantAccessAllowed(memberOf(COLLEGE_A), { kind: "unknown" }),
    ).toBe(false);
  });
});
