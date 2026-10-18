import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";
import { mayReadGlobalProjectAudit } from "@/modules/projects/admin-audit-access-model";
import { can } from "@/modules/permissions/policy";

const COLLEGE_A = "college-a";
const COLLEGE_B = "college-b";
const ORG_A = "org-a";
const ORG_B = "org-b";

function context({
  superAdmin = true,
  platformActive = true,
  collegeId = COLLEGE_A,
  organizationId = ORG_A,
  membershipRole = "LEARNER",
  membershipActive = true,
}: {
  superAdmin?: boolean;
  platformActive?: boolean;
  collegeId?: string | null;
  organizationId?: string | null;
  membershipRole?: "LEARNER" | "MENTOR" | "COLLEGE_ADMIN";
  membershipActive?: boolean;
} = {}): RequestContext {
  return {
    user: {
      id: "actor-a",
      identityUid: "identity-a",
      platformStatus: platformActive ? "ACTIVE" : "DISABLED",
      systemRoles: superAdmin ? ["SUPER_ADMIN"] : [],
    },
    // Deliberately conflicting dual-role identity: a membership in college B
    // can NEVER silently replace the explicit admin selection of college A.
    membership: {
      id: "membership-b",
      organizationId: ORG_B,
      collegeId: COLLEGE_B,
      status: membershipActive ? "ACTIVE" : "SUSPENDED",
      roles: [membershipRole],
    },
    adminScope: {collegeId, organizationId},
  };
}

describe("IIT Dharwad Super Admin Projects read and audit break-it matrix", () => {
  it("PROJ-BREAK-SA-17 refuses an unselected or forged college even for a dual-role platform admin", () => {
    const selected = context();
    expect(getProjectAdminCollegeId(selected)).toBe(COLLEGE_A);
    expect(can(selected,"projects.manage",{collegeId:COLLEGE_B,organizationId:ORG_B})).toBe(false);
    expect(getProjectAdminCollegeId(context({collegeId:null}))).toBeNull();
    expect(getProjectAdminCollegeId(context({collegeId:null,organizationId:null}))).toBeNull();
    // The navigation model does not have the persisted college->organization map.\n    // The service authorization must still reject the inconsistent pair.\n    expect(can(context({organizationId:ORG_B}),"projects.manage",{collegeId:COLLEGE_A,organizationId:ORG_A})).toBe(false);
    expect(getProjectAdminCollegeId(context({platformActive:false}))).toBeNull();
  });

  it("PROJ-BREAK-SA-18 cannot read global audit while a college or organization is selected", () => {
    expect(mayReadGlobalProjectAudit(context())).toBe(false);
    expect(mayReadGlobalProjectAudit(context({collegeId:null,organizationId:ORG_A}))).toBe(false);
    expect(mayReadGlobalProjectAudit(context({collegeId:COLLEGE_A,organizationId:null}))).toBe(false);
    expect(mayReadGlobalProjectAudit(context({collegeId:null,organizationId:null}))).toBe(true);
  });

  it("PROJ-BREAK-SA-19 forbids suspended admins, inactive users and cross-role escalation", () => {
    expect(mayReadGlobalProjectAudit(context({platformActive:false,collegeId:null,organizationId:null}))).toBe(false);
    expect(mayReadGlobalProjectAudit(context({superAdmin:false,collegeId:null,organizationId:null}))).toBe(false);
    expect(mayReadGlobalProjectAudit(context({superAdmin:false,membershipRole:"COLLEGE_ADMIN",collegeId:null,organizationId:null}))).toBe(false);
    expect(getProjectAdminCollegeId(context({superAdmin:false,membershipRole:"LEARNER"}))).toBeNull();
    expect(getProjectAdminCollegeId(context({superAdmin:false,membershipRole:"MENTOR"}))).toBeNull();
    expect(getProjectAdminCollegeId(context({superAdmin:false,membershipRole:"COLLEGE_ADMIN"}))).toBe(COLLEGE_B);
    expect(getProjectAdminCollegeId(context({superAdmin:false,membershipRole:"COLLEGE_ADMIN",membershipActive:false}))).toBeNull();
    expect(mayReadGlobalProjectAudit(null)).toBe(false);
  });
});
