import "server-only";
import { and, asc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships, placementApplications, placementCompanies,
  placementCompanyRelationships, placementJobs, placementOffers, users,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import {
  isoDateInIndia, plusCalendarDays, projectTpoOfferExpiryWatchlist,
  tpoOfferExpiryQuerySchema,
} from "./tpo-offer-expiry-model";

/** Read-only TPO watchlist. All date bounds are comparable IST YYYY-MM-DD text. */
export async function getTpoOfferExpiryWatchlist(
  context: RequestContext, raw: unknown, now: Date = new Date(),
) {
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "TPO") ||
      membership.status !== "ACTIVE" || context.user.platformStatus !== "ACTIVE") {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  const { days } = tpoOfferExpiryQuerySchema.parse(raw);
  await requirePlacementManageScope(context, collegeId);
  const from = isoDateInIndia(now);
  const until = plusCalendarDays(from, days);
  const istDay = sql<string>`to_char(${placementOffers.expiresAt} at time zone 'Asia/Kolkata', 'YYYY-MM-DD')`;
  const data = await getDb().select({
    offerId: placementOffers.id,
    jobId: placementJobs.id,
    jobTitle: placementJobs.title,
    companyName: placementCompanies.name,
    roleTitle: placementOffers.roleTitle,
    candidateName: users.displayName,
    status: placementOffers.status,
    expiryAt: placementOffers.expiresAt,
    expiryDayIst: istDay.as("expiry_day_ist"),
  }).from(placementOffers)
    .innerJoin(placementApplications, eq(placementApplications.id, placementOffers.applicationId))
    .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
    .innerJoin(placementCompanyRelationships, and(
      eq(placementCompanyRelationships.id, placementJobs.companyRelationshipId),
      eq(placementCompanyRelationships.collegeId, collegeId),
    ))
    .innerJoin(placementCompanies, eq(placementCompanies.id, placementCompanyRelationships.companyId))
    .innerJoin(collegeMemberships, eq(collegeMemberships.id, placementApplications.membershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .where(and(
      eq(placementJobs.collegeId, collegeId),
      eq(collegeMemberships.collegeId, collegeId),
      isNull(placementJobs.archivedAt),
      eq(placementOffers.status, "ISSUED"),
      isNotNull(placementOffers.expiresAt),
      sql`${istDay} >= ${from}::text`,
      sql`${istDay} <= ${until}::text`,
    ))
    .orderBy(asc(placementOffers.expiresAt), asc(placementCompanies.name), asc(placementOffers.id))
    .limit(201);
  const projected = projectTpoOfferExpiryWatchlist(data.map((row) => ({
    offerId: row.offerId, jobId: row.jobId, jobTitle: row.jobTitle,
    companyName: row.companyName, roleTitle: row.roleTitle,
    candidateName: row.candidateName, status: row.status,
    expiryDayIst: row.expiryDayIst,
    expiryAtIso: row.expiryAt?.toISOString() ?? "",
  })), from, until);
  return {
    ...projected,
    days,
    asOf: now.toISOString(),
    scopeNote: "Current ISSUED offer versions only. Expiry is compared by the recorded timestamp's IST calendar date; a missing expiry date is not treated as overdue. The list is capped at 200 visible offers, with a truncation warning.",
  };
}
