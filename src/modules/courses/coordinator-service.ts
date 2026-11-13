import "server-only";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  courseOfferingCoordinatorEvents,
  courseOfferingCoordinators,
  courseOfferings,
  courseSectionDeliveries,
  courseTeachingAssignments,
  courses,
  membershipRoles,
  users,
} from "@/db/schema";
import { hasMembershipRole, isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import {
  assertPersistedPlatformPermission,
  type PermissionTransaction,
} from "@/modules/permissions/persisted-actor";
import { recordSecurityEvent } from "@/security/audit-store";
import { CoursesServiceError, postgresConstraintName } from "./errors";
import { loadCourseOfferingScope } from "./scope";
import {
  coordinatorGrantCounts,
  isEligibleNominee,
  type CoordinatorEventAction,
  type CoordinatorFacts,
} from "./coordinator-policy";

import { ROLE } from "@/modules/identity/roles";
type Reader = Pick<PermissionTransaction, "select">;

const idSchema = z.string().uuid();

export type OfferingScope = {
  id: string;
  collegeId: string;
  organizationId: string;
};

export type OfferingContentAuthority = "ADMIN" | "COORDINATOR";

/**
 * Reads the live facts that decide whether a nomination counts. With `lock` it takes SHARE locks, so a concurrent
 * role removal, suspension or end of teaching waits for (or is seen by) the write that depends on it.
 */
async function loadCoordinatorFacts(
  reader: Reader,
  input: { membershipId: string; offeringId: string; collegeId: string },
  lock = false,
): Promise<CoordinatorFacts> {
  const person = reader
    .select({
      membershipCollegeId: collegeMemberships.collegeId,
      membershipStatus: collegeMemberships.status,
      platformStatus: users.platformStatus,
    })
    .from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .where(eq(collegeMemberships.id, input.membershipId))
    .limit(1);
  const [row] = lock ? await person.for("share") : await person;

  const roleQuery = reader
    .select({ id: membershipRoles.id })
    .from(membershipRoles)
    .where(
      and(
        eq(membershipRoles.membershipId, input.membershipId),
        eq(membershipRoles.role, "FACULTY"),
      ),
    )
    .limit(1);
  const [role] = lock ? await roleQuery.for("share") : await roleQuery;

  const teachingQuery = reader
    .select({ id: courseTeachingAssignments.id })
    .from(courseTeachingAssignments)
    .innerJoin(
      courseSectionDeliveries,
      eq(courseSectionDeliveries.id, courseTeachingAssignments.deliveryId),
    )
    .where(
      and(
        eq(courseTeachingAssignments.membershipId, input.membershipId),
        eq(courseSectionDeliveries.offeringId, input.offeringId),
        isNull(courseTeachingAssignments.endedAt),
        isNull(courseSectionDeliveries.endedAt),
      ),
    )
    .limit(1);
  const [teaching] = lock ? await teachingQuery.for("share") : await teachingQuery;

  const grantQuery = reader
    .select({ id: courseOfferingCoordinators.id, collegeId: courseOfferingCoordinators.collegeId })
    .from(courseOfferingCoordinators)
    .where(
      and(
        eq(courseOfferingCoordinators.offeringId, input.offeringId),
        eq(courseOfferingCoordinators.membershipId, input.membershipId),
        isNull(courseOfferingCoordinators.revokedAt),
      ),
    )
    .limit(1);
  const [grant] = lock ? await grantQuery.for("share") : await grantQuery;

  return {
    grantActive: Boolean(grant),
    sameCollege:
      Boolean(row) &&
      row!.membershipCollegeId === input.collegeId &&
      (grant === undefined || grant.collegeId === input.collegeId),
    userActive: row?.platformStatus === "ACTIVE",
    membershipActive: row?.membershipStatus === "ACTIVE",
    hasFacultyRole: Boolean(role),
    teachesOffering: Boolean(teaching),
  };
}

function activeFacultyMembership(context: RequestContext, collegeId: string) {
  const membership = context.membership;
  if (
    !membership ||
    membership.status !== "ACTIVE" ||
    membership.collegeId !== collegeId ||
    !membership.roles.includes(ROLE.FACULTY)
  ) {
    return null;
  }
  return membership;
}

/**
 * Who may change this offering's shared content right now: a college admin, or the offering's coordinator while the
 * nomination counts. Null means neither. This is a request-time check; writes must also call
 * assertPersistedOfferingContentAuthority inside their transaction.
 */
export async function resolveOfferingContentAuthority(
  context: RequestContext,
  offering: OfferingScope,
): Promise<OfferingContentAuthority | null> {
  const scope = { organizationId: offering.organizationId, collegeId: offering.collegeId };
  if (can(context, "courses.manage", scope)) return "ADMIN";
  const membership = activeFacultyMembership(context, offering.collegeId);
  if (!membership) return null;
  const facts = await loadCoordinatorFacts(getDb(), {
    membershipId: membership.id,
    offeringId: offering.id,
    collegeId: offering.collegeId,
  });
  return coordinatorGrantCounts(facts) ? "COORDINATOR" : null;
}

/** Throws FACULTY_TEACHING_SCOPE_REQUIRED unless the actor is an admin or counted coordinator of this offering. */
export async function requireOfferingContentAuthority(
  context: RequestContext,
  offering: OfferingScope,
): Promise<OfferingContentAuthority> {
  const authority = await resolveOfferingContentAuthority(context, offering);
  if (!authority) throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  return authority;
}

/**
 * Transaction-time recheck. A signed cookie can outlive a role, a suspension or a teaching assignment, so the
 * persisted facts are read again under SHARE locks in the same transaction as the write.
 */
export async function assertPersistedOfferingContentAuthority(
  tx: PermissionTransaction,
  context: RequestContext,
  offering: OfferingScope,
): Promise<OfferingContentAuthority> {
  const scope = { organizationId: offering.organizationId, collegeId: offering.collegeId };
  if (can(context, "courses.manage", scope)) {
    await assertPersistedPlatformPermission(tx, context, "courses.manage", scope);
    return "ADMIN";
  }
  const submitted = activeFacultyMembership(context, offering.collegeId);
  if (!submitted) throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  try {
    await assertPersistedPlatformPermission(tx, context, "courses.read", scope);
  } catch {
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  }
  const facts = await loadCoordinatorFacts(
    tx,
    { membershipId: submitted.id, offeringId: offering.id, collegeId: offering.collegeId },
    true,
  );
  if (!coordinatorGrantCounts(facts)) {
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  }
  return "COORDINATOR";
}

/**
 * Gate for writes to the shared (all-sections) structure of one offering: lessons and shared lesson items.
 * Admin behaviour is exactly what it was: a Super Admin or College Admin holding courses.manage. The only addition
 * is the offering's counted coordinator. Everyone else gets the same AuthorizationError as before.
 */
export async function requireSharedContentAuthority(
  context: RequestContext,
  scope: { offeringId: string; collegeId: string; organizationId: string },
): Promise<OfferingContentAuthority> {
  if (isSuperAdmin(context) || hasMembershipRole(context, ROLE.COLLEGE_ADMIN)) {
    requirePermission(context, "courses.manage", {
      organizationId: scope.organizationId,
      collegeId: scope.collegeId,
    });
    return "ADMIN";
  }
  const authority = await resolveOfferingContentAuthority(context, {
    id: scope.offeringId,
    collegeId: scope.collegeId,
    organizationId: scope.organizationId,
  });
  if (authority !== "COORDINATOR") throw new AuthorizationError("courses.manage");
  return authority;
}

/** Inside a write transaction: coordinators are re-verified from persisted facts; admins are checked by their own guard. */
export async function assertCoordinatorStillCounts(
  tx: PermissionTransaction,
  context: RequestContext,
  authority: OfferingContentAuthority,
  scope: { offeringId: string; collegeId: string; organizationId: string },
): Promise<void> {
  if (authority !== "COORDINATOR") return;
  await assertPersistedOfferingContentAuthority(tx, context, {
    id: scope.offeringId,
    collegeId: scope.collegeId,
    organizationId: scope.organizationId,
  });
}

/**
 * Transaction-time recheck for shared-content writes made through services that already authorised the request.
 * Admins are unchanged (their own guards apply); anyone else must still be the offering's counted coordinator.
 */
export async function assertSharedWriteStillAllowed(
  tx: PermissionTransaction,
  context: RequestContext,
  scope: { offeringId: string; collegeId: string; organizationId: string },
): Promise<void> {
  if (isSuperAdmin(context) || hasMembershipRole(context, ROLE.COLLEGE_ADMIN)) return;
  await assertPersistedOfferingContentAuthority(tx, context, {
    id: scope.offeringId,
    collegeId: scope.collegeId,
    organizationId: scope.organizationId,
  });
}

export type OfferingCoordinatorView = {
  grantId: string;
  membershipId: string;
  displayName: string;
  email: string | null;
  grantedAt: string;
  /** False while the nominee no longer teaches the offering (or is suspended): the nomination stays but is idle. */
  counts: boolean;
};

export type EligibleCoordinator = {
  membershipId: string;
  displayName: string;
  email: string | null;
};

function offeringScopeOf(offering: Awaited<ReturnType<typeof loadCourseOfferingScope>>): OfferingScope {
  return { id: offering.id, collegeId: offering.collegeId, organizationId: offering.organizationId };
}

/** Admin read: the offering's current coordinator (if any). */
export async function getOfferingCoordinator(
  context: RequestContext,
  offeringIdInput: string,
): Promise<OfferingCoordinatorView | null> {
  const offeringId = idSchema.parse(offeringIdInput);
  const offering = await loadCourseOfferingScope(offeringId);
  requirePermission(context, "courses.manage", {
    organizationId: offering.organizationId,
    collegeId: offering.collegeId,
  });
  const db = getDb();
  const [row] = await db
    .select({
      grantId: courseOfferingCoordinators.id,
      membershipId: courseOfferingCoordinators.membershipId,
      grantedAt: courseOfferingCoordinators.grantedAt,
      displayName: users.displayName,
      email: users.email,
    })
    .from(courseOfferingCoordinators)
    .innerJoin(collegeMemberships, eq(collegeMemberships.id, courseOfferingCoordinators.membershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .where(
      and(
        eq(courseOfferingCoordinators.offeringId, offering.id),
        eq(courseOfferingCoordinators.collegeId, offering.collegeId),
        isNull(courseOfferingCoordinators.revokedAt),
      ),
    )
    .limit(1);
  if (!row) return null;
  const facts = await loadCoordinatorFacts(db, {
    membershipId: row.membershipId,
    offeringId: offering.id,
    collegeId: offering.collegeId,
  });
  return {
    grantId: row.grantId,
    membershipId: row.membershipId,
    displayName: row.displayName ?? row.email ?? "",
    email: row.email ?? null,
    grantedAt: row.grantedAt.toISOString(),
    counts: coordinatorGrantCounts(facts),
  };
}

/** Admin read: the teachers who may be nominated, i.e. active faculty teaching a section of this offering. */
export async function listEligibleOfferingCoordinators(
  context: RequestContext,
  offeringIdInput: string,
): Promise<EligibleCoordinator[]> {
  const offeringId = idSchema.parse(offeringIdInput);
  const offering = await loadCourseOfferingScope(offeringId);
  requirePermission(context, "courses.manage", {
    organizationId: offering.organizationId,
    collegeId: offering.collegeId,
  });
  const rows = await getDb()
    .selectDistinct({
      membershipId: collegeMemberships.id,
      displayName: users.displayName,
      email: users.email,
    })
    .from(courseTeachingAssignments)
    .innerJoin(
      courseSectionDeliveries,
      and(
        eq(courseSectionDeliveries.id, courseTeachingAssignments.deliveryId),
        eq(courseSectionDeliveries.offeringId, offering.id),
        isNull(courseSectionDeliveries.endedAt),
      ),
    )
    .innerJoin(
      collegeMemberships,
      and(
        eq(collegeMemberships.id, courseTeachingAssignments.membershipId),
        eq(collegeMemberships.collegeId, offering.collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
      ),
    )
    .innerJoin(
      membershipRoles,
      and(eq(membershipRoles.membershipId, collegeMemberships.id), eq(membershipRoles.role, "FACULTY")),
    )
    .innerJoin(users, and(eq(users.id, collegeMemberships.userId), eq(users.platformStatus, "ACTIVE")))
    .where(isNull(courseTeachingAssignments.endedAt))
    .orderBy(asc(users.displayName), asc(collegeMemberships.id))
    .limit(200);
  return rows.map((row) => ({
    membershipId: row.membershipId,
    displayName: row.displayName ?? row.email ?? "",
    email: row.email ?? null,
  }));
}

function eventRow(
  coordinatorId: string,
  collegeId: string,
  action: CoordinatorEventAction,
  actorMembershipId: string | null,
) {
  return { coordinatorId, collegeId, action, actorMembershipId };
}

/**
 * Admin only. Nominates a teacher of this offering as its coordinator. One active coordinator per offering: a
 * second nomination is refused until the first is removed. Repeating the same nomination changes nothing.
 */
export async function grantOfferingCoordinator(
  context: RequestContext,
  offeringIdInput: string,
  membershipIdInput: string,
): Promise<OfferingCoordinatorView> {
  const offeringId = idSchema.parse(offeringIdInput);
  const membershipId = idSchema.parse(membershipIdInput);
  const offering = await loadCourseOfferingScope(offeringId);
  const scope = { organizationId: offering.organizationId, collegeId: offering.collegeId };
  requirePermission(context, "courses.manage", scope);

  let outcome: { grantId: string; created: boolean };
  try {
    outcome = await getDb().transaction(async (tx) => {
      await assertPersistedPlatformPermission(tx, context, "courses.manage", scope);

      // Serialises concurrent grants and revokes for one offering.
      const [live] = await tx
        .select({ id: courseOfferings.id, status: courseOfferings.status })
        .from(courseOfferings)
        .where(eq(courseOfferings.id, offering.id))
        .for("update")
        .limit(1);
      if (!live || live.status !== "ACTIVE") throw new CoursesServiceError("OFFERING_NOT_FOUND");

      const [current] = await tx
        .select({
          id: courseOfferingCoordinators.id,
          membershipId: courseOfferingCoordinators.membershipId,
        })
        .from(courseOfferingCoordinators)
        .where(
          and(
            eq(courseOfferingCoordinators.offeringId, offering.id),
            isNull(courseOfferingCoordinators.revokedAt),
          ),
        )
        .for("update")
        .limit(1);
      if (current && current.membershipId === membershipId) {
        return { grantId: current.id, created: false };
      }
      if (current) throw new CoursesServiceError("COORDINATOR_ALREADY_ASSIGNED");

      const facts = await loadCoordinatorFacts(
        tx,
        { membershipId, offeringId: offering.id, collegeId: offering.collegeId },
        true,
      );
      if (!isEligibleNominee(facts)) throw new CoursesServiceError("COORDINATOR_NOT_ELIGIBLE");

      const [earlier] = await tx
        .select({ id: courseOfferingCoordinators.id })
        .from(courseOfferingCoordinators)
        .where(
          and(
            eq(courseOfferingCoordinators.offeringId, offering.id),
            eq(courseOfferingCoordinators.membershipId, membershipId),
          ),
        )
        .limit(1);

      const [created] = await tx
        .insert(courseOfferingCoordinators)
        .values({
          offeringId: offering.id,
          collegeId: offering.collegeId,
          membershipId,
          grantedByMembershipId: context.membership?.id ?? null,
        })
        .returning({ id: courseOfferingCoordinators.id });
      if (!created) throw new CoursesServiceError("COORDINATOR_NOT_FOUND");

      await tx
        .insert(courseOfferingCoordinatorEvents)
        .values(
          eventRow(
            created.id,
            offering.collegeId,
            earlier ? "REGRANTED" : "GRANTED",
            context.membership?.id ?? null,
          ),
        );
      return { grantId: created.id, created: true };
    });
  } catch (error) {
    if (postgresConstraintName(error) === "course_offering_coordinators_active_uq") {
      throw new CoursesServiceError("COORDINATOR_ALREADY_ASSIGNED");
    }
    throw error;
  }

  if (outcome.created) {
    recordSecurityEvent({
      event: "course.coordinator_granted",
      outcome: "ok",
      userId: context.user.id,
      membershipId: context.membership?.id ?? null,
      collegeId: offering.collegeId,
      target: offering.id,
      detail: { grantId: outcome.grantId, nomineeMembershipId: membershipId },
    });
  }
  const view = await getOfferingCoordinator(context, offering.id);
  if (!view) throw new CoursesServiceError("COORDINATOR_NOT_FOUND");
  return view;
}

/** Admin only. Ends the offering's current coordinator grant. */
export async function revokeOfferingCoordinator(
  context: RequestContext,
  offeringIdInput: string,
): Promise<{ grantId: string }> {
  const offeringId = idSchema.parse(offeringIdInput);
  const offering = await loadCourseOfferingScope(offeringId, true);
  const scope = { organizationId: offering.organizationId, collegeId: offering.collegeId };
  requirePermission(context, "courses.manage", scope);

  const result = await getDb().transaction(async (tx) => {
    await assertPersistedPlatformPermission(tx, context, "courses.manage", scope);
    const [current] = await tx
      .select({
        id: courseOfferingCoordinators.id,
        membershipId: courseOfferingCoordinators.membershipId,
        version: courseOfferingCoordinators.version,
      })
      .from(courseOfferingCoordinators)
      .where(
        and(
          eq(courseOfferingCoordinators.offeringId, offering.id),
          eq(courseOfferingCoordinators.collegeId, offering.collegeId),
          isNull(courseOfferingCoordinators.revokedAt),
        ),
      )
      .for("update")
      .limit(1);
    if (!current) throw new CoursesServiceError("COORDINATOR_NOT_FOUND");
    const now = new Date();
    const updated = await tx
      .update(courseOfferingCoordinators)
      .set({
        revokedAt: now,
        revokedByMembershipId: context.membership?.id ?? null,
        version: sql`${courseOfferingCoordinators.version} + 1`,
        updatedAt: now,
      })
      .where(
        and(
          eq(courseOfferingCoordinators.id, current.id),
          eq(courseOfferingCoordinators.version, current.version),
          isNull(courseOfferingCoordinators.revokedAt),
        ),
      )
      .returning({ id: courseOfferingCoordinators.id });
    if (updated.length !== 1) throw new CoursesServiceError("COORDINATOR_STALE_VERSION");
    await tx
      .insert(courseOfferingCoordinatorEvents)
      .values(eventRow(current.id, offering.collegeId, "REVOKED", context.membership?.id ?? null));
    return { grantId: current.id, nomineeMembershipId: current.membershipId };
  });

  recordSecurityEvent({
    event: "course.coordinator_revoked",
    outcome: "ok",
    userId: context.user.id,
    membershipId: context.membership?.id ?? null,
    collegeId: offering.collegeId,
    target: offering.id,
    detail: { grantId: result.grantId, nomineeMembershipId: result.nomineeMembershipId },
  });
  return { grantId: result.grantId };
}

/** History of grants and removals for an offering, newest first (admin read). */
export async function listOfferingCoordinatorHistory(context: RequestContext, offeringIdInput: string) {
  const offeringId = idSchema.parse(offeringIdInput);
  const offering = await loadCourseOfferingScope(offeringId, true);
  requirePermission(context, "courses.manage", {
    organizationId: offering.organizationId,
    collegeId: offering.collegeId,
  });
  const rows = await getDb()
    .select({
      action: courseOfferingCoordinatorEvents.action,
      occurredAt: courseOfferingCoordinatorEvents.occurredAt,
      coordinatorName: users.displayName,
    })
    .from(courseOfferingCoordinatorEvents)
    .innerJoin(
      courseOfferingCoordinators,
      eq(courseOfferingCoordinators.id, courseOfferingCoordinatorEvents.coordinatorId),
    )
    .innerJoin(collegeMemberships, eq(collegeMemberships.id, courseOfferingCoordinators.membershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .where(
      and(
        eq(courseOfferingCoordinators.offeringId, offering.id),
        eq(courseOfferingCoordinators.collegeId, offering.collegeId),
      ),
    )
    .orderBy(desc(courseOfferingCoordinatorEvents.occurredAt), desc(courseOfferingCoordinatorEvents.id))
    .limit(100);
  return rows.map((row) => ({
    action: row.action,
    occurredAt: row.occurredAt.toISOString(),
    coordinatorName: row.coordinatorName,
  }));
}

export type CoordinatedOffering = { offeringId: string; courseName: string };

/** Faculty read: the offerings where the signed-in teacher is a counted coordinator. Own grants only. */
export async function listMyCoordinatedOfferings(
  context: RequestContext,
): Promise<CoordinatedOffering[]> {
  const membership = context.membership;
  if (!membership || membership.status !== "ACTIVE" || !membership.roles.includes(ROLE.FACULTY)) return [];
  const rows = await getDb()
    .select({
      offeringId: courseOfferings.id,
      courseName: courses.name,
    })
    .from(courseOfferingCoordinators)
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseOfferingCoordinators.offeringId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(
      and(
        eq(courseOfferingCoordinators.membershipId, membership.id),
        eq(courseOfferingCoordinators.collegeId, membership.collegeId),
        isNull(courseOfferingCoordinators.revokedAt),
        eq(courseOfferings.status, "ACTIVE"),
        sql`exists (
          select 1 from ${courseTeachingAssignments}
          join ${courseSectionDeliveries}
            on ${courseSectionDeliveries.id} = ${courseTeachingAssignments.deliveryId}
          where ${courseTeachingAssignments.membershipId} = ${membership.id}
            and ${courseSectionDeliveries.offeringId} = ${courseOfferings.id}
            and ${courseTeachingAssignments.endedAt} is null
            and ${courseSectionDeliveries.endedAt} is null
        )`,
      ),
    )
    .orderBy(asc(courses.name), asc(courseOfferings.id))
    .limit(200);
  return rows;
}

export { offeringScopeOf };
