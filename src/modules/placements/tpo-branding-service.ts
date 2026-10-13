import "server-only";

import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  collegeBranding,
  colleges,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import {
  AuthorizationError,
} from "@/modules/permissions/policy";

import {
  describeTpoPlacementBranding,
} from "./tpo-branding-model";
import {
  requirePlacementManageScope,
} from "./scope";

/**
 * Read the selected TPO's own college-wide branding.
 *
 * No college ID or membership ID is accepted from
 * the caller. The active membership and centralized
 * placements.manage scope are checked before the query.
 *
 * Only the display name, public logo URL and two
 * brand colours are selected. We intentionally do
 * not select college.logoObjectPath (private storage),
 * contacts, tenant verification tokens, credentials
 * or unrelated branding fields.
 *
 * No placement-specific branding table is inferred.
 */
export async function getTpoPlacementBranding(
  context: RequestContext,
) {
  const membership = context.membership;

  if (
    !membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    throw new AuthorizationError(
      "placements.manage",
    );
  }

  const college =
    await requirePlacementManageScope(
      context,
      membership.collegeId,
    );

  const [row] = await getDb()
    .select({
      collegeName: colleges.name,
      brandingCollegeId:
        collegeBranding.collegeId,
      logoUrl: collegeBranding.logoUrl,
      primaryColor: collegeBranding.primaryColor,
      secondaryColor:
        collegeBranding.secondaryColor,
    })
    .from(colleges)
    .leftJoin(
      collegeBranding,
      eq(
        collegeBranding.collegeId,
        colleges.id,
      ),
    )
    .where(
      and(
        eq(colleges.id, college.id),
        eq(
          colleges.organizationId,
          membership.organizationId,
        ),
        eq(colleges.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!row) {
    throw new AuthorizationError(
      "placements.manage",
    );
  }

  return describeTpoPlacementBranding({
    collegeName: row.collegeName,
    brandingRecordExists:
      row.brandingCollegeId !== null,
    logoUrl: row.logoUrl,
    primaryColor: row.primaryColor,
    secondaryColor: row.secondaryColor,
  });
}
