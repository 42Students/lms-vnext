import "server-only";

import { and, eq, isNull, or, sql, type SQL } from "drizzle-orm";
import { activityEvents } from "@/db/schema";
import {
  hasActiveRecruiter,
  isSuperAdmin,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";

/**
 * Recipient identity alone is NOT an inbox authorization boundary: one person
 * may be a learner in College A and a faculty member in College B.
 * Every inbox read and acknowledgement must also filter its originating
 * activity event against the live, explicitly selected workspace.
 *
 * College receipts are private to their selected college. Organization-wide
 * notices (college_id NULL, organization_id matching) remain available to
 * that organization's enrolled members. Platform-global notices belong to
 * the separate platform workspace, never to an ordinary college session.
 */
export function ownNotificationEventScope(context: RequestContext): SQL {
  if (context.user.platformStatus !== "ACTIVE") {
    throw new AuthorizationError("activity.read");
  }

  if (context.membership) {
    const membership = context.membership;
    if (membership.status !== "ACTIVE" || membership.roles.length !== 1) {
      throw new AuthorizationError("activity.read");
    }
    return and(
      eq(activityEvents.organizationId, membership.organizationId),
      or(
        eq(activityEvents.collegeId, membership.collegeId),
        isNull(activityEvents.collegeId),
      ),
    )!;
  }

  // Super Admin is an explicitly selected platform context; never union its
  // privileges into a college membership. A selected administrative scope
  // only narrows this principal's own notifications.
  if (isSuperAdmin(context)) {
    if (context.adminScope?.collegeId && context.adminScope.organizationId) {
      return and(
        eq(activityEvents.collegeId, context.adminScope.collegeId),
        eq(activityEvents.organizationId, context.adminScope.organizationId),
      )!;
    }
    if (context.adminScope?.collegeId) {
      return eq(activityEvents.collegeId, context.adminScope.collegeId);
    }
    if (context.adminScope?.organizationId) {
      return eq(activityEvents.organizationId, context.adminScope.organizationId);
    }
    return sql`true`;
  }

  // Recruiter notifications are tied to active, persisted company-college
  // grants. A generic recipient ID or a removed company grant is not enough.
  if (hasActiveRecruiter(context) && context.recruiter) {
    const scopes = context.recruiter.grants.map(grant => and(
      eq(activityEvents.organizationId, grant.organizationId),
      eq(activityEvents.collegeId, grant.collegeId),
    )!);
    if (scopes.length > 0) return or(...scopes)!;
  }

  // Missing/ambiguous workspace, inactive recruiter or no grants: deny.
  throw new AuthorizationError("activity.read");
}
