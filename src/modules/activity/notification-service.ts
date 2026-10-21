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
  lte,
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
import { safeExternalAssessmentUrl, safeNotificationActionHref } from "./notification-action";
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
  and (
    ${activityEvents.metadata} ->> 'scheduledAt' is null
    or ${activityEvents.metadata} ->> 'deliveryStatus' = 'SENT'
  )
  and ${activityEvents.metadata} ->> 'deletedAt' is null
`;

/**
 * A due date alone is not proof of release. A scheduled recipient row must
 * be explicitly delivered before it can appear in an inbox or be marked read.
 * Immediate event-backed receipts have null deliveryStatus/scheduledAt.
 */
const releasedNotificationReceipt = sql<boolean>`
  ${inAppNotifications.deletedAt} is null
  and coalesce(${inAppNotifications.deliveryStatus}, 'SENT') = 'SENT'
  and (
    ${inAppNotifications.scheduledAt} is null
    or (
      ${inAppNotifications.deliveryStatus} = 'SENT'
      and ${inAppNotifications.deliveredAt} is not null
    )
  )
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
  // Date.parse normalizes some impossible calendar dates instead of rejecting
  // them (for example February 30). Validate the entered wall-clock fields
  // before applying its explicit timezone offset.
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.slice(0, 5).split(":").map(Number);
  const second = timePart.length > 5 && timePart[5] === ":"
    ? Number(timePart.slice(6, 8)) : 0;
  const wallClock = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offset = /([+-])(\d{2}):(\d{2})$/.exec(value);
  if (year < 100 ||
      wallClock.getUTCFullYear() !== year ||
      wallClock.getUTCMonth() + 1 !== month ||
      wallClock.getUTCDate() !== day ||
      wallClock.getUTCHours() !== hour ||
      wallClock.getUTCMinutes() !== minute ||
      wallClock.getUTCSeconds() !== second ||
      (offset && (Number(offset[2]) > 23 || Number(offset[3]) > 59))) {
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
  title: z.string().trim().min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),
  htmlContent: z.string().trim().min(1, "HTML content is required")
    .max(50_000, "HTML content cannot exceed 50000 characters"),
  classId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  courseSlug: z.string().trim().min(1).max(64).optional(),
  assessmentUrl: z.string().trim()
    .max(2048, "Assessment URL must use http or https")
    .refine((value) => {
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    }, "Assessment URL must use http or https")
    .optional(),
  scheduledAt: z.string().trim().min(1).max(40)
    .refine(validStaffNotificationSchedule, "scheduledAt must be yyyy-MM-dd HH:mm:ss")
    .nullish(),
}).strict().refine(
  (input) => Boolean(input.classId || input.courseId || input.courseSlug),
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
  // Resolve a legacy slug within a verified academic/actor scope. Slugs are
  // not guaranteed to be unique across colleges: never choose an arbitrary
  // cross-tenant match with LIMIT 1.
  let resolvedCourseId = draft.courseId ?? null;
  if (draft.courseSlug) {
    const [selectedSection] = draft.classId
      ? await db.select({ collegeId: academicPeriods.collegeId })
          .from(sections)
          .innerJoin(academicPeriods, eq(academicPeriods.id, sections.academicPeriodId))
          .where(eq(sections.id, draft.classId))
          .limit(1)
      : [];
    const pinnedCollegeId = (isSuperAdmin(context)
      ? context.adminScope?.collegeId
      : context.membership?.collegeId) ?? null;
    if (selectedSection && pinnedCollegeId &&
        selectedSection.collegeId !== pinnedCollegeId) {
      throw new ActivityServiceError("NOTIFICATION_SCOPE_MISMATCH");
    }
    const scopedCollegeId = pinnedCollegeId ?? selectedSection?.collegeId ?? null;
    const scopedOrganizationId = (isSuperAdmin(context)
      ? context.adminScope?.organizationId
      : context.membership?.organizationId) ?? null;
    const slugMatches = await db.select({ id: courses.id })
      .from(courses)
      .innerJoin(departments, eq(departments.id, courses.departmentId))
      .innerJoin(colleges, eq(colleges.id, departments.collegeId))
      .where(and(
        eq(courses.slug, draft.courseSlug),
        eq(courses.status, "ACTIVE"),
        isNull(courses.deletedAt),
        ...(scopedCollegeId ? [eq(departments.collegeId, scopedCollegeId)] : []),
        ...(scopedOrganizationId ? [eq(colleges.organizationId, scopedOrganizationId)] : []),
      )).limit(2);
    if (slugMatches.length !== 1) throw new Error("Course not found for slug");
    resolvedCourseId = slugMatches[0].id;
  }
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
          eq(courses.id, resolvedCourseId!),
          eq(courses.status, "ACTIVE"),
          isNull(courses.deletedAt),
          eq(colleges.status, "ACTIVE"),
        )).limit(1);

  if (!scope) throw new ActivityServiceError("ACTIVITY_SCOPE_NOT_FOUND");
  if (draft.classId && resolvedCourseId) {
    // A legacy notice can carry class AND course; reject cross-class/college
    // retargeting unless a currently active delivery links these exact IDs.
    const [currentDelivery] = await db.select({ id: courseSectionDeliveries.id })
      .from(courseSectionDeliveries)
      .innerJoin(courseOfferings,
        eq(courseOfferings.id, courseSectionDeliveries.offeringId))
      .innerJoin(courses,
        eq(courses.id, courseOfferings.courseId))
      .where(and(
        eq(courseSectionDeliveries.sectionId, draft.classId),
        eq(courseOfferings.courseId, resolvedCourseId),
        eq(courseOfferings.status, "ACTIVE"),
        eq(courses.status, "ACTIVE"),
        isNull(courses.deletedAt),
        isNull(courseSectionDeliveries.endedAt),
      )).limit(1);
    if (!currentDelivery) throw new ActivityServiceError("NOTIFICATION_SCOPE_MISMATCH");
  }
  const audience: StaffNotificationAudience = {
    ...scope,
    classId: draft.classId ?? null,
    courseId: resolvedCourseId,
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
          eq(courseOfferings.courseId, resolvedCourseId!),
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
  const courseSection = audience.courseId && !draft.classId
    ? await db.select({ sectionId: courseSectionDeliveries.sectionId })
        .from(courseSectionDeliveries)
        .innerJoin(courseOfferings,
          eq(courseOfferings.id, courseSectionDeliveries.offeringId))
        .where(and(
          eq(courseOfferings.courseId, audience.courseId!),
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
  // A stored event's scope and the source class/course must still agree.
  // Do not allow a creator (or an administrator) to mutate an event if
  // imported or stale metadata points at another tenant's audience.
  const previous = staffNotificationDraftSchema.safeParse({
    title: "Existing notification",
    htmlContent: "Existing notification",
    classId: audience.classId ?? undefined,
    courseId: audience.courseId ?? undefined,
  });
  if (!previous.success) {
    throw new ActivityServiceError("NOTIFICATION_SCOPE_MISMATCH");
  }
  if (isAdmin) {
    requirePermission(context, "courses.manage", {
      collegeId: existing.collegeId,
      organizationId: existing.organizationId,
    });
    // Administrators must still be able to recall a notice after the class
    // or course is archived. Verify the original tenant via stored relations
    // without requiring those historic academic records to remain ACTIVE.
    if (audience.classId) {
      const [originalSection] = await getDb()
        .select({ collegeId: academicPeriods.collegeId })
        .from(sections)
        .innerJoin(academicPeriods, eq(academicPeriods.id, sections.academicPeriodId))
        .where(eq(sections.id, audience.classId))
        .limit(1);
      if (!originalSection || originalSection.collegeId !== existing.collegeId) {
        throw new ActivityServiceError("NOTIFICATION_SCOPE_MISMATCH");
      }
    }
    if (audience.courseId) {
      const [originalCourse] = await getDb()
        .select({ collegeId: departments.collegeId })
        .from(courses)
        .innerJoin(departments, eq(departments.id, courses.departmentId))
        .where(eq(courses.id, audience.courseId))
        .limit(1);
      if (!originalCourse || originalCourse.collegeId !== existing.collegeId) {
        throw new ActivityServiceError("NOTIFICATION_SCOPE_MISMATCH");
      }
    }
  } else {
    // A faculty creator must still have a live teaching assignment to the
    // original course/class; a role in the college alone is insufficient.
    const { audience: originalAudience } =
      await requireStaffNotificationAudience(context, previous.data);
    if (originalAudience.collegeId !== existing.collegeId ||
        originalAudience.organizationId !== existing.organizationId) {
      throw new ActivityServiceError("NOTIFICATION_SCOPE_MISMATCH");
    }
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
          subjectType: activityEvents.subjectType,
          metadata: activityEvents.metadata,
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
  // An authored notice cannot be sent while scheduled, failed or recalled.
  // The release worker must commit SENT before recipient delivery; generic
  // activity events without a notice lifecycle retain existing behaviour.
  if (event.subjectType === "NOTIFICATION" &&
      (event.metadata.deletedAt != null ||
       (event.metadata.deliveryStatus != null &&
        event.metadata.deliveryStatus !== "SENT") ||
       (event.metadata.scheduledAt != null &&
        event.metadata.deliveryStatus !== "SENT"))) {
    throw new ActivityServiceError("NOTIFICATION_NOT_FOUND");
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
    classId?: string;
    courseId?: string;
    deliveryStatus?: "SENT" | "SCHEDULED" | "PROCESSING" | "FAILED" | "DELETED";
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
    classId: z.string().uuid().optional(),
    courseId: z.string().uuid().optional(),
    deliveryStatus: z.enum(["SENT", "SCHEDULED", "PROCESSING", "FAILED", "DELETED"]).optional(),
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

  const scopeConditions = [eq(activityEvents.subjectType, "NOTIFICATION")];
  if (collegeId) scopeConditions.push(eq(activityEvents.collegeId, collegeId));
  else if (organizationId) {
    scopeConditions.push(eq(activityEvents.organizationId, organizationId));
  }
  // Historical rows without a status are SENT only when they were not
  // scheduled. Recalled rows remain accessible to authorized admin audits.
  const status = sql<string>`
    case
      when ${activityEvents.metadata} ->> 'deletedAt' is not null then 'DELETED'
      when ${activityEvents.metadata} ->> 'deliveryStatus' is not null
        then ${activityEvents.metadata} ->> 'deliveryStatus'
      when ${activityEvents.metadata} ->> 'scheduledAt' is not null
        then 'SCHEDULED'
      else 'SENT'
    end
  `;
  // Counts and paged results share the same tenant AND academic-context
  // filters; selecting a class/course must not show college-wide totals.
  appendNotificationContextFilters(scopeConditions, options);
  const conditions = [...scopeConditions];
  if (options.deliveryStatus) conditions.push(eq(status, options.deliveryStatus));
  const where = and(...conditions);
  const db = getDb();
  const [[totalRow], items, statusRows] = await Promise.all([
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
      deliveryStatus: status,
    }).from(activityEvents).where(where)
      .orderBy(desc(activityEvents.occurredAt), desc(activityEvents.id))
      .limit(options.pageSize).offset(options.pageNo * options.pageSize),
    db.select({ deliveryStatus: status, total: count() })
      .from(activityEvents).where(and(...scopeConditions))
      .groupBy(status),
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
    deliveryStatusCounts: Object.fromEntries(
      statusRows.map((row) => [row.deliveryStatus, row.total]),
    ),
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
    category?: OwnNotificationCategory;
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
    releasedNotificationReceipt,
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
          releasedNotificationReceipt,
        ))
    : await db.select({ total: count() }).from(inAppNotifications)
        .innerJoin(activityEvents, eq(activityEvents.id, inAppNotifications.eventId))
        .where(and(
          eq(inAppNotifications.userId, context.user.id),
          isNull(inAppNotifications.readAt),
          releasedNotificationEvent,
          releasedNotificationReceipt,
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
        releasedNotificationReceipt,
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
        releasedNotificationReceipt,
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
        releasedNotificationReceipt,
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
      releasedNotificationReceipt,
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
/** Legacy category tabs remain a further filter on this user's own receipts.
 * Faculty category requires an explicit stored audienceKind; without one,
 * the notice remains visible in All, not misclassified. */
export type OwnNotificationCategory="COURSE"|"PROJECT"|"ANNOUNCEMENTS"|"JOB"|
 "COLLEGE"|"DEPARTMENT"|"FACULTY"|"PERSONAL";
export function ownNotificationCategoryChoices(context:RequestContext){
 if(context.membership?.roles.includes("LEARNER"))return [
  {id:"COURSE",label:"Course"},{id:"PROJECT",label:"Project"},
  {id:"ANNOUNCEMENTS",label:"Announcements"},{id:"JOB",label:"Job"},
 ] as const;
 if(context.membership?.roles.includes("FACULTY"))return [
  {id:"COLLEGE",label:"College"},{id:"DEPARTMENT",label:"Department"},
  {id:"FACULTY",label:"Faculty"},{id:"PERSONAL",label:"Personal"},
 ] as const;
 return [] as const;
}
function ownCategoryCondition(category:OwnNotificationCategory){
 switch(category){
  case "COURSE":return eq(activityEvents.module,"COURSES");
  case "PROJECT":return eq(activityEvents.module,"PROJECTS");
  case "ANNOUNCEMENTS":return or(eq(activityEvents.subjectType,"announcement"),
   sql`${activityEvents.eventType} ilike '%announcement%'`)!;
  case "JOB":return and(eq(activityEvents.module,"PLACEMENTS"),
   sql`${activityEvents.subjectType} <> 'announcement'`)!;
  default:return eq(sql<string>`${activityEvents.metadata} ->> 'audienceKind'`,category);
 }
}
function requireOwnCategory(context:RequestContext,category:OwnNotificationCategory){
 if(!ownNotificationCategoryChoices(context).some(row=>row.id===category))
  throw new ActivityServiceError("NOTIFICATION_NOT_FOUND");
}
export async function countOwnUnreadNotificationCategory(
 context:RequestContext,category:OwnNotificationCategory,
){
 requireOwnCategory(context,category);
 const [row]=await getDb().select({total:count()}).from(inAppNotifications)
 .innerJoin(activityEvents,eq(activityEvents.id,inAppNotifications.eventId))
 .where(and(eq(inAppNotifications.userId,context.user.id),
  isNull(inAppNotifications.readAt),
  releasedNotificationEvent,releasedNotificationReceipt,
  ownCategoryCondition(category)));
 return Number(row?.total??0);
}

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
    releasedNotificationReceipt,
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
  if(options.category){
    requireOwnCategory(context,options.category);
    conditions.push(ownCategoryCondition(options.category));
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

/**
 * Staff composition is a separate, authenticated operation from delivery of
 * a pre-existing activity event. It never accepts arbitrary recipient IDs.
 * Keep a safe rich-text representation for legacy-style detail views; inbox
 * previews remain short, escaped text.
 */
export function sanitizeStaffNotificationHtml(input: string): string {
  const source = input.replace(/<(script|style|iframe|object|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  const escapeText = (value: string) => value.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const allowed = new Set([
    "p", "br", "strong", "b", "em", "i", "u", "s", "sub", "sup", "ul", "ol", "li",
  ]);
  return source.split(/(<[^>]*>)/g).map((part) => {
    if (!part.startsWith("<") || !part.endsWith(">")) return escapeText(part);
    const tag = /^<\s*(\/?)\s*([a-z]+)\b([^>]*)>$/i.exec(part);
    if (!tag) return escapeText(part);
    const name = tag[2].toLowerCase();
    const closing = tag[1] === "/";
    const attributes = tag[3].trim();
    if (allowed.has(name) && (!attributes || (name === "br" && attributes === "/"))) {
      return name === "br" ? "<br>" : (closing ? "</" : "<") + name + ">";
    }
    if (name === "a" && closing && !attributes) return "</a>";
    if (name !== "a" || closing) return "";
    const hrefMatch = /^href\s*=\s*(?:"([^"]*)"|'([^']*)')$/i.exec(attributes);
    const href = hrefMatch?.[1] ?? hrefMatch?.[2];
    if (!href) return "";
    const safe = href.startsWith("/")
      ? safeNotificationActionHref(href) : safeExternalAssessmentUrl(href);
    return safe ? '<a href="' + escapeText(safe) + '" rel="noopener noreferrer">' : "";
  }).join("").slice(0, 50_000);
}

function staffNotificationTitle(input: string): string {
  const title = input.replace(/<[^>]*>/g, "").trim();
  if (!title) throw new Error("Title is required");
  if (title.length > 200) throw new Error("Title cannot exceed 200 characters");
  return title;
}

function notificationPreviewFromHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    .slice(0, 2000) || "Notification";
}

export type StaffNoticeOperationResult = {
  id: string;
  deliveryStatus: "SENT" | "SCHEDULED" | "DELETED";
  delivered: number;
  scheduled: number;
  deleted: number;
};

/**
 * Class/course fanout is resolved using current enrollment relationships,
 * never a caller-supplied user list. Scheduled receipts are not visible to
 * inbox readers until an internal release explicitly marks them SENT.
 */
export async function createStaffNotification(
  context: RequestContext,
  rawDraft: unknown,
): Promise<StaffNoticeOperationResult> {
  const { draft, audience } = await requireStaffNotificationAudience(context, rawDraft);
  const { userIds } = await resolveStaffNotificationRecipients(context, rawDraft);
  const scheduledAt = parseStaffNotificationSchedule(draft.scheduledAt);
  if (scheduledAt && scheduledAt.getTime() <= Date.now()) {
    throw new Error("scheduledAt must be a future date");
  }
  const safeAssessmentUrl = draft.assessmentUrl
    ? safeExternalAssessmentUrl(draft.assessmentUrl) : null;
  if (draft.assessmentUrl && !safeAssessmentUrl) {
    throw new Error("Assessment URL must use http or https");
  }
  const htmlContent = sanitizeStaffNotificationHtml(draft.htmlContent);
  const title = staffNotificationTitle(draft.title);
  const body = notificationPreviewFromHtml(htmlContent);
  const now = new Date();
  const deliveryStatus = scheduledAt ? "SCHEDULED" : "SENT";

  return getDb().transaction(async (tx) => {
    await assertScopedNotificationRecipients(tx, audience, userIds);
    const [event] = await tx.insert(activityEvents).values({
      collegeId: audience.collegeId,
      organizationId: audience.organizationId,
      actorUserId: context.user.id,
      actorMembershipId: context.membership?.collegeId === audience.collegeId
        ? context.membership.id : null,
      module: "COURSES",
      eventType: "courses.notification.published",
      importance: "NORMAL",
      subjectType: "NOTIFICATION",
      subjectId: "staff-notice",
      subjectLabel: title,
      summary: title,
      metadata: {
        classId: audience.classId,
        courseId: audience.courseId,
        title,
        htmlContent,
        assessmentUrl: safeAssessmentUrl,
        scheduledAt: scheduledAt?.toISOString() ?? null,
        deliveryStatus,
        authorUserId: context.user.id,
      },
    }).returning({ id: activityEvents.id });
    const delivered = userIds.length
      ? await tx.insert(inAppNotifications).values(userIds.map((userId) => ({
          userId,
          eventId: event.id,
          title,
          body,
          legacyAssessmentUrl: safeAssessmentUrl,
          legacyCreatedByUserId: context.user.id,
          scheduledAt,
          deliveryStatus,
          deliveredAt: scheduledAt ? null : now,
        }))).onConflictDoNothing().returning({ id: inAppNotifications.id })
      : [];
    return {
      id: event.id,
      deliveryStatus,
      delivered: scheduledAt ? 0 : delivered.length,
      scheduled: scheduledAt ? delivered.length : 0,
      deleted: 0,
    };
  });
}

/**
 * Recall the authored notice rather than deleting individual read receipts.
 * Every inbox reader already filters deleted event and receipt timestamps.
 */
export async function deleteStaffNotification(
  context: RequestContext,
  eventIdInput: unknown,
): Promise<StaffNoticeOperationResult> {
  const id = z.string().uuid().parse(eventIdInput);
  await requireStaffNotificationMutation(context, id);
  return getDb().transaction(async (tx) => {
    const [event] = await tx.select({
      actorUserId: activityEvents.actorUserId,
      metadata: activityEvents.metadata,
      collegeId: activityEvents.collegeId,
    }).from(activityEvents).where(eq(activityEvents.id, id)).for("update").limit(1);
    if (!event || event.metadata.deletedAt != null ||
        event.collegeId !== (context.adminScope?.collegeId ?? context.membership?.collegeId ?? event.collegeId) ||
        (event.actorUserId !== context.user.id &&
         !isSuperAdmin(context) && !hasMembershipRole(context, "COLLEGE_ADMIN"))) {
      throw new ActivityServiceError("NOTIFICATION_NOT_FOUND");
    }
    const deletedAt = new Date();
    await tx.update(activityEvents).set({
      metadata: {
        ...event.metadata,
        deliveryStatus: "DELETED",
        deletedAt: deletedAt.toISOString(),
      },
    }).where(eq(activityEvents.id, id));
    const rows = await tx.update(inAppNotifications)
      .set({ deliveryStatus: "DELETED", deletedAt })
      .where(and(eq(inAppNotifications.eventId, id), isNull(inAppNotifications.deletedAt)))
      .returning({ id: inAppNotifications.id });
    return {
      id, deliveryStatus: "DELETED", delivered: 0, scheduled: 0, deleted: rows.length,
    };
  });
}


/**
 * Editing always checks permission on BOTH the persisted audience and its
 * proposed replacement. Scheduled recipients can be replaced before release;
 * already sent notices can only update their contents, not their audience.
 */
export async function updateStaffNotification(
  context: RequestContext,
  eventIdInput: unknown,
  rawDraft: unknown,
): Promise<StaffNoticeOperationResult> {
  const id = z.string().uuid().parse(eventIdInput);
  const original = await requireStaffNotificationMutation(context, id);
  const { draft, audience } = await requireStaffNotificationAudience(context, rawDraft);
  const scheduledAt = parseStaffNotificationSchedule(draft.scheduledAt);
  const safeAssessmentUrl = draft.assessmentUrl
    ? safeExternalAssessmentUrl(draft.assessmentUrl) : null;
  if (draft.assessmentUrl && !safeAssessmentUrl) {
    throw new Error("Assessment URL must use http or https");
  }
  const htmlContent = sanitizeStaffNotificationHtml(draft.htmlContent);
  const title = staffNotificationTitle(draft.title);
  const body = notificationPreviewFromHtml(htmlContent);
  // Resolve new recipients before locking the event; re-check their college
  // grants again inside the transaction before replacing pending receipts.
  const { userIds } = await resolveStaffNotificationRecipients(context, rawDraft);
  const sameAudience = original.collegeId === audience.collegeId &&
    original.organizationId === audience.organizationId &&
    original.classId === audience.classId &&
    original.courseId === audience.courseId;
  return getDb().transaction(async (tx) => {
    const [event] = await tx.select({
      actorUserId: activityEvents.actorUserId,
      organizationId: activityEvents.organizationId,
      collegeId: activityEvents.collegeId,
      metadata: activityEvents.metadata,
    }).from(activityEvents).where(eq(activityEvents.id, id)).for("update").limit(1);
    if (!event || event.metadata.deletedAt != null ||
        event.collegeId !== original.collegeId ||
        event.organizationId !== original.organizationId ||
        (event.actorUserId !== context.user.id &&
         !isSuperAdmin(context) && !hasMembershipRole(context, "COLLEGE_ADMIN"))) {
      throw new ActivityServiceError("NOTIFICATION_NOT_FOUND");
    }
    const status = event.metadata.deliveryStatus;
    if (status !== "SCHEDULED" && status !== "SENT") {
      throw new ActivityServiceError("NOTIFICATION_NOT_FOUND");
    }
    if (status === "SENT" && !sameAudience) {
      throw new ActivityServiceError("NOTIFICATION_SCOPE_MISMATCH");
    }
    if (status === "SCHEDULED" && (!scheduledAt || scheduledAt.getTime() <= Date.now())) {
      throw new Error("scheduledAt must be a future date");
    }
    if (status === "SENT" && scheduledAt) {
      throw new ActivityServiceError("NOTIFICATION_SCOPE_MISMATCH");
    }
    if (status === "SCHEDULED") {
      await assertScopedNotificationRecipients(tx, audience, userIds);
    }
    await tx.update(activityEvents).set({
      organizationId: audience.organizationId,
      collegeId: audience.collegeId,
      subjectLabel: title,
      summary: title,
      metadata: {
        ...event.metadata,
        classId: audience.classId,
        courseId: audience.courseId,
        title,
        htmlContent,
        assessmentUrl: safeAssessmentUrl,
        scheduledAt: status === "SCHEDULED" ? scheduledAt?.toISOString() : event.metadata.scheduledAt,
        updatedAt: new Date().toISOString(),
      },
    }).where(eq(activityEvents.id, id));
    if (status === "SCHEDULED") {
      await tx.update(inAppNotifications).set({ deletedAt: new Date() })
        .where(eq(inAppNotifications.eventId, id));
      if (userIds.length > 0) {
        await tx.insert(inAppNotifications).values(userIds.map((userId) => ({
          userId, eventId: id, title, body,
          scheduledAt, deliveredAt: null, deliveryStatus: "SCHEDULED",
          legacyAssessmentUrl: safeAssessmentUrl,
          legacyCreatedByUserId: context.user.id,
        }))).onConflictDoUpdate({
          target: [inAppNotifications.userId, inAppNotifications.eventId],
          set: {
            title, body, scheduledAt, deliveredAt: null,
            deletedAt: null, deliveryStatus: "SCHEDULED",
            legacyAssessmentUrl: safeAssessmentUrl,
          },
        });
      }
    } else {
      await tx.update(inAppNotifications).set({
        title, body, legacyAssessmentUrl: safeAssessmentUrl,
      }).where(and(eq(inAppNotifications.eventId, id), isNull(inAppNotifications.deletedAt)));
    }
    return {
      id,
      deliveryStatus: status,
      delivered: 0,
      scheduled: status === "SCHEDULED" ? userIds.length : 0,
      deleted: 0,
    };
  });
}

/**
 * Trusted internal due-release entry point. The event row serializes multiple
 * workers; recipients remain invisible until the transaction commits both
 * the SENT event state and the delivered receipts.
 * An unresolved membership change aborts the whole release (fail-closed).
 */
export async function releaseScheduledStaffNotification(
  eventIdInput: unknown,
  asOf: Date = new Date(),
): Promise<{ delivered: number; alreadyReleased: boolean }> {
  const id = z.string().uuid().parse(eventIdInput);
  const now = z.date().parse(asOf);
  return getDb().transaction(async (tx) => {
    const [event] = await tx.select({
      subjectType: activityEvents.subjectType,
      metadata: activityEvents.metadata,
      collegeId: activityEvents.collegeId,
      organizationId: activityEvents.organizationId,
    }).from(activityEvents).where(eq(activityEvents.id, id)).for("update").limit(1);
    if (!event || event.subjectType !== "NOTIFICATION" ||
        event.metadata.deletedAt != null) {
      throw new ActivityServiceError("NOTIFICATION_NOT_FOUND");
    }
    if (event.metadata.deliveryStatus !== "SCHEDULED") {
      return { delivered: 0, alreadyReleased: true };
    }
    const dueValue = event.metadata.scheduledAt;
    const due = typeof dueValue === "string" ? new Date(dueValue) : null;
    if (!due || Number.isNaN(due.getTime()) || due.getTime() > now.getTime()) {
      return { delivered: 0, alreadyReleased: false };
    }
    const recipients = await tx.select({ userId: inAppNotifications.userId })
      .from(inAppNotifications)
      .where(and(
        eq(inAppNotifications.eventId, id),
        eq(inAppNotifications.deliveryStatus, "SCHEDULED"),
        isNull(inAppNotifications.deletedAt),
      ));
    await assertScopedNotificationRecipients(
      tx, event, recipients.map((row) => row.userId),
    );
    const rows = await tx.update(inAppNotifications).set({
      deliveryStatus: "SENT", deliveredAt: now,
    }).where(and(
      eq(inAppNotifications.eventId, id),
      eq(inAppNotifications.deliveryStatus, "SCHEDULED"),
      isNull(inAppNotifications.deletedAt),
    )).returning({ id: inAppNotifications.id });
    await tx.update(activityEvents).set({
      metadata: {
        ...event.metadata,
        deliveryStatus: "SENT",
        deliveredAt: now.toISOString(),
      },
    }).where(eq(activityEvents.id, id));
    return { delivered: rows.length, alreadyReleased: false };
  });
}


/**
 * Worker-facing due batch. This is deliberately separate from the public
 * staff composer and only called by a credential-gated internal endpoint.
 * Every due event is independently locked and checked again at release.
 */
export async function releaseDueStaffNotifications(
  asOf: Date = new Date(),
  requestedLimit = 50,
): Promise<{ checked: number; delivered: number; failed: number }> {
  const now = z.date().parse(asOf);
  const limit = z.number().int().min(1).max(100).parse(requestedLimit);
  const due = await getDb().select({ id: activityEvents.id })
    .from(activityEvents)
    .where(and(
      eq(activityEvents.subjectType, "NOTIFICATION"),
      eq(sql.raw("activity_events.metadata ->> 'deliveryStatus'"), "SCHEDULED"),
      lte(sql.raw("activity_events.metadata ->> 'scheduledAt'"), now.toISOString()),
      sql.raw("activity_events.metadata ->> 'deletedAt' is null"),
    ))
    .orderBy(activityEvents.occurredAt, activityEvents.id)
    .limit(limit);
  let delivered = 0;
  let failed = 0;
  for (const row of due) {
    try {
      const released = await releaseScheduledStaffNotification(row.id, now);
      delivered += released.delivered;
    } catch {
      failed += 1;
      // Do not convert a transient failure into immediate delivery. Keep the
      // scheduled receipts invisible so a later run can retry safely.
      const [current] = await getDb().select({ metadata: activityEvents.metadata })
        .from(activityEvents).where(and(
          eq(activityEvents.id, row.id),
          eq(sql.raw("activity_events.metadata ->> 'deliveryStatus'"), "SCHEDULED"),
        )).limit(1);
      if (current) {
        await getDb().update(activityEvents).set({
          metadata: {
            ...current.metadata,
            deliveryAttempts: Number(current.metadata.deliveryAttempts ?? 0) + 1,
            lastReleaseError: "Scheduled release could not be completed",
          },
        }).where(and(
          eq(activityEvents.id, row.id),
          eq(sql.raw("activity_events.metadata ->> 'deliveryStatus'"), "SCHEDULED"),
        ));
      }
    }
  }
  return { checked: due.length, delivered, failed };
}
