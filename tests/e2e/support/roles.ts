import { expect, type BrowserContext } from "@playwright/test";
import { E2E_IDENTITY_COOKIE_NAME, E2E_SECRET_COOKIE_NAME } from "../../../src/auth/e2e-identity";
import { SEED_IDS } from "../../../scripts/db-seed-data";

export type GracefulRole = "learner" | "faculty" | "mentor" | "college" | "tpo" | "recruiter" | "superadmin";
const baseUrl = "http://localhost:3000";

const identities: Record<GracefulRole, {
  uid: string; membershipId?: string; membershipRole?: string;
}> = {
  learner: { uid: "seed-learner", membershipId: SEED_IDS.learnerCollegeAMembership },
  faculty: { uid: "seed-shared-faculty", membershipId: SEED_IDS.facultyCollegeAMembership, membershipRole: "FACULTY" },
  mentor: { uid: "lms_test_919100061103", membershipRole: "MENTOR" },
  college: { uid: "seed-college-admin", membershipId: SEED_IDS.collegeAdminMembership },
  tpo: { uid: "lms_test_919100061105", membershipRole: "TPO" },
  recruiter: { uid: "lms_test_919100061301" },
  superadmin: { uid: "seed-superadmin" },
};

export async function authenticateGracefulRole(
  context: BrowserContext, role: GracefulRole,
): Promise<void> {
  const secret = process.env.E2E_AUTH_SECRET;
  if (!secret) throw new Error("E2E_AUTH_SECRET required for the failure suite");
  const account = identities[role];
  await context.clearCookies();
  await context.addCookies([
    { name: E2E_IDENTITY_COOKIE_NAME, value: account.uid,
      url: baseUrl, sameSite: "Lax", httpOnly: true },
    { name: E2E_SECRET_COOKIE_NAME, value: secret,
      url: baseUrl, sameSite: "Lax", httpOnly: true },
    ...(account.membershipId ? [{
      name: "lms_membership", value: account.membershipId,
      url: baseUrl, sameSite: "Lax" as const, httpOnly: true,
    }] : []),
  ]);
  if (account.membershipRole) {
    const response = await context.request.get(baseUrl + "/api/auth/memberships");
    expect(response.ok(), "GR-80: seeded role must have a real membership").toBe(true);
    const payload = await response.json() as {
      memberships: { id: string; roles: string[] }[];
    };
    const matching = payload.memberships.find(
      (membership) => membership.roles.includes(account.membershipRole!),
    );
    expect(matching, "GR-80: seed-test-tenants.ts must have been run").toBeDefined();
    await context.addCookies([{
      name: "lms_membership", value: matching!.id,
      url: baseUrl, sameSite: "Lax", httpOnly: true,
    }]);
    await context.addCookies([{
      name:"lms_role",value:account.membershipRole,
      url:baseUrl,sameSite:"Lax",httpOnly:true,
    }]);
  }
}
