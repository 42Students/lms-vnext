import "server-only";

import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  activityEvents, collegeMemberships, membershipRoles, placementCompanies,
  placementCompanyRelationships, placementJobs, users,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { decideTpoCompanyLifecycle, tpoCompanyLifecycleSchema } from "./tpo-company-lifecycle-model";

export class TpoCompanyLifecycleError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "STALE" | "ACTIVE_DRIVES") {
    super("TPO_COMPANY_" + code);
  }
}
async function companyScope(context: RequestContext) {
  const membership = context.membership;
  if (!membership || !(hasMembershipRole(context, "TPO")||hasMembershipRole(context, "COLLEGE_ADMIN")) ||
    membership.status !== "ACTIVE" || context.user.platformStatus !== "ACTIVE") {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  const college = await requirePlacementManageScope(context, collegeId);
  return { collegeId, organizationId: college.organizationId,
    actorUserId: context.user.id, actorMembershipId: membership.id };
}

export async function getTpoCompanyLifecycle(
  context: RequestContext,
  companyIdInput: unknown,
) {
  const companyId = z.string().uuid().parse(companyIdInput);
  const { collegeId } = await companyScope(context);
  const [row] = await getDb().select({
    relationshipId: placementCompanyRelationships.id,
    name: placementCompanies.name, websiteUrl: placementCompanies.websiteUrl,
    status: placementCompanyRelationships.status,
    isTrusted: placementCompanyRelationships.isTrusted,
    updatedAt: placementCompanyRelationships.updatedAt,
  }).from(placementCompanyRelationships)
    .innerJoin(placementCompanies, eq(placementCompanies.id, placementCompanyRelationships.companyId))
    .where(and(eq(placementCompanyRelationships.companyId, companyId),
      eq(placementCompanyRelationships.collegeId, collegeId))).limit(1);
  return row ? { ...row, updatedAt: row.updatedAt.toISOString() } : null;
}

/** Edit only this college's relationship: global company identity is shared. */
export async function saveTpoCompanyLifecycle(
  context: RequestContext, raw: unknown,
) {
  const scope = await companyScope(context);
  const input = tpoCompanyLifecycleSchema.parse(raw);
  return getDb().transaction(async (tx) => {
    const [principal] = await tx.select({ id: collegeMemberships.id })
      .from(collegeMemberships)
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .innerJoin(membershipRoles, and(eq(membershipRoles.membershipId, collegeMemberships.id), inArray(membershipRoles.role, ["TPO","COLLEGE_ADMIN"])))
      .where(and(eq(collegeMemberships.id, scope.actorMembershipId),
        eq(collegeMemberships.collegeId, scope.collegeId),
        eq(collegeMemberships.userId, scope.actorUserId),
        eq(collegeMemberships.status, "ACTIVE"), eq(users.platformStatus, "ACTIVE")))
      .limit(1);
    if (!principal) throw new AuthorizationError("placements.manage");
    const [current] = await tx.select({
      id: placementCompanyRelationships.id,
      status: placementCompanyRelationships.status,
      isTrusted: placementCompanyRelationships.isTrusted,
      updatedAt: placementCompanyRelationships.updatedAt,
    }).from(placementCompanyRelationships).where(and(
      eq(placementCompanyRelationships.companyId, input.companyId),
      eq(placementCompanyRelationships.collegeId, scope.collegeId),
    )).for("update").limit(1);
    if (!current) throw new TpoCompanyLifecycleError("NOT_FOUND");

    const [activeJob] = input.action === "ARCHIVE" ? await tx.select({
      id: placementJobs.id,
    }).from(placementJobs).where(and(
      eq(placementJobs.companyRelationshipId, current.id),
      eq(placementJobs.collegeId, scope.collegeId),
      inArray(placementJobs.status, ["DRAFT", "PUBLISHED"]),
    )).limit(1) : [];
    const decision = decideTpoCompanyLifecycle(
      current, input, Boolean(activeJob),
    );
    if (decision !== "ALLOW") throw new TpoCompanyLifecycleError(decision);

    const now = new Date(Math.max(Date.now(), current.updatedAt.getTime() + 1));
    const nextStatus = input.action === "ARCHIVE" ? "ARCHIVED" as const :
      "ACTIVE" as const;
    const [saved] = await tx.update(placementCompanyRelationships).set({
      ...(input.action === "EDIT_TRUST"
        ? { isTrusted: input.nextTrusted ?? current.isTrusted }
        : { status: nextStatus, archivedAt: input.action === "ARCHIVE" ? now : null }),
      updatedAt: now,
    }).where(and(
      eq(placementCompanyRelationships.id, current.id),
      eq(placementCompanyRelationships.collegeId, scope.collegeId),
      sql`date_trunc('milliseconds', ${placementCompanyRelationships.updatedAt}) = ${current.updatedAt.toISOString()}::timestamptz`,
    )).returning({
      id: placementCompanyRelationships.id,
      status: placementCompanyRelationships.status,
      isTrusted: placementCompanyRelationships.isTrusted,
      updatedAt: placementCompanyRelationships.updatedAt,
    });
    if (!saved) throw new TpoCompanyLifecycleError("STALE");

    await tx.insert(activityEvents).values({
      organizationId: scope.organizationId, collegeId: scope.collegeId,
      actorUserId: scope.actorUserId, actorMembershipId: scope.actorMembershipId,
      module: "PLACEMENTS", eventType: "PLACEMENTS_COMPANY_LIFECYCLE_CHANGED",
      subjectType: "placement_company_relationship", subjectId: saved.id,
      summary: "TPO updated own-college company relationship",
      metadata: { action: input.action, reason: input.reason,
        fromStatus: current.status, toStatus: saved.status,
        fromTrusted: current.isTrusted, toTrusted: saved.isTrusted },
      occurredAt: now,
    });
    return { ...saved, updatedAt: saved.updatedAt.toISOString() };
  });
}


export async function listArchivedTpoCompanyRelationships(context: RequestContext) {
  const { collegeId } = await companyScope(context);
  const rows = await getDb().select({
    companyId: placementCompanyRelationships.companyId,
    name: placementCompanies.name,
    archivedAt: placementCompanyRelationships.archivedAt,
  }).from(placementCompanyRelationships)
    .innerJoin(placementCompanies,
      eq(placementCompanies.id, placementCompanyRelationships.companyId))
    .where(and(
      eq(placementCompanyRelationships.collegeId, collegeId),
      eq(placementCompanyRelationships.status, "ARCHIVED"),
    ))
    .orderBy(asc(placementCompanies.name))
    .limit(101);
  return { rows: rows.slice(0, 100), truncated: rows.length > 100 };
}
