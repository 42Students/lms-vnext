import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementCompanies,
  placementRecruiterCollegeGrants,
  placementRecruiterProfiles,
  users,
} from "@/db/schema";
import { hasActiveRecruiter, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { placementRecruiterGrantIdSchema } from "./validation";

export function ownRecruiterGrant(
  context: RequestContext,
  grantId: string,
) {
  if (!hasActiveRecruiter(context) || !context.recruiter) {
    throw new AuthorizationError("placements.recruiter.read");
  }
  const grant = context.recruiter.grants.find((item) => item.id === grantId);
  if (!grant) throw new AuthorizationError("placements.recruiter.read");
  return grant;
}

export async function getRecruiterSelfProfile(context: RequestContext) {
  if (!hasActiveRecruiter(context) || !context.recruiter) {
    throw new AuthorizationError("placements.recruiter.read");
  }
  const [row] = await getDb()
    .select({
      userId: users.id,
      displayName: users.displayName,
      email: users.email,
      phoneE164: users.phoneE164,
      title: placementRecruiterProfiles.title,
      companyId: placementCompanies.id,
      companyName: placementCompanies.name,
    })
    .from(users)
    .innerJoin(
      placementRecruiterProfiles,
      eq(placementRecruiterProfiles.userId, users.id),
    )
    .innerJoin(
      placementCompanies,
      eq(placementCompanies.id, placementRecruiterProfiles.companyId),
    )
    .where(and(
      eq(users.id, context.user.id),
      eq(users.platformStatus, "ACTIVE"),
      eq(placementRecruiterProfiles.status, "ACTIVE"),
      eq(placementCompanies.status, "ACTIVE"),
    ))
    .limit(1);
  if (!row) throw new AuthorizationError("placements.recruiter.read");
  return { ...row, grants: context.recruiter.grants };
}

export async function leaveOwnRecruiterCollegeAccess(
  context: RequestContext,
  rawGrantId: string,
  now = new Date(),
) {
  const grantId = placementRecruiterGrantIdSchema.parse(rawGrantId);
  ownRecruiterGrant(context, grantId);
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new AuthorizationError("placements.recruiter.read");
  }

  const [revoked] = await getDb()
    .update(placementRecruiterCollegeGrants)
    .set({
      status: "REVOKED",
      revokedByUserId: context.user.id,
      revokedAt: now,
      updatedAt: now,
    })
    .where(and(
      eq(placementRecruiterCollegeGrants.id, grantId),
      eq(placementRecruiterCollegeGrants.recruiterUserId, context.user.id),
      eq(placementRecruiterCollegeGrants.status, "ACTIVE"),
    ))
    .returning({ id: placementRecruiterCollegeGrants.id });

  // A stale/revoked/forged grant is indistinguishable to the caller.
  if (!revoked) throw new AuthorizationError("placements.recruiter.read");
  return { grantId: revoked.id, status: "REVOKED" as const };
}
