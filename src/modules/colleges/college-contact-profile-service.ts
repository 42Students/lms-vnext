import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeBranding, collegeMemberships, colleges, membershipRoles, users } from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { getCollegeBranding } from "./branding-service";
import {
  collegeContactProfileChanged,
  collegeContactProfileInputSchema,
} from "./college-contact-profile-model";

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
type TxRunner = <T>(work: (tx: Tx) => Promise<T>) => Promise<T>;

export class CollegeContactProfileError extends Error {
  constructor(public readonly code:
    "COLLEGE_NOT_FOUND" | "COLLEGE_PROFILE_STALE" | "COLLEGE_PROFILE_UNCHANGED") {
    super(code); this.name = "CollegeContactProfileError";
  }
}

function activeCollegeAdmin(context: RequestContext) {
  const member = context.membership;
  if (!member || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
      !can(context, "college.manage", {
        collegeId: member.collegeId,
        organizationId: member.organizationId,
      })) throw new AuthorizationError("college.manage");
  requirePermission(context, "college.manage", {
    collegeId: member.collegeId,
    organizationId: member.organizationId,
  });
  return member;
}

export async function getOwnCollegeContactProfile(context: RequestContext) {
  const member = activeCollegeAdmin(context);
  const branding = await getCollegeBranding(context, member.collegeId);
  return {
    collegeName: branding.collegeName,
    supportEmail: branding.supportEmail,
    supportPhone: branding.supportPhone,
    termsUrl: branding.termsUrl,
    privacyUrl: branding.privacyUrl,
    version: branding.version,
  };
}

/** Serializes the college name and support edits with branding version and audit.
 * Visual branding and identity of college code/address are never overwritten. */
export async function updateOwnCollegeContactProfile(
  context: RequestContext,
  raw: unknown,
  transaction: TxRunner = (fn) => getDb().transaction(fn),
) {
  const input = collegeContactProfileInputSchema.parse(raw);
  const member = activeCollegeAdmin(context);
  return transaction(async tx => {
    const [college] = await tx.select({
      id: colleges.id,
      name: colleges.name,
      organizationId: colleges.organizationId,
      status: colleges.status,
    }).from(colleges)
      .where(and(
        eq(colleges.id, member.collegeId),
        eq(colleges.organizationId, member.organizationId),
      )).for("update").limit(1);
    if (!college || college.status !== "ACTIVE")
      throw new CollegeContactProfileError("COLLEGE_NOT_FOUND");

    // Recheck persisted actor rights inside the transaction; RequestContext may be stale.
    const [actor] = await tx.select({ membershipId: collegeMemberships.id })
      .from(collegeMemberships)
      .innerJoin(users, and(
        eq(users.id, collegeMemberships.userId),
        eq(users.id, context.user.id),
        eq(users.platformStatus, "ACTIVE"),
      ))
      .innerJoin(membershipRoles, and(
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, "COLLEGE_ADMIN"),
      ))
      .where(and(
        eq(collegeMemberships.id, member.id),
        eq(collegeMemberships.collegeId, college.id),
        eq(collegeMemberships.status, "ACTIVE"),
      )).for("share", { of: collegeMemberships }).limit(1);
    if (!actor) throw new AuthorizationError("college.manage");

    const [branding] = await tx.select().from(collegeBranding)
      .where(eq(collegeBranding.collegeId, college.id))
      .for("update").limit(1);
    const priorVersion = branding?.version ?? 0;
    if (priorVersion !== input.expectedVersion)
      throw new CollegeContactProfileError("COLLEGE_PROFILE_STALE");

    const after = {
      collegeName: input.collegeName,
      supportEmail: input.supportEmail,
      supportPhone: input.supportPhone,
      termsUrl: input.termsUrl,
      privacyUrl: input.privacyUrl,
    };
    const before = {
      collegeName: college.name,
      supportEmail: branding?.supportEmail ?? null,
      supportPhone: branding?.supportPhone ?? null,
      termsUrl: branding?.termsUrl ?? null,
      privacyUrl: branding?.privacyUrl ?? null,
    };
    if (!collegeContactProfileChanged(before, after))
      throw new CollegeContactProfileError("COLLEGE_PROFILE_UNCHANGED");

    if (college.name !== input.collegeName) {
      await tx.update(colleges).set({
        name: input.collegeName, updatedAt: new Date(),
      }).where(eq(colleges.id, college.id));
    }

    const details = {
      supportEmail: input.supportEmail,
      supportPhone: input.supportPhone,
      termsUrl: input.termsUrl,
      privacyUrl: input.privacyUrl,
    };
    const [saved] = branding
      ? await tx.update(collegeBranding).set({
          ...details, updatedAt: new Date(),
          version: sql`${collegeBranding.version} + 1`,
        }).where(and(
          eq(collegeBranding.collegeId, college.id),
          eq(collegeBranding.version, priorVersion),
        )).returning()
      : await tx.insert(collegeBranding).values({
          collegeId: college.id,
          ...details,
        }).returning();
    if (!saved) throw new CollegeContactProfileError("COLLEGE_PROFILE_STALE");

    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_CONTACT_UPDATED,
      organizationId: college.organizationId,
      collegeId: college.id,
      subjectType: "college",
      subjectId: college.id,
      summary: "College display and support contact profile updated",
      metadata: {
        nameChanged: before.collegeName !== after.collegeName,
        emailChanged: before.supportEmail !== after.supportEmail,
        phoneChanged: before.supportPhone !== after.supportPhone,
        termsLinkChanged: before.termsUrl !== after.termsUrl,
        privacyLinkChanged: before.privacyUrl !== after.privacyUrl,
        // Never put phone/email values in the activity metadata.
        previousVersion: priorVersion,
        version: saved.version,
      },
    });
    return { ...after, version: saved.version };
  });
}
