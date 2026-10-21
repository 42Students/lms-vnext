import "server-only";

import { and, eq, isNull, ne, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { colleges, lmsGroupMembers, lmsGroups } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { hasMembershipRole,isSuperAdmin } from "@/modules/identity/context";
import { can, requirePermission, AuthorizationError } from "@/modules/permissions/policy";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { assertPersistedGroupActor, GroupActorAccessError } from "./actor-access";
import {
  collegeGroupIdSchema,
  collegeStudyGroupChangeSchema,
  collegeStudyGroupCreateSchema,
  studyGroupNextStatus,
} from "./college-group-management-model";

export class CollegeGroupManagementError extends Error {
  constructor(public readonly code: string, message?: string) {
    super(message??code);
    this.name = "CollegeGroupManagementError";
  }
}

function ownCollege(context: RequestContext) {
  if(isSuperAdmin(context)){
    const scope=context.adminScope;
    if(!scope?.collegeId)throw new AuthorizationError("academics.manage");
    requirePermission(context,"academics.manage",{collegeId:scope.collegeId,organizationId:scope.organizationId??undefined});
    return {collegeId:scope.collegeId,organizationId:scope.organizationId??""};
  }
  const member = context.membership;
  if (!member || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
    !can(context, "academics.manage", {
      collegeId: member.collegeId,
      organizationId: member.organizationId,
    })) throw new AuthorizationError("academics.manage");
  requirePermission(context, "academics.manage", {
    collegeId: member.collegeId,
    organizationId: member.organizationId,
  });
  return member;
}

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

async function lockCollege(tx: Tx, context: RequestContext, collegeId: string, organizationId: string) {
  const [college] = await tx.select({
    id: colleges.id,
    organizationId: colleges.organizationId,
  }).from(colleges).where(eq(colleges.id, collegeId)).for("update");
  if (!college || college.organizationId !== organizationId) {
    throw new CollegeGroupManagementError("GROUP_NOT_FOUND");
  }
  try {
    await assertPersistedGroupActor(tx, context, { collegeId, mode: "MANUAL" });
  } catch (error) {
    if (error instanceof GroupActorAccessError) throw new AuthorizationError("academics.manage");
    throw error;
  }
}

async function ensureUniqueName(tx: Tx, collegeId: string, name: string, excludeId?: string) {
  const [duplicate] = await tx.select({ id: lmsGroups.id }).from(lmsGroups)
    .where(and(
      eq(lmsGroups.collegeId, collegeId),
      eq(lmsGroups.ownerScope, "COLLEGE"),
      eq(lmsGroups.kind, "STUDY_GROUP"),
      isNull(lmsGroups.deletedAt),
      excludeId ? ne(lmsGroups.id, excludeId) : undefined,
      sql`lower(btrim(${lmsGroups.name})) = lower(${name})`,
    )).limit(1);
  if (duplicate) throw new CollegeGroupManagementError("GROUP_NAME_TAKEN");
}

async function auditGroup(
  tx: Tx, context: RequestContext, collegeId: string, organizationId: string,
  group: { id: string; name: string }, eventType:
    | typeof ACTIVITY_EVENT_TYPES.ACADEMICS_GROUP_CREATED
    | typeof ACTIVITY_EVENT_TYPES.ACADEMICS_GROUP_UPDATED
    | typeof ACTIVITY_EVENT_TYPES.ACADEMICS_GROUP_STATUS_CHANGED,
  before: Record<string, unknown> | null,
  after: Record<string, unknown>,
) {
  await recordActivityEventInTransaction(tx, context, {
    eventType,
    collegeId,
    organizationId,
    subjectType: "lms_group",
    subjectId: group.id,
    subjectLabel: group.name,
    summary: `Study group ${group.name} updated`,
    metadata: { before, after },
  });
}

export async function createCollegeStudyGroup(context: RequestContext, raw: unknown) {
  const input = collegeStudyGroupCreateSchema.parse(raw);
  const member = ownCollege(context);
  return getDb().transaction(async (tx) => {
    await lockCollege(tx, context, member.collegeId, member.organizationId);
    await ensureUniqueName(tx, member.collegeId, input.name);
    const [created] = await tx.insert(lmsGroups).values({
      kind: "STUDY_GROUP",
      ownerScope: "COLLEGE",
      collegeId: member.collegeId,
      name: input.name,
      description: input.description || null,
      capacity: input.capacity,
      status: "DRAFT",
      createdByUserId: context.user.id,
      createdByType: isSuperAdmin(context) ? "SUPER_ADMIN" : "COLLEGE_ADMIN",
      configJson: {},
    }).returning();
    if (!created) throw new CollegeGroupManagementError("GROUP_NOT_FOUND");
    await auditGroup(tx, context, member.collegeId, member.organizationId, created,
      ACTIVITY_EVENT_TYPES.ACADEMICS_GROUP_CREATED, null,
      { name: created.name, status: created.status, capacity: created.capacity });
    return created;
  });
}

export async function changeCollegeStudyGroup(context: RequestContext, groupIdRaw: unknown, raw: unknown) {
  const groupId = collegeGroupIdSchema.parse(groupIdRaw);
  const input = collegeStudyGroupChangeSchema.parse(raw);
  const member = ownCollege(context);
  return getDb().transaction(async (tx) => {
    await lockCollege(tx, context, member.collegeId, member.organizationId);
    const [group] = await tx.select().from(lmsGroups)
      .where(and(
        eq(lmsGroups.id, groupId),
        eq(lmsGroups.collegeId, member.collegeId),
        isNull(lmsGroups.deletedAt),
      )).for("update");
    if (!group) throw new CollegeGroupManagementError("GROUP_NOT_FOUND");
    if(group.kind==="ELECTIVE")
      throw new CollegeGroupManagementError("GROUP_FEATURE_OWNER_REQUIRED",
        "Elective groups are managed from the Electives page");
    if(group.kind==="PROJECT_TEAM")
      throw new CollegeGroupManagementError("GROUP_FEATURE_OWNER_REQUIRED",
        "Project team groups are managed from the project's Team tab");
    if(group.ownerScope!=="COLLEGE" || group.kind!=="STUDY_GROUP")
      throw new CollegeGroupManagementError("GROUP_NOT_FOUND");
    if (group.version !== input.expectedVersion) throw new CollegeGroupManagementError("GROUP_STALE");
    const before = {
      name: group.name, description: group.description,
      capacity: group.capacity, status: group.status, version: group.version,
    };
    let changes: Partial<typeof lmsGroups.$inferInsert>;
    let eventType:
      | typeof ACTIVITY_EVENT_TYPES.ACADEMICS_GROUP_UPDATED
      | typeof ACTIVITY_EVENT_TYPES.ACADEMICS_GROUP_STATUS_CHANGED;

    if (input.action === "EDIT") {
      if (group.status === "ARCHIVED") throw new CollegeGroupManagementError("GROUP_NOT_MANAGEABLE");
      if (input.capacity !== null && input.capacity < group.activeCount) {
        throw new CollegeGroupManagementError("GROUP_HAS_MEMBERS");
      }
      await ensureUniqueName(tx, member.collegeId, input.name, group.id);
      changes = { name: input.name, description: input.description || null, capacity: input.capacity };
      eventType = ACTIVITY_EVENT_TYPES.ACADEMICS_GROUP_UPDATED;
    } else {
      const [openCounts] = await tx.select({
        total: sql<number>`count(*)::int`,
      }).from(lmsGroupMembers).where(and(
        eq(lmsGroupMembers.groupId, group.id),
        sql`${lmsGroupMembers.state} in ('ACTIVE','WAITLISTED','REQUESTED')`,
      ));
      const next = studyGroupNextStatus(group.status, input.transition, group.activeCount, openCounts?.total ?? 0);
      if (!next) throw new CollegeGroupManagementError("GROUP_TRANSITION_INVALID");
      changes = { status: next };
      eventType = ACTIVITY_EVENT_TYPES.ACADEMICS_GROUP_STATUS_CHANGED;
    }

    const [updated] = await tx.update(lmsGroups).set({
      ...changes,
      version: sql`${lmsGroups.version} + 1`,
      updatedAt: new Date(),
    }).where(and(
      eq(lmsGroups.id, group.id),
      eq(lmsGroups.version, input.expectedVersion),
    )).returning();
    if (!updated) throw new CollegeGroupManagementError("GROUP_STALE");
    await auditGroup(tx, context, member.collegeId, member.organizationId, updated,
      eventType, before, {
        name: updated.name, description: updated.description,
        capacity: updated.capacity, status: updated.status, version: updated.version,
      });
    return updated;
  });
}

/** Non-mutating counter reconciliation diagnostic. Legacy reconcile would
 * overwrite cached counts; vNext never silently repairs a live group behind
 * pending membership writes. Review this discrepancy before any explicit
 * versioned repair. ELECTIVE/PROJECT_TEAM remain owned by their modules. */
export async function inspectCollegeStudyGroupCounts(context:RequestContext,groupIdRaw:unknown){
 const groupId=collegeGroupIdSchema.parse(groupIdRaw);
 const member=ownCollege(context);
 return getDb().transaction(async tx=>{
  await lockCollege(tx,context,member.collegeId,member.organizationId);
  const [group]=await tx.select({
   id:lmsGroups.id,kind:lmsGroups.kind,ownerScope:lmsGroups.ownerScope,
   activeCount:lmsGroups.activeCount,status:lmsGroups.status,version:lmsGroups.version,
  }).from(lmsGroups).where(and(eq(lmsGroups.id,groupId),
   eq(lmsGroups.collegeId,member.collegeId),isNull(lmsGroups.deletedAt))).limit(1);
  if(!group||group.kind!=="STUDY_GROUP"||group.ownerScope!=="COLLEGE")
   throw new CollegeGroupManagementError("GROUP_NOT_FOUND");
  const [totals]=await tx.select({actual:sql<number>`count(*)::int`})
   .from(lmsGroupMembers).where(and(eq(lmsGroupMembers.groupId,group.id),
    eq(lmsGroupMembers.state,"ACTIVE")));
  const actual=Number(totals?.actual??0);
  return {groupId,status:group.status,version:group.version,
    stored:group.activeCount,actual,hasDrift:group.activeCount!==actual,
    nextAction:group.activeCount===actual?"NONE":"REVIEW_MEMBERSHIP_RECEIPTS"};
 });
}
