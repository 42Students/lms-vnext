import {
  and, desc, eq, gt, isNotNull, isNull, lt, lte, or, sql, type SQL,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { db10Announcements,announcementBroadcastGroups } from "@/db/schema/db10-announcements";
import { activityEvents } from "@/db/schema/activity";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { colleges } from "@/db/schema/colleges";
import { departments } from "@/db/schema/departments";
import {
  cohorts, learnerProgramEnrollments, programs, sectionEnrollments,
  sectionFacultyAssignments, sections,
} from "@/db/schema/academics";
import { collegeMemberships, membershipRoles } from "@/db/schema/memberships";
import { facultyProfiles } from "@/db/schema/profiles";
import { organizations } from "@/db/schema/organizations";
import { users } from "@/db/schema/users";
import {
  hasMembershipRole, isSuperAdmin, type RequestContext,
} from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import {
  announcementAdminListSchema, announcementCreateSchema, announcementIdSchema,
  announcementUpdateSchema, announcementVersionSchema,
  ANNOUNCEMENT_RECEIVER_TYPES,
} from "./validation";
import { AnnouncementError } from "./errors";
import {requirePlatformPublishConsent} from "./super-admin-publish-consent-model";
import { canAccessAnnouncements } from "./actor-status-model";
import {readGlobalRuntimeNumber} from "@/modules/platform-settings/runtime-numeric-service";
import { requireCurrentAnnouncementVersion } from "./announcement-version-guard";

type ReceiverType = (typeof ANNOUNCEMENT_RECEIVER_TYPES)[number];

async function activeCollegeScope(collegeId: string) {
  const [row] = await getDb()
    .select({ collegeId: colleges.id, organizationId: colleges.organizationId })
    .from(colleges)
    .innerJoin(organizations, eq(organizations.id, colleges.organizationId))
    .where(and(
      eq(colleges.id, collegeId),
      eq(colleges.status, "ACTIVE"),
      eq(organizations.status, "ACTIVE"),
    ))
    .limit(1);
  if (!row) throw new AnnouncementError("TARGET_NOT_FOUND");
  return row;
}

async function resolveTarget(type: ReceiverType, id: string) {
  const db = getDb();
  if (type === "COLLEGE") return activeCollegeScope(id);

  if (type === "DEPARTMENT") {
    const [row] = await db
      .select({ collegeId: departments.collegeId, organizationId: colleges.organizationId })
      .from(departments)
      .innerJoin(colleges, eq(colleges.id, departments.collegeId))
      .innerJoin(organizations, eq(organizations.id, colleges.organizationId))
      .where(and(
        eq(departments.id, id), isNull(departments.archivedAt),
        eq(colleges.status, "ACTIVE"), eq(organizations.status, "ACTIVE"),
      ))
      .limit(1);
    if (!row) throw new AnnouncementError("TARGET_NOT_FOUND");
    return row;
  }

  if (type === "PROGRAM") {
    const [row] = await db
      .select({ collegeId: departments.collegeId, organizationId: colleges.organizationId })
      .from(programs)
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .innerJoin(colleges, eq(colleges.id, departments.collegeId))
      .innerJoin(organizations, eq(organizations.id, colleges.organizationId))
      .where(and(
        eq(programs.id, id), eq(programs.status, "ACTIVE"),
        isNull(departments.archivedAt), eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ))
      .limit(1);
    if (!row) throw new AnnouncementError("TARGET_NOT_FOUND");
    return row;
  }

  if (type === "CLASS") {
    const [row] = await db
      .select({ collegeId: departments.collegeId, organizationId: colleges.organizationId })
      .from(sections)
      .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .innerJoin(colleges, eq(colleges.id, departments.collegeId))
      .innerJoin(organizations, eq(organizations.id, colleges.organizationId))
      .where(and(
        eq(sections.id, id), eq(sections.status, "ACTIVE"),
        eq(programs.status, "ACTIVE"),
        isNull(departments.archivedAt), eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ))
      .limit(1);
    if (!row) throw new AnnouncementError("TARGET_NOT_FOUND");
    return row;
  }

  const requiredRole = type === "FACULTY" ? "FACULTY" : "LEARNER";
  const [row] = await db
    .select({ collegeId: collegeMemberships.collegeId, organizationId: colleges.organizationId })
    .from(collegeMemberships)
    .innerJoin(membershipRoles, eq(membershipRoles.membershipId, collegeMemberships.id))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(colleges, eq(colleges.id, collegeMemberships.collegeId))
    .innerJoin(organizations, eq(organizations.id, colleges.organizationId))
    .where(and(
      eq(collegeMemberships.id, id),
      eq(collegeMemberships.status, "ACTIVE"),
      eq(users.platformStatus, "ACTIVE"),
      eq(membershipRoles.role, requiredRole),
      eq(colleges.status, "ACTIVE"),
      eq(organizations.status, "ACTIVE"),
    ))
    .limit(1);
  if (!row) throw new AnnouncementError("TARGET_NOT_FOUND");
  return row;
}

function senderType(context: RequestContext) {
  if (isSuperAdmin(context)) return "SUPER_ADMIN" as const;
  if (hasMembershipRole(context, "COLLEGE_ADMIN")) return "COLLEGE_ADMIN" as const;
  if (hasMembershipRole(context, "TPO")) return "TPO" as const;
  if (hasMembershipRole(context, "FACULTY")) return "FACULTY" as const;
  return "LEARNER" as const;
}

function requireManage(context: RequestContext, scope: { collegeId: string; organizationId: string }) {
  if (!canAccessAnnouncements(context.user.platformStatus)) throw new AnnouncementError("FORBIDDEN");
  requirePermission(context, "college.manage", scope);
}

function adminListScope(context: RequestContext): { collegeId?: string; organizationId?: string } {
  if (!canAccessAnnouncements(context.user.platformStatus)) throw new AnnouncementError("FORBIDDEN");
  if (isSuperAdmin(context)) {
    if (context.adminScope?.collegeId) return { collegeId: context.adminScope.collegeId };
    if (context.adminScope?.organizationId) return { organizationId: context.adminScope.organizationId };
    return {};
  }
  if (hasMembershipRole(context, "COLLEGE_ADMIN") && context.membership) {
    return { collegeId: context.membership.collegeId };
  }
  throw new AnnouncementError("FORBIDDEN");
}

function assertSchedule(scheduledAt: Date | null, expiresAt: Date | null) {
  if (scheduledAt && expiresAt && expiresAt <= scheduledAt) {
    throw new AnnouncementError("INVALID_SCHEDULE");
  }
}

export async function createAnnouncement(context: RequestContext, raw: unknown) {
  const input = announcementCreateSchema.parse(raw);
  requirePlatformPublishConsent(isSuperAdmin(context),input.publishConsent===true);
  const scope = await resolveTarget(input.receiverType, input.receiverId);
  requireManage(context, scope);
  assertSchedule(input.scheduledAt ?? null, input.expiresAt ?? null);
  return getDb().transaction(async tx => {
    const [created] = await tx.insert(db10Announcements).values({
      ...scope,
      receiverType: input.receiverType,
      receiverId: input.receiverId,
      title: input.title,
      message: input.message,
      senderUserId: context.user.id,
      senderType: senderType(context),
      scheduledAt: input.scheduledAt ?? null,
      expiresAt: input.expiresAt ?? null,
      isPinned: input.isPinned,
    }).returning();
    if (isSuperAdmin(context)) {
      await tx.insert(activityEvents).values({
        collegeId: scope.collegeId,
        organizationId: scope.organizationId,
        actorUserId: context.user.id,
        module: "PLATFORM",
        eventType: ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_ANNOUNCEMENT_PUBLISHED,
        subjectType: "announcement",
        subjectId: created.id,
        importance: "HIGH",
        summary: "Super Admin published an in-app college notice",
        metadata: { noticeId: created.id, receiverType: input.receiverType },
      });
    }
    return created;
  });
}

export async function listAnnouncementsForAdmin(context: RequestContext, raw: unknown = {}) {
  const input = announcementAdminListSchema.parse(raw);
  const scope = adminListScope(context);
  // SA-tenants-modules-39: overrides may tighten the bound but never bypass
  // the announcement service hard safety ceiling of 100 rows.
  const configuredMax=await readGlobalRuntimeNumber("ops.announcementMaxPageSize",100,100);
  const effectiveLimit=Math.min(input.limit,configuredMax);
  const conditions: SQL[] = [];
  if (scope.collegeId) conditions.push(eq(db10Announcements.collegeId, scope.collegeId));
  if (scope.organizationId) conditions.push(eq(db10Announcements.organizationId, scope.organizationId));
  const currentTime = new Date();
  if (input.visibility === "DELETED") {
    conditions.push(isNotNull(db10Announcements.deletedAt));
  } else if (input.visibility) {
    conditions.push(isNull(db10Announcements.deletedAt));
    if (input.visibility === "SCHEDULED") {
      conditions.push(gt(db10Announcements.scheduledAt, currentTime));
    } else if (input.visibility === "EXPIRED") {
      conditions.push(lte(db10Announcements.expiresAt, currentTime));
    } else {
      conditions.push(or(isNull(db10Announcements.scheduledAt), lte(db10Announcements.scheduledAt, currentTime))!);
      conditions.push(or(isNull(db10Announcements.expiresAt), gt(db10Announcements.expiresAt, currentTime))!);
    }
  } else if (!input.includeDeleted) {
    conditions.push(isNull(db10Announcements.deletedAt));
  }
  if (input.receiverType) conditions.push(eq(db10Announcements.receiverType, input.receiverType));
  if (input.pinned) conditions.push(eq(db10Announcements.isPinned, input.pinned === "PINNED"));
  if (input.senderType) conditions.push(eq(db10Announcements.senderType, input.senderType));
  if (input.q) {
    const term = input.q.toLowerCase();
    conditions.push(or(
      sql`position(${term}::text in lower(${db10Announcements.title})) > 0`,
      sql`position(${term}::text in lower(${db10Announcements.message})) > 0`,
    )!);
  }
  if (input.beforeCreatedAt && input.beforeId) {
    conditions.push(or(
      lt(db10Announcements.createdAt, input.beforeCreatedAt),
      and(
        eq(db10Announcements.createdAt, input.beforeCreatedAt),
        lt(db10Announcements.id, input.beforeId),
      ),
    )!);
  }
  const rows = await getDb()
    .select()
    .from(db10Announcements)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(db10Announcements.createdAt), desc(db10Announcements.id))
    .limit(effectiveLimit + 1);
  const hasMore = rows.length > effectiveLimit;
  const items = rows.slice(0, effectiveLimit);
  const last = items[items.length - 1];
  return {
    items,
    nextCursor: hasMore && last
      ? { beforeCreatedAt: last.createdAt, beforeId: last.id }
      : null,
  };
}

async function loadAnnouncement(id: string) {
  const [row] = await getDb()
    .select()
    .from(db10Announcements)
    .where(eq(db10Announcements.id, id))
    .limit(1);
  if (!row) throw new AnnouncementError("ANNOUNCEMENT_NOT_FOUND");
  return row;
}

export async function updateAnnouncement(
  context: RequestContext,
  idInput: string,
  raw: unknown,
) {
  const id = announcementIdSchema.parse(idInput);
  const input = announcementUpdateSchema.parse(raw);
  requirePlatformPublishConsent(isSuperAdmin(context),input.publishConsent===true);
  const current = await loadAnnouncement(id);
  requireManage(context, {
    organizationId: current.organizationId,
    collegeId: current.collegeId,
  });
  if (current.deletedAt) throw new AnnouncementError("ANNOUNCEMENT_DELETED");

  // Imported platform announcements are physical college copies of one
  // broadcast. Editing a shared field must update the whole logical notice,
  // or an audience would see contradictory copies. Audience membership is
  // immutable here: a retarget requires the dedicated broadcast workflow.
  if(current.broadcastGroupId){
    if(input.receiverType!==undefined||input.receiverId!==undefined)
      throw new AnnouncementError("STALE_AUDIENCE");
    return getDb().transaction(async tx=>{
      const [group]=await tx.select({id:announcementBroadcastGroups.id,
        organizationId:announcementBroadcastGroups.organizationId})
        .from(announcementBroadcastGroups)
        .where(eq(announcementBroadcastGroups.id,current.broadcastGroupId!))
        .for("update").limit(1);
      if(!group||group.organizationId!==current.organizationId)
        throw new AnnouncementError("TARGET_NOT_FOUND");
      const copies=await tx.select().from(db10Announcements)
        .where(eq(db10Announcements.broadcastGroupId,group.id))
        .for("update");
      if(!copies.length||!copies.some(copy=>copy.id===id))
        throw new AnnouncementError("ANNOUNCEMENT_NOT_FOUND");
      for(const copy of copies){
        requireManage(context,{collegeId:copy.collegeId,organizationId:copy.organizationId});
        if(copy.version!==input.expectedVersion||copy.deletedAt)
          throw new AnnouncementError("STALE_VERSION");
        assertSchedule(input.scheduledAt!==undefined?input.scheduledAt:copy.scheduledAt,
          input.expiresAt!==undefined?input.expiresAt:copy.expiresAt);
      }
      const now=new Date();
      const updated=await tx.update(db10Announcements).set({
        ...(input.title!==undefined?{title:input.title}:{}),
        ...(input.message!==undefined?{message:input.message}:{}),
        ...(input.scheduledAt!==undefined?{scheduledAt:input.scheduledAt}:{}),
        ...(input.expiresAt!==undefined?{expiresAt:input.expiresAt}:{}),
        ...(input.isPinned!==undefined?{isPinned:input.isPinned}:{}),
        version:input.expectedVersion+1,updatedAt:now,
      }).where(and(eq(db10Announcements.broadcastGroupId,group.id),
        eq(db10Announcements.version,input.expectedVersion),
        isNull(db10Announcements.deletedAt))).returning();
      if(updated.length!==copies.length)throw new AnnouncementError("STALE_VERSION");
      await tx.update(announcementBroadcastGroups).set({updatedAt:now})
        .where(eq(announcementBroadcastGroups.id,group.id));
      return updated.find(row=>row.id===id)!;
    });
  }

  const target = input.receiverType && input.receiverId
    ? await resolveTarget(input.receiverType, input.receiverId)
    : { organizationId: current.organizationId, collegeId: current.collegeId };
  requireManage(context, target);

  const scheduledAt = input.scheduledAt !== undefined
    ? input.scheduledAt : current.scheduledAt;
  const expiresAt = input.expiresAt !== undefined
    ? input.expiresAt : current.expiresAt;
  assertSchedule(scheduledAt, expiresAt);

  const [updated] = await getDb()
    .update(db10Announcements)
    .set({
      organizationId: target.organizationId,
      collegeId: target.collegeId,
      ...(input.receiverType ? { receiverType: input.receiverType } : {}),
      ...(input.receiverId ? { receiverId: input.receiverId } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.message !== undefined ? { message: input.message } : {}),
      ...(input.scheduledAt !== undefined ? { scheduledAt: input.scheduledAt } : {}),
      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
      ...(input.isPinned !== undefined ? { isPinned: input.isPinned } : {}),
      version: current.version + 1,
      updatedAt: new Date(),
    })
    .where(and(
      eq(db10Announcements.id, id),
      eq(db10Announcements.version, input.expectedVersion),
      isNull(db10Announcements.deletedAt),
    ))
    .returning();
  if (!updated) throw new AnnouncementError("STALE_VERSION");
  return updated;
}

export async function deleteAnnouncement(
  context: RequestContext,
  idInput: string,
  raw: unknown,
) {
  const id = announcementIdSchema.parse(idInput);
  const { expectedVersion } = announcementVersionSchema.parse(raw);
  const current = await loadAnnouncement(id);
  requireManage(context, current);
  // An already withdrawn notice is an idempotent DELETE, even when the
  // caller still holds the version from the original successful deletion.
  if (current.deletedAt) return current;
  requireCurrentAnnouncementVersion(current.version, expectedVersion);
  if(current.broadcastGroupId){
    return getDb().transaction(async tx=>{
      const [group]=await tx.select({id:announcementBroadcastGroups.id,
        organizationId:announcementBroadcastGroups.organizationId})
        .from(announcementBroadcastGroups)
        .where(eq(announcementBroadcastGroups.id,current.broadcastGroupId!))
        .for("update").limit(1);
      if(!group||group.organizationId!==current.organizationId)
        throw new AnnouncementError("TARGET_NOT_FOUND");
      const copies=await tx.select().from(db10Announcements)
        .where(eq(db10Announcements.broadcastGroupId,group.id))
        .for("update");
      if(!copies.length||!copies.some(copy=>copy.id===id))
        throw new AnnouncementError("ANNOUNCEMENT_NOT_FOUND");
      for(const copy of copies){
        requireManage(context,{collegeId:copy.collegeId,organizationId:copy.organizationId});
        if(copy.version!==expectedVersion||copy.deletedAt)
          throw new AnnouncementError("STALE_VERSION");
      }
      const now=new Date();
      const deleted=await tx.update(db10Announcements).set({
        deletedAt:now,deletedByUserId:context.user.id,
        version:expectedVersion+1,updatedAt:now,
      }).where(and(eq(db10Announcements.broadcastGroupId,group.id),
        eq(db10Announcements.version,expectedVersion),
        isNull(db10Announcements.deletedAt))).returning();
      if(deleted.length!==copies.length)throw new AnnouncementError("STALE_VERSION");
      await tx.update(announcementBroadcastGroups).set({updatedAt:now})
        .where(eq(announcementBroadcastGroups.id,group.id));
      return deleted.find(row=>row.id===id)!;
    });
  }
  const now = new Date();
  const [deleted] = await getDb()
    .update(db10Announcements)
    .set({
      deletedAt: now,
      deletedByUserId: context.user.id,
      version: current.version + 1,
      updatedAt: now,
    })
    .where(and(
      eq(db10Announcements.id, id),
      eq(db10Announcements.version, expectedVersion),
      isNull(db10Announcements.deletedAt),
    ))
    .returning();
  if (!deleted) throw new AnnouncementError("STALE_VERSION");
  return deleted;
}

export async function restoreAnnouncement(
  context: RequestContext,
  idInput: string,
  raw: unknown,
) {
  const id = announcementIdSchema.parse(idInput);
  const { expectedVersion } = announcementVersionSchema.parse(raw);
  const current = await loadAnnouncement(id);
  requireManage(context, current);
  requireCurrentAnnouncementVersion(current.version, expectedVersion);
  if (!current.deletedAt) return current;
  const now = new Date();
  const [restored] = await getDb()
    .update(db10Announcements)
    .set({
      deletedAt: null,
      deletedByUserId: null,
      version: current.version + 1,
      updatedAt: now,
    })
    .where(and(
      eq(db10Announcements.id, id),
      eq(db10Announcements.version, expectedVersion),
      eq(db10Announcements.deletedAt, current.deletedAt),
    ))
    .returning();
  if (!restored) throw new AnnouncementError("STALE_VERSION");
  return restored;
}

/** A stable cursor across pinned and chronological order, scoped to one membership. */
export type MembershipAnnouncementCursor = {
  isPinned: boolean;
  createdAt: Date;
  id: string;
};

export async function listVisibleAnnouncementsForMembership(
  context: RequestContext,
  now = new Date(),
  options?: { limit?: number; before?: MembershipAnnouncementCursor },
) {
  if (!canAccessAnnouncements(context.user.platformStatus) || !context.membership || context.membership.status !== "ACTIVE") {
    return [];
  }
  const membership = context.membership;
  const receiverConditions: SQL[] = [
    and(
      eq(db10Announcements.receiverType, "COLLEGE"),
      eq(db10Announcements.receiverId, membership.collegeId),
    )!,
  ];

  if (membership.roles.includes("LEARNER")) {
    receiverConditions.push(and(
      eq(db10Announcements.receiverType, "LEARNER"),
      eq(db10Announcements.receiverId, membership.id),
    )!);
    const enrollments = await getDb()
      .select({
        programId: learnerProgramEnrollments.programId,
        departmentId: programs.departmentId,
        sectionId: sectionEnrollments.sectionId,
      })
      .from(learnerProgramEnrollments)
      .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
      .leftJoin(
        sectionEnrollments,
        and(
          eq(sectionEnrollments.learnerEnrollmentId, learnerProgramEnrollments.id),
          eq(sectionEnrollments.status, "ACTIVE"),
        ),
      )
      .where(and(
        eq(learnerProgramEnrollments.membershipId, membership.id),
        eq(learnerProgramEnrollments.status, "ACTIVE"),
      ));
    for (const row of enrollments) {
      receiverConditions.push(and(
        eq(db10Announcements.receiverType, "DEPARTMENT"),
        eq(db10Announcements.receiverId, row.departmentId),
      )!);
      receiverConditions.push(and(
        eq(db10Announcements.receiverType, "PROGRAM"),
        eq(db10Announcements.receiverId, row.programId),
      )!);
      if (row.sectionId) receiverConditions.push(and(
        eq(db10Announcements.receiverType, "CLASS"),
        eq(db10Announcements.receiverId, row.sectionId),
      )!);
    }
  }

  if (membership.roles.includes("FACULTY")) {
    receiverConditions.push(and(
      eq(db10Announcements.receiverType, "FACULTY"),
      eq(db10Announcements.receiverId, membership.id),
    )!);
    const [profile] = await getDb()
      .select({ departmentId: facultyProfiles.primaryDepartmentId })
      .from(facultyProfiles)
      .where(eq(facultyProfiles.membershipId, membership.id))
      .limit(1);
    if (profile?.departmentId) receiverConditions.push(and(
      eq(db10Announcements.receiverType, "DEPARTMENT"),
      eq(db10Announcements.receiverId, profile.departmentId),
    )!);
    const assigned = await getDb()
      .select({ sectionId: sectionFacultyAssignments.sectionId })
      .from(sectionFacultyAssignments)
      .where(and(
        eq(sectionFacultyAssignments.membershipId, membership.id),
        isNull(sectionFacultyAssignments.endedAt),
      ));
    for (const row of assigned) receiverConditions.push(and(
      eq(db10Announcements.receiverType, "CLASS"),
      eq(db10Announcements.receiverId, row.sectionId),
    )!);
  }

  const schemaCheck=await getDb().execute<{audiences:boolean;recipients:boolean}>(sql`
   select to_regclass('public.placement_tpo_notice_audiences') is not null as audiences,
    to_regclass('public.placement_tpo_notice_recipients') is not null as recipients`);
  if(schemaCheck.rows[0]?.audiences&&!schemaCheck.rows[0]?.recipients)return [];
  const targetedGuard=schemaCheck.rows[0]?.audiences?sql`
   (not exists(select 1 from placement_tpo_notice_audiences ta
      where ta.announcement_id=${db10Announcements.id})
    or exists(select 1 from placement_tpo_notice_recipients tr
      where tr.announcement_id=${db10Announcements.id}
       and tr.membership_id=${membership.id}::uuid))`:undefined;
  const before=options?.before;
  // Descending pinned, timestamp, UUID: preserve both page ordering and
  // a unique boundary even when many notices share the same createdAt.
  const cursorCondition=before?or(
    before.isPinned?eq(db10Announcements.isPinned,false):undefined,
    and(
      eq(db10Announcements.isPinned,before.isPinned),
      or(
        lt(db10Announcements.createdAt,before.createdAt),
        and(
          eq(db10Announcements.createdAt,before.createdAt),
          lt(db10Announcements.id,before.id),
        ),
      ),
    ),
  ):undefined;
  const requestedLimit=options?.limit;
  const limit=typeof requestedLimit==="number"&&Number.isInteger(requestedLimit)
    ?Math.min(101,Math.max(1,requestedLimit)):100;

  return getDb()
    .select()
    .from(db10Announcements)
    .where(and(
      targetedGuard,
      cursorCondition,
      eq(db10Announcements.collegeId, membership.collegeId),
      isNull(db10Announcements.deletedAt),
      or(isNull(db10Announcements.scheduledAt), lt(db10Announcements.scheduledAt, now), eq(db10Announcements.scheduledAt, now)),
      or(isNull(db10Announcements.expiresAt), gt(db10Announcements.expiresAt, now)),
      or(...receiverConditions)!,
    ))
    .orderBy(
      desc(db10Announcements.isPinned),
      desc(db10Announcements.createdAt),
      desc(db10Announcements.id),
    )
    .limit(limit);
}

/** Cursor-ready membership feed; page/route owner must expose Older notices. */
export async function listVisibleAnnouncementsForMembershipPage(
  context: RequestContext,
  now = new Date(),
  before?: MembershipAnnouncementCursor,
) {
  const rows=await listVisibleAnnouncementsForMembership(context,now,{limit:101,before});
  const items=rows.slice(0,100);
  const last=items[items.length-1];
  return {
    items,
    nextCursor:rows.length>100 && last
      ?{isPinned:last.isPinned,createdAt:last.createdAt,id:last.id}
      :null,
  };
}


export async function listAnnouncementTargetOptions(context: RequestContext) {
  if (!canAccessAnnouncements(context.user.platformStatus)) throw new AnnouncementError("FORBIDDEN");
  let collegeId: string | null = null;
  if (isSuperAdmin(context)) {
    collegeId = context.adminScope?.collegeId ?? null;
  } else if (hasMembershipRole(context, "COLLEGE_ADMIN") && context.membership) {
    collegeId = context.membership.collegeId;
  } else {
    throw new AnnouncementError("FORBIDDEN");
  }
  if (!collegeId) return null;

  const scope = await activeCollegeScope(collegeId);
  requireManage(context, scope);
  const db = getDb();

  const [collegeRows, departmentRows, programRows, classRows, facultyRows, learnerRows] =
    await Promise.all([
      db.select({ id: colleges.id, name: colleges.name })
        .from(colleges)
        .where(and(eq(colleges.id, collegeId), eq(colleges.status, "ACTIVE"))),
      db.select({ id: departments.id, name: departments.name })
        .from(departments)
        .where(and(eq(departments.collegeId, collegeId), isNull(departments.archivedAt))),
      db.select({ id: programs.id, name: programs.name, departmentName: departments.name })
        .from(programs)
        .innerJoin(departments, eq(departments.id, programs.departmentId))
        .where(and(
          eq(departments.collegeId, collegeId),
          isNull(departments.archivedAt),
          eq(programs.status, "ACTIVE"),
        )),
      db.select({ id: sections.id, name: sections.name, programName: programs.name })
        .from(sections)
        .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
        .innerJoin(programs, eq(programs.id, cohorts.programId))
        .innerJoin(departments, eq(departments.id, programs.departmentId))
        .where(and(
          eq(departments.collegeId, collegeId),
          eq(sections.status, "ACTIVE"),
          isNull(departments.archivedAt),
        )),
      db.select({
        id: collegeMemberships.id,
        displayName: users.displayName,
        email: users.email,
      })
        .from(collegeMemberships)
        .innerJoin(users, eq(users.id, collegeMemberships.userId))
        .innerJoin(membershipRoles, eq(membershipRoles.membershipId, collegeMemberships.id))
        .where(and(
          eq(collegeMemberships.collegeId, collegeId),
          eq(collegeMemberships.status, "ACTIVE"),
          eq(membershipRoles.role, "FACULTY"),
        )),
      db.select({
        id: collegeMemberships.id,
        displayName: users.displayName,
        email: users.email,
      })
        .from(collegeMemberships)
        .innerJoin(users, eq(users.id, collegeMemberships.userId))
        .innerJoin(membershipRoles, eq(membershipRoles.membershipId, collegeMemberships.id))
        .where(and(
          eq(collegeMemberships.collegeId, collegeId),
          eq(collegeMemberships.status, "ACTIVE"),
          eq(membershipRoles.role, "LEARNER"),
        )),
    ]);

  return {
    college: collegeRows.map((row) => ({ type: "COLLEGE" as const, id: row.id, label: row.name })),
    departments: departmentRows.map((row) => ({
      type: "DEPARTMENT" as const, id: row.id, label: row.name,
    })),
    programs: programRows.map((row) => ({
      type: "PROGRAM" as const, id: row.id,
      label: `${row.name} · ${row.departmentName}`,
    })),
    classes: classRows.map((row) => ({
      type: "CLASS" as const, id: row.id,
      label: `${row.name} · ${row.programName}`,
    })),
    faculty: facultyRows.map((row) => ({
      type: "FACULTY" as const, id: row.id,
      label: row.displayName || row.email || "Unnamed faculty",
    })),
    learners: learnerRows.map((row) => ({
      type: "LEARNER" as const, id: row.id,
      label: row.displayName || row.email || "Unnamed learner",
    })),
  };
}
