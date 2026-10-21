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
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  activityEvents,
  academicPeriods,
  learnerProgramEnrollments,
  sectionEnrollments,
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
import { sanitizeActivityMetadata } from "./metadata-sanitizer";
import { safeNotificationActionHref } from "./notification-action";
import { ACTIVITY_IMPORTANCE, ACTIVITY_MODULES } from "./taxonomy";

type NotificationWriter = Pick<
  ReturnType<typeof getDb>,
  "select" | "insert"
>;

/**
 * A scheduled authored notice must not appear in any recipient's inbox until
 * a trusted release worker commits delivery. A recall must not be visible.
 * This only guards event-backed receipts; campaign scheduling and recall
 * persistence require the separate authored-notice schema.
 */
const releasedNotificationEvent = sql<boolean>`
  coalesce(${activityEvents.metadata} ->> 'deliveryStatus', 'SENT') = 'SENT'
  and ${activityEvents.metadata} ->> 'deletedAt' is null
`;

/**
 * Old LMS accepts a local "yyyy-MM-dd HH:mm:ss" time; the vNext product
 * contract uses IST for that form. Also accept offset-aware ISO timestamps.
 * Invalid or rolled-over calendar dates fail closed instead of sending now.
 */
export function parseStaffNotificationSchedule(raw: string | null | undefined): Date | null {
  if (raw == null || raw.trim() === "") return null;
  const value = raw.trim();
  const legacy = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);
  if (legacy) {
    const [, yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw, secondRaw] = legacy;
    const [year, month, day, hour, minute, second] = [
      yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw, secondRaw,
    ].map(Number);
    const localAsUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    if (localAsUtc.getUTCFullYear() !== year ||
        localAsUtc.getUTCMonth() + 1 !== month ||
        localAsUtc.getUTCDate() !== day ||
        localAsUtc.getUTCHours() !== hour ||
        localAsUtc.getUTCMinutes() !== minute ||
        localAsUtc.getUTCSeconds() !== second) {
      throw new Error("scheduledAt must be yyyy-MM-dd HH:mm:ss");
    }
    return new Date(localAsUtc.getTime() - 330 * 60_000);
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    throw new Error("scheduledAt must be yyyy-MM-dd HH:mm:ss");
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("scheduledAt must be yyyy-MM-dd HH:mm:ss");
  }
  return date;
}

function validStaffNotificationSchedule(value: string): boolean {
  try {
    return parseStaffNotificationSchedule(value) !== null;
  } catch {
    return false;
  }
}

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
  scheduledAt: z.string().trim().min(1).max(40)
    .refine(validStaffNotificationSchedule, "scheduledAt must be yyyy-MM-dd HH:mm:ss")
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
  // Verify the schedule even for draft-only validation. A release worker is
  // still required; these helpers never dispatch a future notice immediately.
  if (draft.scheduledAt) parseStaffNotificationSchedule(draft.scheduledAt);
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
 * A legacy class notification is a broadcast, but delivery is a separate,
 * deduplicated row for each currently enrolled learner in vNext. The course
 * path resolves through active deliveries/sections. Neither path accepts a
 * client-supplied list of users or trusts membership IDs from the browser.
 */
export async function resolveStaffNotificationRecipients(
  context: RequestContext,
  rawDraft: unknown,
) {
  const { draft, audience } = await requireStaffNotificationAudience(context, rawDraft);
  const db = getDb();
  const courseSection = draft.courseId
    ? await db.select({ sectionId: courseSectionDeliveries.sectionId })
        .from(courseSectionDeliveries)
        .innerJoin(courseOfferings,
          eq(courseOfferings.id, courseSectionDeliveries.offeringId))
        .where(and(
          eq(courseOfferings.courseId, draft.courseId),
          eq(courseOfferings.status, "ACTIVE"),
          isNull(courseSectionDeliveries.endedAt),
        ))
    : null;
  const sectionIds = draft.classId
    ? [draft.classId]
    : [...new Set((courseSection ?? []).map((row) => row.sectionId))];
  if (sectionIds.length === 0) return { audience, userIds: [] as string[] };

  const recipients = await db.selectDistinct({ userId: collegeMemberships.userId })
    .from(sectionEnrollments)
    .innerJoin(learnerProgramEnrollments,
      eq(learnerProgramEnrollments.id, sectionEnrollments.learnerEnrollmentId))
    .innerJoin(collegeMemberships,
      eq(collegeMemberships.id, learnerProgramEnrollments.membershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .where(and(
      inArray(sectionEnrollments.sectionId, sectionIds),
      eq(sectionEnrollments.status, "ACTIVE"),
      eq(learnerProgramEnrollments.status, "ACTIVE"),
      eq(collegeMemberships.status, "ACTIVE"),
      eq(collegeMemberships.collegeId, audience.collegeId),
      eq(users.platformStatus, "ACTIVE"),
    ));
  return { audience, userIds: recipients.map((row) => row.userId) };
}

/**
 * Validate an authored notice's ORIGINAL persisted audience before a staff
 * mutation. Faculty may touch only notices they created while still assigned
 * to that original class/course; administrators must pass central scope checks.
 * This is a preflight, not a replacement for checking again inside the write
 * transaction once the authored-notice table is available.
 */
export async function requireStaffNotificationMutation(
  context: RequestContext,
  eventIdInput: unknown,
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
      !existing.collegeId || !existing.organizationId ||
      existing.metadata.deletedAt != null) {
    throw new ActivityServiceError("NOTIFICATION_NOT_FOUND");
  }
  const isAdmin = isSuperAdmin(context) || hasMembershipRole(context, "COLLEGE_ADMIN");
  if (!isAdmin && existing.actorUserId !== context.user.id) {
    throw new ActivityServiceError("NOTIFICATION_SCOPE_MISMATCH");
  }
  const audience: StaffNotificationAudience = {
    organizationId: existing.organizationId,
    collegeId: existing.collegeId,
    classId: typeof existing.metadata.classId === "string"
      ? existing.metadata.classId : null,
    courseId: typeof existing.metadata.courseId === "string"
      ? existing.metadata.courseId : null,
  };
  if (isAdmin) {
    requirePermission(context, "courses.manage", {
      collegeId: existing.collegeId,
      organizationId: existing.organizationId,
    });
  } else {
    // Treat missing/invalid legacy audience metadata as a denial, not as
    // permission to fall back to an arbitrary current faculty membership.
    const previous = staffNotificationDraftSchema.safeParse({
      title: "Existing notification",
      htmlContent: "Existing notification",
      classId: audience.classId ?? undefined,
      courseId: audience.courseId ?? undefined,
    });
    if (!previous.success) {
      throw new ActivityServiceError("NOTIFICATION_SCOPE_MISMATCH");
    }
    await requireStaffNotificationAudience(context, previous.data);
  }
  return audience;
}

/**
 * Editing a notice to a different audience requires BOTH the original-scope
 * mutation preflight and a second authorization for the requested audience.
 * The API/campaign mutation must repeat the checks atomically before writing.
 */
export async function requireStaffNotificationRetarget(
  context: RequestContext,
  eventIdInput: unknown,
  nextDraft: unknown,
): Promise<StaffNotificationAudience> {
  await requireStaffNotificationMutation(context, eventIdInput);
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

/**
 * Course/class filters use producer-authored, server-persisted activity
 * metadata. They never broaden the personal recipient scope.
 */
function appendNotificationContextFilters(
  conditions: ReturnType<typeof eq>[],
  options: { classId?: string; courseId?: string },
) {
  if (options.classId) {
    const classId = z.string().uuid().parse(options.classId);
    conditions.push(eq(sql<string>`${activityEvents.metadata} ->> 'classId'`, classId));
  }
  if (options.courseId) {
    const courseId = z.string().uuid().parse(options.courseId);
    conditions.push(eq(sql<string>`${activityEvents.metadata} ->> 'courseId'`, courseId));
  }
}

/**
 * Optional legacy category tabs are always ADDITIONAL filters on a personal
 * recipient query; callers cannot turn a category into a cross-user feed.
 * Category strings are bounded and known module/importance values validated.
 */
function appendNotificationCategoryFilters(
  conditions: ReturnType<typeof eq>[],
  options: {
    module?: string;
    eventType?: string;
    importance?: string;
    notificationType?: string;
  },
) {
  if (options.module) {
    conditions.push(eq(activityEvents.module, z.enum(ACTIVITY_MODULES).parse(options.module)));
  }
  if (options.importance) {
    conditions.push(eq(activityEvents.importance, z.enum(ACTIVITY_IMPORTANCE).parse(options.importance)));
  }
  if (options.eventType) {
    conditions.push(eq(activityEvents.eventType, z.string().trim().min(1).max(120).parse(options.eventType)));
  }
  if (options.notificationType) {
    const notificationType = z.string().trim().min(1).max(120).parse(options.notificationType);
    conditions.push(eq(sql<string>`${activityEvents.metadata} ->> 'notificationType'`, notificationType));
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
    // Legacy clamps the requested size to [1, 200] instead of failing.
    pageSize: z.number().int().transform((size) => Math.min(200, Math.max(1, size))).default(50),
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
    items: items.map((item) => ({
      ...item,
      metadata: sanitizeActivityMetadata(item.metadata),
    })),
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
    classId?: string;
    courseId?: string;
    module?: string;
    eventType?: string;
    importance?: string;
    notificationType?: string;
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
    releasedNotificationEvent,
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
    if (options.unreadSince) {
      conditions.push(gte(inAppNotifications.createdAt, z.date().parse(options.unreadSince)));
    }
  }

  appendNotificationContextFilters(conditions, options);
  appendNotificationCategoryFilters(conditions, options);

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
          releasedNotificationEvent,
        ))
    : await db.select({ total: count() }).from(inAppNotifications)
        .innerJoin(activityEvents, eq(activityEvents.id, inAppNotifications.eventId))
        .where(and(
          eq(inAppNotifications.userId, context.user.id),
          isNull(inAppNotifications.readAt),
          releasedNotificationEvent,
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
  // Keep acknowledgements consistent with the live inbox visibility policy.
  const releasedEventIds = getDb().select({ id: activityEvents.id })
    .from(activityEvents).where(releasedNotificationEvent);

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
        inArray(inAppNotifications.eventId, releasedEventIds),
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
        inArray(inAppNotifications.eventId, releasedEventIds),
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
        inArray(inAppNotifications.eventId, releasedEventIds),
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
            .where(and(eq(activityEvents.collegeId, ownCollege), releasedNotificationEvent))),
      ] : [
        inArray(inAppNotifications.eventId,
          getDb().select({ id: activityEvents.id }).from(activityEvents)
            .where(releasedNotificationEvent)),
      ]),
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
    classId?: string;
    courseId?: string;
    module?: string;
    eventType?: string;
    importance?: string;
    notificationType?: string;
  } = {},
) {
  const limit = z.number().int().min(1).max(100)
    .parse(options.limit ?? 50);
  if (Boolean(options.beforeCreatedAt) !== Boolean(options.beforeId)) {
    throw new Error("NOTIFICATION_CURSOR_INVALID");
  }
  const conditions = [
    eq(inAppNotifications.userId, context.user.id),
    releasedNotificationEvent,
  ];
  if (options.collegeId) conditions.push(eq(activityEvents.collegeId, z.string().uuid().parse(options.collegeId)));
  if (options.unreadOnly) {
    conditions.push(isNull(inAppNotifications.readAt));
    if (options.unreadSince) {
      conditions.push(gte(inAppNotifications.createdAt, z.date().parse(options.unreadSince)));
    }
  }
  appendNotificationContextFilters(conditions, options);
  appendNotificationCategoryFilters(conditions, options);
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
