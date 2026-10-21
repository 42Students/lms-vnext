import "server-only";

import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships, colleges, membershipRoles, organizations,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { isSuperAdmin } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";

/**
 * Development-only seeded fixtures are distinct from the identity override.
 * Two colleges belong to separate organizations. Each has a college admin,
 * faculty member and learner with a stable reserved test contact.
 *
 * This function intentionally cannot be called by a learner, college admin,
 * an impersonated role or a scoped Super Admin. The route adds separate
 * first-party session, origin and explicit environment/secret protections.
 */
export async function seedDevE2eCollegeFixtures(context: RequestContext) {
  if (!isSuperAdmin(context) || !can(context, "system-role.manage")) {
    throw new Error("E2E_SEED_NOT_SUPER_ADMIN");
  }

  const fixtures = [
    { tag: "a", org: "LMS E2E Fixture Organization A", code: "LMS-E2E-A", college: "LMS E2E College A" },
    { tag: "b", org: "LMS E2E Fixture Organization B", code: "LMS-E2E-B", college: "LMS E2E College B" },
  ] as const;
  const identities = [
    { tag: "admin", role: "COLLEGE_ADMIN" as const, phoneIndex: 1 },
    { tag: "faculty", role: "FACULTY" as const, phoneIndex: 2 },
    { tag: "learner", role: "LEARNER" as const, phoneIndex: 3 },
  ] as const;
  return getDb().transaction(async tx => {
    // Advisory lock serializes concurrent harness invocations. If any insert
    // fails, all fixture changes roll back and the next request is retryable.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('lms-vnext-dev-e2e-fixtures'))`);
    let created = 0;
    let reused = 0;
    const collegesResult: { code: string; collegeId: string; organizationId: string }[] = [];
    const accounts: {
      collegeCode: string; role: "COLLEGE_ADMIN" | "FACULTY" | "LEARNER";
      identityUid: string; phone: string; membershipId: string;
    }[] = [];

    for (const fixture of fixtures) {
      const existingOrganization = await tx.select({ id: organizations.id })
        .from(organizations).where(eq(organizations.name, fixture.org)).limit(1);
      let organizationId = existingOrganization[0]?.id;
      if (organizationId) reused++;
      else {
        const [inserted] = await tx.insert(organizations)
          .values({ name: fixture.org }).returning({ id: organizations.id });
        if (!inserted) throw new Error("E2E_SEED_ORGANIZATION_FAILED");
        organizationId = inserted.id;
        created++;
      }
      const existingCollege = await tx.select({ id: colleges.id, organizationId: colleges.organizationId })
        .from(colleges).where(eq(colleges.code, fixture.code)).limit(1);
      let collegeId = existingCollege[0]?.id;
      if (existingCollege[0] && existingCollege[0].organizationId !== organizationId) {
        throw new Error("E2E_SEED_SCOPE_CONFLICT");
      }
      if (collegeId) reused++;
      else {
        const [inserted] = await tx.insert(colleges).values({
          organizationId, code: fixture.code, name: fixture.college,
        }).returning({ id: colleges.id });
        if (!inserted) throw new Error("E2E_SEED_COLLEGE_FAILED");
        collegeId = inserted.id;
        created++;
      }
      collegesResult.push({ code: fixture.code, collegeId, organizationId });

      for (const identity of identities) {
        // +1 555-0100..0199 is a fictional-use phone range, not a real recipient.
        const phone = `+1202555010${fixture.tag === "a" ? identity.phoneIndex : identity.phoneIndex + 3}`;
        const identityUid = `e2e-seed-${fixture.tag}-${identity.tag}`;
        const [existingUser] = await tx.select({ id: users.id, phoneE164: users.phoneE164 })
          .from(users).where(eq(users.identityUid, identityUid)).limit(1);
        if (existingUser && existingUser.phoneE164 !== phone) {
          throw new Error("E2E_SEED_IDENTITY_CONFLICT");
        }
        let userId = existingUser?.id;
        if (userId) reused++;
        else {
          const [inserted] = await tx.insert(users).values({
            identityUid, phoneE164: phone,
            displayName: `E2E ${fixture.code} ${identity.role}`,
          }).returning({ id: users.id });
          if (!inserted) throw new Error("E2E_SEED_IDENTITY_FAILED");
          userId = inserted.id;
          created++;
        }

        const [existingMembership] = await tx.select({ id: collegeMemberships.id })
          .from(collegeMemberships)
          .where(sql`${collegeMemberships.userId} = ${userId} and ${collegeMemberships.collegeId} = ${collegeId}`)
          .limit(1);
        let membershipId = existingMembership?.id;
        if (membershipId) reused++;
        else {
          const [inserted] = await tx.insert(collegeMemberships).values({
            userId, collegeId,
          }).returning({ id: collegeMemberships.id });
          if (!inserted) throw new Error("E2E_SEED_MEMBERSHIP_FAILED");
          membershipId = inserted.id;
          created++;
        }
        const [existingRole] = await tx.select({ id: membershipRoles.id }).from(membershipRoles)
          .where(sql`${membershipRoles.membershipId} = ${membershipId} and ${membershipRoles.role} = ${identity.role}`)
          .limit(1);
        if (existingRole) reused++;
        else {
          await tx.insert(membershipRoles).values({
            membershipId, role: identity.role, assignedByUserId: context.user.id,
          });
          created++;
        }
        accounts.push({ collegeCode: fixture.code, role: identity.role, identityUid, phone, membershipId });
      }
    }
    // The caller must already be a global SUPER_ADMIN. Do not grant that
    // system role to any seeded account; exercising privileged login uses
    // the authenticated operator rather than inventing an admin bypass.
    return { created, reused, colleges: collegesResult, accounts };
  });
}
