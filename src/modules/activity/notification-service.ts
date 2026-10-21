import "server-only";

import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  or,
} from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  activityEvents,
  academicPeriods,
  courses,
  courseOfferings,
  courseSectionDeliveries,
  courseTeachingAssignments,
  departments,
  collegeMemberships,
  colleges,
  inAppNotifications,
  placementCompanyRelationships,
  placementRecruiterCollegeGrants,
  placementRecruiterProfiles,
  sections,
  sectionFacultyAssignments,
  systemRoles,
  users,
} from "@/db/schema";
import {
  hasMembershipRole,
  isSuperAdmin,
  type RequestContext,
} from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { ActivityServiceError } from "./errors";
import { safeNotificationActionHref } from "./notification-action";

type NotificationWriter = Pick<
  ReturnType<typeof getDb>,
  "select" | "insert"
>;

const deliverySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1)
      .max(240),
    body: z
      .string()
      .trim()
      .min(1)
      .max(2000),
    actionHref: z
      .string()
      .trim()
      .startsWith("/")
      .max(1000)
      .refine(
        (href) => safeNotificationActionHref(href) === href,
        "Notification actionHref must be an internal path",
      )
      .nullable()
      .optional(),
  })
  .strict();


/**
 * The legacy announcement composer is a staff-only operation. This input is
 * deliberately distinct from the small, plain-text per-recipient delivery
 * payload: the latter must never become a public notification creation API.
 * Rich HTML is not forwarded to inbox rows until a dedicated sanitizer and
 * authored-notice store are available.
 */
export const staffNotificationDraftSchema = z.object({
  title: z.string().trim().min(1).max(200),
  htmlContent: z.string().trim().min(1).max(50_000),
  classId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  assessmentUrl: z.string().trim().url()
    .refine((value) => {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    }, "Assessment URL must use http or https")
    .optional(),
}).strict().refine(
  (input) => Boolean(input.classId) !== Boolean(input.courseId),
  { message: "classId or courseId required", path: ["classId"] },
);

export type StaffNotificationDraft = z.input<typeof staffNotificationDraftSchema>;

type StaffNotificationAudience = {
  collegeId: string;
  organizationId: string;
  classId: string | null;
  courseId: string | null;
};

/**
 * Resolve the audience from persisted academic records, NOT request-supplied
 * tenant identifiers. Faculty need a live assignment to the section/course;
 * college admins and superadmins need their central scoped permission.
 */
export async function requireStaffNotificationAudience(
  context: RequestContext,
  rawDraft: unknown,
): Promise<{ draft: z.output<typeof staffNotificationDraftSchema>; audience: StaffNotificationAudience }> {
  const draft = staffNotificationDraftSchema.parse(rawDraft);
  if (context.user.platformStatus !== "ACTIVE" ||
      (!isSuperAdmin(context) &&
       !hasMembershipRole(context, "COLLEGE_ADMIN") &&
       !hasMembershipRole(context, "FACULTY"))) {
    throw new ActivityServiceError("NOTIFICATION_SCOPE_MISMATCH");
  }

  const db = getDb();
  const [scope] = draft.classId
    ? await db.select({
        collegeId: colleges.id,
        organizationId: colleges.organizationId,
      }).from(sections)
        .innerJoin(academicPeriods, eq(academicPeriods.id, sections.academicPeriodId))
        .innerJoin(colleges, eq(colleges.id, academicPeriods.collegeId))
        .where(and(
          eq(sections.id, draft.classId),
          eq(sections.status, "ACTIVE"),
          eq(colleges.status, "ACTIVE"),
        )).limit(1)
    : await db.select({
        collegeId: colleges.id,
        organizationId: colleges.organizationId,
      }).from(courses)
        .innerJoin(departments, eq(departments.id, courses.departmentId))
        .innerJoin(colleges, eq(colleges.id, departments.collegeId))
        .where(and(
          eq(courses.id, draft.courseId!),
          eq(courses.status, "ACTIVE"),
          eq(colleges.status, "ACTIVE"),
        )).limit(1);

  if (!scope) throw new ActivityServiceError("ACTIVITY_SCOPE_NOT_FOUND");
  const audience: StaffNotificationAudience = {
    ...scope,
    classId: draft.classId ?? null,
    courseId: draft.courseId ?? null,
  };
  if (isSuperAdmin(context) || hasMembershipRole(context, "COLLEGE_ADMIN")) {
    requirePermission(context, "courses.manage", scope);
    return { draft, audience };
  }

  // A generic faculty role in the college is not permission to post into
  // every class/course. Verify a current assignment for this exact audience.
  requirePermission(context, "courses.read", scope);
  if (!context.membership ||
      context.membership.collegeId !== scope.collegeId) {
    throw new ActivityServiceError("NOTIFICATION_SCOPE_MISMATCH");
  }
  const [assigned] = draft.classId
    ? await db.select({ id: sectionFacultyAssignments.id })
        .from(sectionFacultyAssignments)
        .where(and(
          eq(sectionFacultyAssignments.sectionId, draft.classId),
          eq(sectionFacultyAssignments.membershipId, context.membership.id),
          isNull(sectionFacultyAssignments.endedAt),
        )).limit(1)
    : await db.select({ id: courseTeachingAssignments.id })
        .from(courseTeachingAssignments)
        .innerJoin(courseSectionDeliveries,
          eq(courseSectionDeliveries.id, courseTeachingAssignments.deliveryId))
        .innerJoin(courseOfferings,
          eq(courseOfferings.id, courseSectionDeliveries.offeringId))
        .where(and(
          eq(courseOfferings.courseId, draft.courseId!),
          eq(courseTeachingAssignments.membershipId, context.membership.id),
          isNull(courseTeachingAssignments.endedAt),
          isNull(courseSectionDeliveries.endedAt),
        )).limit(1);
  if (!assigned) throw new ActivityServiceError("NOTIFICATION_SCOPE_MISMATCH");
  return { draft, audience };
}

/**
 * Mandatory preflight for edit/recall: inspect the original persisted scope
 * before checking the requested destination; author ownership applies to
 * faculty while authorized admins may manage their own scoped notices.
 * Caller must still perform its edit/delete and commit atomically.
 */
export async function requireStaffNotificationRetarget(
  context: RequestContext,
  eventIdInput: unknown,
  nextDraft: unknown,
): Promise<StaffNotificationAudience> {
  const eventId = z.string().uuid().parse(eventIdInput);
  const [existing] = await getDb().select({
    actorUserId: activityEvents.actorUserId,
    organizationId: activityEvents.organizationId,
    collegeId: activityEvents.collegeId,
    subjectType: activityEvents.subjectType,
    metadata: activityEvents.metadata,
  }).from(activityEvents).where(eq(activityEvents.id, eventId)).limit(1);
  if (!existing || existing.subjectType !== "NOTIFICATION" ||
      !existing.collegeId || !existing.organizationId) {
    throw new ActivityServiceError("NOTIFICATION_NOT_FOUND");
  }
  const isAdmin = isSuperAdmin(context) || hasMembershipRole(context, "COLLEGE_ADMIN");
  if (!isAdmin && existing.actorUserId !== context.user.id) {
    throw new ActivityServiceError("NOTIFICATION_SCOPE_MISMATCH");
  }
  if (isAdmin) {
    requirePermission(context, "courses.manage", {
      collegeId: existing.collegeId,
      organizationId: existing.organizationId,
    });
  } else {
    const previous = staffNotificationDraftSchema.safeParse({
      title: "Existing notification",
      htmlContent: "Existing notification",
      classId: existing.metadata.classId,
      courseId: existing.metadata.courseId,
    });
    if (!previous.success) throw new ActivityServiceError("NOTIFICATION_SCOPE_MISMATCH");
    await requireStaffNotificationAudience(context, previous.data);
  }
  const { audience } = await requireStaffNotificationAudience(context, nextDraft);
  return audience;
}

export type InAppNotificationDeliveryInput =
  z.input<typeof deliverySchema>;

/**
 * A producer can request a recipient ID, but that alone is not authority to
 * send a tenant-scoped event. Check the persisted, current recipient grants.
 * A single ineligible active recipient rejects the whole batch without writes.
 * Global events (no organization/college) are intentionally unrestricted.
 */
async function assertScopedNotificationRecipients(
  db: NotificationWriter,
  event: { collegeId: string | null; organizationId: string | null },
  activeUserIds: readonly string[],
) {
  if (activeUserIds.length === 0 ||
      (!event.collegeId && !event.organizationId)) return;

  const targetCollege = event.collegeId;
  const targetOrganization = event.organizationId;
  const scopeCondition = targetCollege
    ? eq(colleges.id, targetCollege)
    : eq(colleges.organizationId, targetOrganization!);
  const relationshipScope = targetCollege
    ? eq(placementCompanyRelationships.collegeId, targetCollege)
    : eq(colleges.organizationId, targetOrganization!);

  const [memberships, recruiterGrants, administrators] = await Promise.all([
    db.select({ userId: collegeMemberships.userId })
      .from(collegeMemberships)
      .innerJoin(colleges, eq(colleges.id, collegeMemberships.collegeId))
      .where(and(
        inArray(collegeMemberships.userId, [...activeUserIds]),
        eq(collegeMemberships.status, "ACTIVE"),
        eq(colleges.status, "ACTIVE"),
        scopeCondition,
      )),
    db.select({ userId: placementRecruiterCollegeGrants.recruiterUserId })
      .from(placementRecruiterCollegeGrants)
      .innerJoin(
        placementRecruiterProfiles,
        eq(placementRecruiterProfiles.userId, placementRecruiterCollegeGrants.recruiterUserId),
      )
      .innerJoin(
        placementCompanyRelationships,
        eq(placementCompanyRelationships.id, placementRecruiterCollegeGrants.companyRelationshipId),
      )
      .innerJoin(colleges, eq(colleges.id, placementCompanyRelationships.collegeId))
      .where(and(
        inArray(placementRecruiterCollegeGrants.recruiterUserId, [...activeUserIds]),
        eq(placementRecruiterCollegeGrants.status, "ACTIVE"),
        eq(placementRecruiterProfiles.status, "ACTIVE"),
        eq(placementCompanyRelationships.status, "ACTIVE"),
        eq(colleges.status, "ACTIVE"),
        relationshipScope,
      )),
    db.select({ userId: systemRoles.userId })
      .from(systemRoles)
      .where(and(
        inArray(systemRoles.userId, [...activeUserIds]),
        eq(systemRoles.role, "SUPER_ADMIN"),
      )),
  ]);

  const eligible = new Set([
    ...memberships.map((row) => row.userId),
    ...recruiterGrants.map((row) => row.userId),
    ...administrators.map((row) => row.userId),
  ]);
  if (activeUserIds.some((id) => !eligible.has(id))) {
    throw new ActivityServiceError("NOTIFICATION_SCOPE_MISMATCH");
  }
}

function sanitizeNotificationRow<T extends { actionHref: string | null }>(row: T) {
  return {
    ...row,
    actionHref: safeNotificationActionHref(row.actionHref),
  };
}

async function writeInAppNotification(
  db: NotificationWriter,
  eventId: string,
  userIdsInput: readonly string[],
  rawInput: InAppNotificationDeliveryInput,
) {
  const parsedEventId = z
    .string()
    .uuid()
    .parse(eventId);
  const userIds = [
    ...new Set(
      userIdsInput.map((id) =>
        z.string().uuid().parse(id),
      ),
    ),
  ];
  const input =
    deliverySchema.parse(rawInput);

  if (userIds.length === 0) {
    return {
      delivered: 0,
      skippedInactive: 0,
      skippedDuplicate: 0,
    };
  }

  const [[event], recipients] =
    await Promise.all([
      db
        .select({
          id: activityEvents.id,
          collegeId: activityEvents.collegeId,
          organizationId: activityEvents.organizationId,
        })
        .from(activityEvents)
        .where(
          eq(
            activityEvents.id,
            parsedEventId,
          ),
        )
        .limit(1),
      db
        .select({
          id: users.id,
          platformStatus:
            users.platformStatus,
        })
        .from(users)
        .where(
          inArray(users.id, userIds),
        ),
    ]);

  if (!event) {
    throw new ActivityServiceError(
      "ACTIVITY_EVENT_NOT_FOUND",
    );
  }
  if (recipients.length !== userIds.length) {
    throw new ActivityServiceError(
      "NOTIFICATION_RECIPIENT_NOT_FOUND",
    );
  }

  const active = recipients
    .filter(
      (user) =>
        user.platformStatus === "ACTIVE",
    )
    .map((user) => user.id);

  // Re-check persisted scopes in the same transaction when called from a
  // transactional domain producer. Never assume caller-selected IDs are safe.
  await assertScopedNotificationRecipients(db, event, active);

  let delivered = 0;
  if (active.length > 0) {
    const inserted = await db
      .insert(inAppNotifications)
      .values(
        active.map((userId) => ({
          userId,
          eventId: parsedEventId,
          title: input.title,
          body: input.body,
          actionHref:
            input.actionHref ?? null,
        })),
      )
      .onConflictDoNothing()
      .returning({ id: inAppNotifications.id });
    delivered = inserted.length;
  }

  return {
    delivered,
    skippedInactive:
      recipients.length -
      active.length,
    skippedDuplicate: active.length - delivered,
  };
}

export async function deliverInAppNotification(
  eventId: string,
  userIdsInput: readonly string[],
  rawInput: InAppNotificationDeliveryInput,
) {
  return writeInAppNotification(
    getDb(),
    eventId,
    userIdsInput,
    rawInput,
  );
}

export async function deliverInAppNotificationInTransaction(
  tx: NotificationWriter,
  eventId: string,
  userIdsInput: readonly string[],
  rawInput: InAppNotificationDeliveryInput,
) {
  return writeInAppNotification(
    tx,
    eventId,
    userIdsInput,
    rawInput,
  );
}


/**
 * The legacy fetchAll route listed authored notices, not every recipient's
 * read receipt. Keep this supervisory query separate from the personal inbox.
 * A global page is permitted only for an active global Super Admin. Selected
 * organization/college scope is always applied before paging and counting.
 */
export async function listScopedAdminNotificationPage(
  context: RequestContext,
  rawOptions: {
    organizationId?: string;
    collegeId?: string;
    pageNo?: number;
    pageSize?: number;
  } = {},
) {
  if (!isSuperAdmin(context)) {
    throw new ActivityServiceError("NOTIFICATION_SCOPE_MISMATCH");
  }
  const options = z.object({
    organizationId: z.string().uuid().optional(),
    collegeId: z.string().uuid().optional(),
    pageNo: z.number().int().min(0).default(0),
    pageSize: z.number().int().min(1).max(200).default(50),
  }).strict().parse(rawOptions);

  const collegeId = options.collegeId ?? context.adminScope?.collegeId ?? null;
  let organizationId = options.organizationId ??
    context.adminScope?.organizationId ?? null;
  if (collegeId) {
    const [college] = await getDb().select({
      id: colleges.id,
      organizationId: colleges.organizationId,
    }).from(colleges).where(eq(colleges.id, collegeId)).limit(1);
    if (!college || (organizationId && college.organizationId !== organizationId)) {
      throw new ActivityServiceError("ACTIVITY_SCOPE_NOT_FOUND");
    }
    organizationId = college.organizationId;
  }
  requirePermission(context, "activity.read", { organizationId, collegeId });

  const conditions = [eq(activityEvents.subjectType, "NOTIFICATION")];
  if (collegeId) conditions.push(eq(activityEvents.collegeId, collegeId));
  else if (organizationId) {
    conditions.push(eq(activityEvents.organizationId, organizationId));
  }
  const where = and(...conditions);
  const db = getDb();
  const [[totalRow], items] = await Promise.all([
    db.select({ total: count() }).from(activityEvents).where(where),
    db.select({
      id: activityEvents.id,
      actorUserId: activityEvents.actorUserId,
      collegeId: activityEvents.collegeId,
      organizationId: activityEvents.organizationId,
      subjectId: activityEvents.subjectId,
      subjectLabel: activityEvents.subjectLabel,
      summary: activityEvents.summary,
      metadata: activityEvents.metadata,
      occurredAt: activityEvents.occurredAt,
    }).from(activityEvents).where(where)
      .orderBy(desc(activityEvents.occurredAt), desc(activityEvents.id))
      .limit(options.pageSize).offset(options.pageNo * options.pageSize),
  ]);
  return {
    items,
    pagination: {
      pageNo: options.pageNo,
      pageSize: options.pageSize,
      total: totalRow?.total ?? 0,
    },
  };
}

export async function listOwnNotifications(
  context: RequestContext,
  options: {
    unreadOnly?: boolean;
    unreadSince?: Date;
    limit?: number;
    collegeId?: string;
  } = {},
) {
  const limit = z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(40)
    .parse(options.limit);
  const conditions = [
    eq(inAppNotifications.userId, context.user.id),
  ];
  if (options.collegeId) {
    conditions.push(eq(activityEvents.collegeId, z.string().uuid().parse(options.collegeId)));
  }
  if (options.unreadOnly) {
    conditions.push(
      isNull(
        inAppNotifications.readAt,
      ),
    );
  }

  const rows = await getDb()
    .select({
      notification:
        inAppNotifications,
      event: {
        id: activityEvents.id,
        module: activityEvents.module,
        eventType:
          activityEvents.eventType,
        importance:
          activityEvents.importance,
        occurredAt:
          activityEvents.occurredAt,
      },
    })
    .from(inAppNotifications)
    .innerJoin(
      activityEvents,
      eq(
        activityEvents.id,
        inAppNotifications.eventId,
      ),
    )
    .where(and(...conditions))
    .orderBy(
      desc(
        inAppNotifications.createdAt,
      ),
      desc(inAppNotifications.id),
    )
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    notification: sanitizeNotificationRow(row.notification),
  }));
}

export async function countOwnUnreadNotifications(
  context: RequestContext,
  options: { collegeId?: string } = {},
) {
  const collegeId = options.collegeId
    ? z.string().uuid().parse(options.collegeId)
    : null;
  const db = getDb();
  const [row] = collegeId
    ? await db.select({ total: count() }).from(inAppNotifications)
        .innerJoin(activityEvents, eq(activityEvents.id, inAppNotifications.eventId))
        .where(and(
          eq(inAppNotifications.userId, context.user.id),
          isNull(inAppNotifications.readAt),
          eq(activityEvents.collegeId, collegeId),
        ))
    : await db.select({ total: count() }).from(inAppNotifications)
        .where(and(
          eq(inAppNotifications.userId, context.user.id),
          isNull(inAppNotifications.readAt),
        ));
  return row?.total ?? 0;
}

export async function markOwnNotificationRead(
  context: RequestContext,
  notificationIdInput: string,
) {
  const notificationId = z
    .string()
    .uuid()
    .parse(notificationIdInput);

  const [current] = await getDb()
    .select()
    .from(inAppNotifications)
    .where(
      and(
        eq(
          inAppNotifications.id,
          notificationId,
        ),
        eq(
          inAppNotifications.userId,
          context.user.id,
        ),
      ),
    )
    .limit(1);

  if (!current) {
    throw new ActivityServiceError(
      "NOTIFICATION_NOT_FOUND",
    );
  }
  if (current.readAt) {
    return sanitizeNotificationRow(current);
  }

  const [updated] = await getDb()
    .update(inAppNotifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(
          inAppNotifications.id,
          current.id,
        ),
        eq(
          inAppNotifications.userId,
          context.user.id,
        ),
        isNull(
          inAppNotifications.readAt,
        ),
      ),
    )
    .returning();

  if (updated) {
    return sanitizeNotificationRow(updated);
  }

  // Concurrent readers can observe unread before another request wins
  // the conditional update. Return the committed row, not stale readAt=null.
  const [latest] = await getDb()
    .select()
    .from(inAppNotifications)
    .where(
      and(
        eq(inAppNotifications.id, notificationId),
        eq(inAppNotifications.userId, context.user.id),
      ),
    )
    .limit(1);
  if (!latest) {
    throw new ActivityServiceError("NOTIFICATION_NOT_FOUND");
  }
  return sanitizeNotificationRow(latest);
}

/**
 * Atomically acknowledge the entire unread inbox, including notifications
 * beyond the first page of the UI. Never accept a client-supplied recipient ID.
 * Concurrent calls are idempotent: each row is acknowledged at most once.
 */
export async function markAllOwnNotificationsRead(
  context: RequestContext,
  options: { collegeId?: string } = {},
) {
  const ownCollege = options.collegeId
    ? z.string().uuid().parse(options.collegeId)
    : null;
  const rows = await getDb()
    .update(inAppNotifications)
    .set({ readAt: new Date() })
    .where(and(
      eq(inAppNotifications.userId, context.user.id),
      isNull(inAppNotifications.readAt),
      ...(ownCollege ? [
        inArray(inAppNotifications.eventId,
          getDb().select({ id: activityEvents.id }).from(activityEvents)
            .where(eq(activityEvents.collegeId, ownCollege))),
      ] : []),
    ))
    .returning({ id: inAppNotifications.id });

  return rows.length;
}

/**
 * Stable keyset pagination for the shared inbox. Always scopes to the
 * authenticated recipient; an optional cursor never changes ownership.
 * Existing listOwnNotifications() remains unchanged for its other consumers.
 */
export async function listOwnNotificationPage(
  context: RequestContext,
  options: {
    unreadOnly?: boolean;
    limit?: number;
    beforeCreatedAt?: Date;
    unreadSince?: Date;
    beforeId?: string;
    collegeId?: string;
  } = {},
) {
  const limit = z.number().int().min(1).max(100)
    .parse(options.limit ?? 50);
  if (Boolean(options.beforeCreatedAt) !== Boolean(options.beforeId)) {
    throw new Error("NOTIFICATION_CURSOR_INVALID");
  }
  const conditions = [eq(inAppNotifications.userId, context.user.id)];
  if (options.collegeId) conditions.push(eq(activityEvents.collegeId, z.string().uuid().parse(options.collegeId)));
  if (options.unreadOnly) {
    conditions.push(isNull(inAppNotifications.readAt));
    if(options.unreadSince)conditions.push(gte(inAppNotifications.createdAt,options.unreadSince));
  }
  if (options.beforeCreatedAt && options.beforeId) {
    const at = z.date().parse(options.beforeCreatedAt);
    const id = z.string().uuid().parse(options.beforeId);
    conditions.push(or(
      lt(inAppNotifications.createdAt, at),
      and(
        eq(inAppNotifications.createdAt, at),
        lt(inAppNotifications.id, id),
      ),
    )!);
  }

  const result = await getDb()
    .select({
      notification: inAppNotifications,
      event: {
        id: activityEvents.id,
        module: activityEvents.module,
        eventType: activityEvents.eventType,
        importance: activityEvents.importance,
        occurredAt: activityEvents.occurredAt,
      },
    })
    .from(inAppNotifications)
    .innerJoin(activityEvents, eq(activityEvents.id, inAppNotifications.eventId))
    .where(and(...conditions))
    .orderBy(desc(inAppNotifications.createdAt), desc(inAppNotifications.id))
    .limit(limit + 1);

  const hasMore = result.length > limit;
  const rows = result.slice(0, limit);
  const last = rows[rows.length - 1];
  return {
    items: rows.map((row) => ({
      ...row,
      notification: sanitizeNotificationRow(row.notification),
    })),
    nextCursor: hasMore && last
      ? {
          beforeCreatedAt: last.notification.createdAt,
          beforeId: last.notification.id,
        }
      : null,
  };
}
