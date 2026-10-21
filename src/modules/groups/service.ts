import { and, asc, count, eq, inArray, isNull, max, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  collegeMemberships, electiveOfferings, electiveSlots,
  learnerProfiles, learnerProgramEnrollments, sectionEnrollments, sections,
  lmsGroupMemberEvents, lmsGroupMembers, lmsGroups, membershipRoles, users,
  projectInstances, projectMembers,
} from "@/db/schema";
import { hasActiveMembership, isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { hasElectiveAcademicEligibility } from "./elective-eligibility";
import { assertPersistedGroupActor } from "./actor-access";

const uuid = z.string().uuid();
const groupCreate = z.object({
  collegeId: uuid.nullable(),
  kind: z.string().trim().regex(/^[A-Z][A-Z0-9_]{0,39}$/),
  name: z.string().trim().min(1).max(150),
  description: z.string().max(1000).nullish(),
  capacity: z.number().int().positive().nullable().optional(),
  selfJoinOpenFrom: z.coerce.date().nullable().optional(),
  selfJoinOpenUntil: z.coerce.date().nullable().optional(),
  academicYear: z.string().max(20).nullable().optional(),
  semesterNumber: z.number().int().min(1).max(24).nullable().optional(),
  configJson: z.record(z.string(), z.unknown()).default({}),
});
const supportedMode = z.enum(["SELF", "MANUAL"]);

export class GroupServiceError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "GroupServiceError";
  }
}

type Client = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Client["transaction"]>[0]>[0];
type GroupRow = typeof lmsGroups.$inferSelect;

function actorType(context: RequestContext) {
  if (isSuperAdmin(context)) return "SUPER_ADMIN" as const;
  if (context.membership?.roles.includes("COLLEGE_ADMIN")) return "COLLEGE_ADMIN" as const;
  if (context.membership?.roles.includes("FACULTY")) return "FACULTY" as const;
  return "LEARNER" as const;
}
function assertScope(context: RequestContext, group: GroupRow, mode: "SELF" | "MANUAL", memberId: string) {
  if (mode === "SELF") {
    if (
      !hasActiveMembership(context) ||
      !context.membership?.roles.includes("LEARNER") ||
      context.membership.id !== memberId ||
      (group.ownerScope === "COLLEGE" &&
        (group.collegeId === null || context.membership.collegeId !== group.collegeId))
    ) throw new GroupServiceError("GROUP_SELF_ACCESS_DENIED");
    return;
  }
  if (group.ownerScope === "PLATFORM") {
    if (!isSuperAdmin(context) || context.adminScope?.collegeId || context.adminScope?.organizationId)
      throw new GroupServiceError("GROUP_PLATFORM_ACCESS_DENIED");
    return;
  }
  if (!group.collegeId) throw new GroupServiceError("GROUP_SCOPE_INVALID");
  requirePermission(context, "academics.manage", { collegeId: group.collegeId });
}
function assertSelfWindow(group: GroupRow, now: Date) {
  if (group.status !== "ACTIVE") throw new GroupServiceError("GROUP_NOT_ACTIVE");
  if (!group.selfJoinOpenFrom || now < group.selfJoinOpenFrom ||
      (group.selfJoinOpenUntil && now > group.selfJoinOpenUntil))
    throw new GroupServiceError("GROUP_SELF_JOIN_CLOSED");
}
/** Platform-open groups still require an active, persisted learner identity,
 * but must not invent a platform-wide membership or bypass the role switcher.
 */
async function assertGroupMemberActor(
 tx:Tx, context:RequestContext, group:GroupRow,
 mode:"SELF"|"MANUAL", memberId:string,
) {
 if(mode!=="SELF" || group.ownerScope!=="PLATFORM") {
  return assertPersistedGroupActor(tx,context,{
   collegeId:group.collegeId,mode,memberId,
  });
 }
 const member=context.membership;
 if(!member || member.id!==memberId ||
    !member.roles.includes("LEARNER") || context.user.platformStatus!=="ACTIVE")
  throw new GroupServiceError("GROUP_SELF_ACCESS_DENIED");
 const [current]=await tx.select({id:collegeMemberships.id})
  .from(collegeMemberships)
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),
   eq(users.platformStatus,"ACTIVE"),eq(users.id,context.user.id)))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"LEARNER")))
  .where(and(eq(collegeMemberships.id,memberId),
   eq(collegeMemberships.collegeId,member.collegeId),
   eq(collegeMemberships.status,"ACTIVE")))
  .for("share",{of:collegeMemberships}).limit(1);
 if(!current)throw new GroupServiceError("GROUP_SELF_ACCESS_DENIED");
}

export const GROUP_SELF_ACCESS_MESSAGE = "Learners only";

async function lockGroup(tx: Tx, groupId: string) {
  const [row] = await tx.select().from(lmsGroups).where(eq(lmsGroups.id, groupId)).for("update");
  if (!row || row.deletedAt || row.status === "ARCHIVED") throw new GroupServiceError("GROUP_NOT_FOUND");
  return row;
}
async function assertTargetMembership(tx: Tx, group: GroupRow, memberId: string) {
  const [m] = await tx.select({
    id: collegeMemberships.id,
    collegeId: collegeMemberships.collegeId,
    status: collegeMemberships.status,
    platformStatus: users.platformStatus,
  }).from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .where(eq(collegeMemberships.id, memberId)).limit(1);
  if (!m || m.status !== "ACTIVE" || m.platformStatus !== "ACTIVE")
    throw new GroupServiceError("GROUP_MEMBER_INACTIVE");
  if (group.ownerScope === "COLLEGE" && m.collegeId !== group.collegeId)
    throw new GroupServiceError("GROUP_MEMBER_COLLEGE_MISMATCH");
  const [learnerRole] = await tx.select({ role: membershipRoles.role })
    .from(membershipRoles)
    .where(and(eq(membershipRoles.membershipId, memberId), eq(membershipRoles.role, "LEARNER"))).limit(1);
  if (!learnerRole) throw new GroupServiceError("GROUP_LEARNER_ROLE_REQUIRED");
}
async function lockElectiveSlot(tx: Tx, groupId: string) {
  // Order matters: the slot is locked BEFORE the group. Different offering
  // groups in the same slot must serialize on one shared row.
  const [offering] = await tx.select({
    slotId: electiveOfferings.slotId,
  }).from(electiveOfferings)
    .where(and(eq(electiveOfferings.groupId, groupId),
      eq(electiveOfferings.status, "ACTIVE"),
      isNull(electiveOfferings.deletedAt))).limit(1);
  if (!offering) return null;
  const [slot] = await tx.select().from(electiveSlots)
    .where(eq(electiveSlots.id, offering.slotId)).for("update");
  if (!slot || slot.status !== "ACTIVE" || slot.deletedAt)
    throw new GroupServiceError("ELECTIVE_SLOT_NOT_ACTIVE");
  return slot;
}
async function assertElectivePickLimit(tx: Tx, slot: NonNullable<Awaited<ReturnType<typeof lockElectiveSlot>>>, memberId: string) {
  const [row] = await tx.select({ used: count() })
    .from(lmsGroupMembers)
    .innerJoin(electiveOfferings, eq(electiveOfferings.groupId, lmsGroupMembers.groupId))
    .where(and(
      eq(electiveOfferings.slotId, slot.id),
      eq(electiveOfferings.status, "ACTIVE"),
      isNull(electiveOfferings.deletedAt),
      eq(lmsGroupMembers.membershipId, memberId),
      inArray(lmsGroupMembers.state, ["ACTIVE", "WAITLISTED"]),
    ));
  if ((row?.used ?? 0) >= slot.maxPick) throw new GroupServiceError("ELECTIVE_MAX_PICK_REACHED");
}
async function emitEvent(tx: Tx, args: {
  groupId: string; membershipId: string; fromState: string | null;
  toState: "ACTIVE" | "WAITLISTED" | "REMOVED"; source: "SELF" | "MANUAL" | "RULE" | "CSV";
  context: RequestContext; reason?: string; systemActor?: boolean;
}) {
  await tx.insert(lmsGroupMemberEvents).values({
    groupId: args.groupId,
    membershipId: args.membershipId,
    fromState: args.fromState,
    toState: args.toState,
    source: args.source,
    memberType: "LEARNER",
    actorType: args.systemActor ? "SYSTEM" : args.source === "SELF" ? "LEARNER" : actorType(args.context),
    actorUserId: args.systemActor ? null : args.context.user.id,
    reason: args.reason ?? null,
  });
}


async function mirrorProjectTeamMember(
  tx: Tx, group: GroupRow, memberId: string, active: boolean, userId: string,
) {
  if (group.kind !== "PROJECT_TEAM") return;
  const [project] = await tx.select({
    id: projectInstances.id,
    collegeId: projectInstances.collegeId,
    status: projectInstances.status,
  }).from(projectInstances)
    .where(eq(projectInstances.teamGroupId, group.id)).limit(1);
  if (!project || project.collegeId !== group.collegeId || project.status === "ARCHIVED")
    throw new GroupServiceError("PROJECT_TEAM_LINK_INVALID");
  const [existing] = await tx.select().from(projectMembers)
    .where(and(eq(projectMembers.projectId, project.id),
      eq(projectMembers.membershipId, memberId), isNull(projectMembers.endedAt)))
    .limit(1);
  if (active) {
    if (existing) {
      if (existing.role !== "LEARNER")
        throw new GroupServiceError("PROJECT_TEAM_MEMBER_ROLE_CONFLICT");
      return;
    }
    await tx.insert(projectMembers).values({
      projectId: project.id, membershipId: memberId,
      role: "LEARNER", roleKind: "LEARNER", canMutate: true, isPrimary: false, createdByUserId: userId,
    });
  } else {
    if (!existing || existing.role !== "LEARNER")
      throw new GroupServiceError("PROJECT_TEAM_MIRROR_INCONSISTENT");
    await tx.update(projectMembers).set({
      endedAt: new Date(), isPrimary: false, updatedAt: new Date(),
    }).where(eq(projectMembers.id, existing.id));
  }
}

export async function createGroup(context: RequestContext, raw: unknown) {
  const input = groupCreate.parse(raw);
  if (input.collegeId === null) {
    if (!isSuperAdmin(context) || context.adminScope?.collegeId || context.adminScope?.organizationId)
      throw new GroupServiceError("GROUP_PLATFORM_ACCESS_DENIED");
  } else {
    requirePermission(context, "academics.manage", { collegeId: input.collegeId });
  }
  if (input.selfJoinOpenUntil && !input.selfJoinOpenFrom)
    throw new GroupServiceError("GROUP_JOIN_WINDOW_INVALID");
  if (input.selfJoinOpenUntil && input.selfJoinOpenFrom &&
      input.selfJoinOpenUntil < input.selfJoinOpenFrom)
    throw new GroupServiceError("GROUP_JOIN_WINDOW_INVALID");
  return getDb().transaction(async tx => {
    await assertPersistedGroupActor(tx, context, {collegeId: input.collegeId, mode: "MANUAL"});
    const [created] = await tx.insert(lmsGroups).values({
    ownerScope: input.collegeId ? "COLLEGE" : "PLATFORM",
    collegeId: input.collegeId,
    kind: input.kind, name: input.name, description: input.description ?? null,
    capacity: input.capacity ?? null,
    selfJoinOpenFrom: input.selfJoinOpenFrom ?? null,
    selfJoinOpenUntil: input.selfJoinOpenUntil ?? null,
    academicYear: input.academicYear ?? null,
    semesterNumber: input.semesterNumber ?? null,
    configJson: input.configJson,
    createdByUserId: context.user.id,
    createdByType: actorType(context),
  }).returning();
    if(!created)throw new GroupServiceError("GROUP_CREATE_FAILED");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_GROUP_CREATED,
      collegeId:created.collegeId??undefined,
      subjectType:"lms_group",subjectId:created.id,subjectLabel:created.name,
      summary:"Group "+created.name+" created",
      metadata:{groupId:created.id,kind:created.kind,ownerScope:created.ownerScope,
        status:created.status,capacity:created.capacity},
      groupKey:"academics:group:"+created.id,
      dedupeKey:"academics:group:"+created.id+":created",
    });
    return created;
  });
}

export async function joinGroup(
  context: RequestContext,
  groupIdInput: string,
  memberIdInput: string,
  requestedMode: "SELF" | "MANUAL" = "SELF",
  requireStudyGroup = false,
  importSource: "MANUAL" | "CSV" = "MANUAL",
  importNote?:string,
) {
  const groupId = uuid.parse(groupIdInput);
  const memberId = uuid.parse(memberIdInput);
  const mode = supportedMode.parse(requestedMode);
  return getDb().transaction(async tx => {
    const slot = await lockElectiveSlot(tx, groupId);
    const group = await lockGroup(tx, groupId);
    if (requireStudyGroup && (group.kind !== "STUDY_GROUP" || group.ownerScope !== "COLLEGE"))
      throw new GroupServiceError("GROUP_NOT_MANAGEABLE");
    assertScope(context, group, mode, memberId);
    await assertGroupMemberActor(tx,context,group,mode,memberId);
    await assertTargetMembership(tx, group, memberId);
    // An ELECTIVE group without a currently active offering must not be
    // joined directly to bypass the shared slot's max_pick guard.
    if (group.kind === "ELECTIVE" && !slot)
      throw new GroupServiceError("ELECTIVE_OFFERING_NOT_ACTIVE");
    if (mode === "SELF") assertSelfWindow(group, new Date());
    else if (!["DRAFT", "ACTIVE"].includes(group.status))
      throw new GroupServiceError("GROUP_NOT_MUTABLE");
    // Elective eligibility must be rechecked even for an existing membership:
    // a current ACTIVE/WAITLISTED row can become stale after a program transfer.
    if (slot) {
      if (group.kind !== "ELECTIVE" || group.collegeId !== slot.collegeId)
        throw new GroupServiceError("ELECTIVE_GROUP_SCOPE_MISMATCH");
      if (!(await hasElectiveAcademicEligibility(tx, slot, memberId)))
        throw new GroupServiceError("ELECTIVE_PRIMARY_SECTION_REQUIRED");
    }
    const [existing] = await tx.select().from(lmsGroupMembers)
      .where(and(eq(lmsGroupMembers.groupId, groupId), eq(lmsGroupMembers.membershipId, memberId))).limit(1);
    if (existing?.state === "ACTIVE" || existing?.state === "WAITLISTED") return existing;
    // Legacy kernel: a locked REMOVED row blocks self-service only. An explicit
    // admin re-add may override the block, but the lock itself remains preserved.
    if (existing?.isLocked && existing.state === "REMOVED" && mode === "SELF")
      throw new GroupServiceError("GROUP_MEMBERSHIP_LOCKED");
    if (slot) await assertElectivePickLimit(tx, slot, memberId);
    const available = group.capacity === null || group.activeCount < group.capacity;
    // Legacy configFlag(..., true): absent/non-boolean configuration keeps
    // waitlisting enabled. Only an explicit boolean false disables it.
    const allowWaitlist = group.configJson.allowWaitlist !== false;
    if (!available && !allowWaitlist) throw new GroupServiceError("GROUP_CAPACITY_REACHED");
    const newState = available ? "ACTIVE" : "WAITLISTED";
    let waitlistPosition: number | null = null;
    if (newState === "WAITLISTED") {
      const [last] = await tx.select({ position: max(lmsGroupMembers.waitlistPosition) })
        .from(lmsGroupMembers).where(and(eq(lmsGroupMembers.groupId, groupId), eq(lmsGroupMembers.state, "WAITLISTED")));
      waitlistPosition = (last?.position ?? 0) + 1;
    }
    const patch = {
      state: newState, source: mode === "SELF" ? "SELF" : importSource, isLocked: existing?.isLocked ?? false,
      waitlistPosition, joinedAt: available ? new Date() : null,
      updatedAt: new Date(),
    } as const;
    const [saved] = existing
      ? await tx.update(lmsGroupMembers)
          .set({ ...patch, version: sql.raw('"version" + 1') })
          .where(eq(lmsGroupMembers.id, existing.id)).returning()
      : await tx.insert(lmsGroupMembers)
          .values({ groupId, membershipId: memberId, ...patch }).returning();
    if (available) await mirrorProjectTeamMember(tx, group, memberId, true, context.user.id);
    if (available) await tx.update(lmsGroups)
      .set({ activeCount: sql.raw('"active_count" + 1'), version: sql.raw('"version" + 1'), updatedAt: new Date() })
      .where(eq(lmsGroups.id, groupId));
    await emitEvent(tx, {
      groupId, membershipId: memberId, fromState: existing?.state ?? null,
      toState: newState, source: mode === "SELF" ? "SELF" : importSource, context,
      reason:importNote,
    });
    return saved!;
  });
}

/**
 * Called while holding the elective slot (when present) and the group lock.
 * Never promote a suspended account or an academically ineligible elective.
 */
async function promoteEligibleWaitlist(
  tx: Tx, group: GroupRow,
  slot: Awaited<ReturnType<typeof lockElectiveSlot>>,
  context: RequestContext, now: Date,
) {
  const candidates = await tx.select({
    id: lmsGroupMembers.id,
    membershipId: lmsGroupMembers.membershipId,
    source: lmsGroupMembers.source,
  }).from(lmsGroupMembers)
    .innerJoin(collegeMemberships, and(
      eq(collegeMemberships.id, lmsGroupMembers.membershipId),
      eq(collegeMemberships.status, "ACTIVE"),
    ))
    .innerJoin(users, and(
      eq(users.id, collegeMemberships.userId),
      eq(users.platformStatus, "ACTIVE"),
    ))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .where(and(
      eq(lmsGroupMembers.groupId, group.id),
      eq(lmsGroupMembers.state, "WAITLISTED"),
      group.collegeId ? eq(collegeMemberships.collegeId, group.collegeId) : undefined,
    ))
    .orderBy(asc(lmsGroupMembers.waitlistPosition), asc(lmsGroupMembers.createdAt));
  for (const candidate of candidates) {
    if (slot && !(await hasElectiveAcademicEligibility(tx, slot, candidate.membershipId)))
      continue;
    await tx.update(lmsGroupMembers).set({
      state: "ACTIVE", waitlistPosition: null, joinedAt: now,
      updatedAt: now, version: sql.raw('"version" + 1'),
    }).where(eq(lmsGroupMembers.id, candidate.id));
    await mirrorProjectTeamMember(tx, group, candidate.membershipId, true, context.user.id);
    await tx.update(lmsGroups).set({
      activeCount: sql.raw('"active_count" + 1'),
      version: sql.raw('"version" + 1'), updatedAt: now,
    }).where(eq(lmsGroups.id, group.id));
    await emitEvent(tx, {
      groupId: group.id, membershipId: candidate.membershipId,
      fromState: "WAITLISTED", toState: "ACTIVE",
      source: candidate.source as "SELF" | "MANUAL" | "RULE" | "CSV",
      context, reason: "WAITLIST_PROMOTION", systemActor: true,
    });
    break;
  }
}

export async function leaveGroup(
  context: RequestContext,
  groupIdInput: string,
  memberIdInput: string,
  requestedMode: "SELF" | "MANUAL" = "SELF",
  requireStudyGroup = false,
) {
  const groupId = uuid.parse(groupIdInput), memberId = uuid.parse(memberIdInput);
  const mode = supportedMode.parse(requestedMode);
  return getDb().transaction(async tx => {
    const slot = await lockElectiveSlot(tx, groupId);
    const group = await lockGroup(tx, groupId);
    if (requireStudyGroup && (group.kind !== "STUDY_GROUP" || group.ownerScope !== "COLLEGE"))
      throw new GroupServiceError("GROUP_NOT_MANAGEABLE");
    assertScope(context, group, mode, memberId);
    await assertGroupMemberActor(tx,context,group,mode,memberId);
    // Legacy configFlag(..., true): self-leave is enabled unless explicitly false.
    if (mode === "SELF" && group.configJson.allowSelfLeave === false)
      throw new GroupServiceError("GROUP_SELF_LEAVE_DISABLED");
    const [member] = await tx.select().from(lmsGroupMembers)
      .where(and(eq(lmsGroupMembers.groupId, groupId), eq(lmsGroupMembers.membershipId, memberId))).limit(1);
    if (!member) throw new GroupServiceError("GROUP_MEMBER_NOT_FOUND");
    if (member.state === "REMOVED") return member;
    if (member.isLocked && mode === "SELF")
      throw new GroupServiceError("GROUP_MEMBERSHIP_LOCKED");
    if (!["ACTIVE", "WAITLISTED", "REQUESTED"].includes(member.state))
      throw new GroupServiceError("GROUP_MEMBER_STATE_INVALID");
    const now = new Date();
    const [removed] = await tx.update(lmsGroupMembers).set({
      state: "REMOVED", waitlistPosition: null, updatedAt: now,
      version: sql.raw('"version" + 1'),
    }).where(eq(lmsGroupMembers.id, member.id)).returning();
    await emitEvent(tx, {
      groupId, membershipId: memberId, fromState: member.state,
      toState: "REMOVED", source: mode, context,
    });
    if (member.state === "ACTIVE") {
      await mirrorProjectTeamMember(tx, group, memberId, false, context.user.id);
      await tx.update(lmsGroups).set({
        activeCount: sql.raw('"active_count" - 1'),
        version: sql.raw('"version" + 1'), updatedAt: now,
      }).where(eq(lmsGroups.id, groupId));
      if (group.status === "ACTIVE")
        await promoteEligibleWaitlist(tx, group, slot, context, now);
    }
    return removed!;
  });
}


const groupTransition = z.enum(["ACTIVATE", "CLOSE", "ARCHIVE"]);
/** Lifecycle transitions require management permissions and serialize on the group row. */
export async function transitionGroup(context: RequestContext, groupIdInput: string, raw: unknown) {
  const groupId = uuid.parse(groupIdInput);
  const action = groupTransition.parse(raw);
  return getDb().transaction(async tx => {
    const group = await lockGroup(tx, groupId);
    assertScope(context, group, "MANUAL", group.createdByUserId);
    await assertPersistedGroupActor(tx, context, { collegeId: group.collegeId, mode: "MANUAL" });
    const next =
      action === "ACTIVATE" && ["DRAFT", "CLOSED"].includes(group.status) ? "ACTIVE" :
      action === "CLOSE" && group.status === "ACTIVE" ? "CLOSED" :
      action === "ARCHIVE" && ["DRAFT", "CLOSED"].includes(group.status) && group.activeCount === 0 ? "ARCHIVED" : null;
    if (!next) throw new GroupServiceError("GROUP_TRANSITION_INVALID");
    const [updated] = await tx.update(lmsGroups).set({
      status: next, version: sql.raw('"version" + 1'), updatedAt: new Date(),
    }).where(eq(lmsGroups.id, group.id)).returning();
    if(!updated)throw new GroupServiceError("GROUP_TRANSITION_INVALID");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_GROUP_STATUS_CHANGED,
      collegeId:group.collegeId??undefined,
      subjectType:"lms_group",subjectId:group.id,subjectLabel:group.name,
      summary:"Group "+group.name+" changed from "+group.status+" to "+next,
      metadata:{groupId:group.id,fromStatus:group.status,toStatus:next,
        previousVersion:group.version,version:updated.version},
      groupKey:"academics:group:"+group.id,
      dedupeKey:"academics:group:"+group.id+":status:"+updated.version,
    });
    return updated;
  });
}

/** Link only empty, same-college learner rosters; group remains source of truth. */
export async function attachProjectTeamGroup(context: RequestContext, projectIdInput: string, groupIdInput: string) {
  const projectId = uuid.parse(projectIdInput), groupId = uuid.parse(groupIdInput);
  return getDb().transaction(async tx => {
    const group = await lockGroup(tx, groupId);
    if (group.kind !== "PROJECT_TEAM" || group.ownerScope !== "COLLEGE" ||
      !group.collegeId || group.status !== "DRAFT" || group.activeCount !== 0)
      throw new GroupServiceError("PROJECT_TEAM_GROUP_NOT_ATTACHABLE");
    requirePermission(context, "projects.manage", { collegeId: group.collegeId });
    await assertPersistedGroupActor(tx, context, { collegeId: group.collegeId, mode: "MANUAL" });
    const [project] = await tx.select().from(projectInstances)
      .where(eq(projectInstances.id, projectId)).for("update");
    if (!project || project.collegeId !== group.collegeId ||
      project.teamGroupId || project.status === "ARCHIVED")
      throw new GroupServiceError("PROJECT_TEAM_PROJECT_NOT_ATTACHABLE");
    const [pm] = await tx.select({ total: count() }).from(projectMembers)
      .where(and(eq(projectMembers.projectId, project.id), isNull(projectMembers.endedAt)));
    const [gm] = await tx.select({ total: count() }).from(lmsGroupMembers)
      .where(eq(lmsGroupMembers.groupId, group.id));
    if ((pm?.total ?? 0) !== 0 || (gm?.total ?? 0) !== 0)
      throw new GroupServiceError("PROJECT_TEAM_ROSTER_NOT_EMPTY");
    const [updated] = await tx.update(projectInstances)
      .set({ teamGroupId: group.id, updatedAt: new Date() })
      .where(eq(projectInstances.id, project.id)).returning();
    if(!updated)throw new GroupServiceError("PROJECT_TEAM_PROJECT_NOT_ATTACHABLE");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_GROUP_UPDATED,
      collegeId:group.collegeId,
      subjectType:"lms_group",subjectId:group.id,subjectLabel:group.name,
      summary:"Project team group "+group.name+" linked to project",
      metadata:{groupId:group.id,projectId:updated.id,action:"ATTACH_PROJECT_TEAM"},
      groupKey:"academics:group:"+group.id,
      dedupeKey:"academics:group:"+group.id+":attached:"+updated.id,
    });
    return updated;
  });
}


/**
 * Admin-only atomic transfer between active offerings of the SAME elective
 * slot. The slot is locked first, then both groups in id order to avoid
 * deadlocks with join/leave. An invalid/full target rolls back the source.
 */
export async function moveElectiveMember(
  context: RequestContext,
  sourceOfferingIdInput: string,
  targetOfferingIdInput: string,
  membershipIdInput: string,
) {
  const sourceOfferingId = uuid.parse(sourceOfferingIdInput);
  const targetOfferingId = uuid.parse(targetOfferingIdInput);
  const memberId = uuid.parse(membershipIdInput);
  if (sourceOfferingId === targetOfferingId)
    throw new GroupServiceError("ELECTIVE_MOVE_SAME_OFFERING");
  return getDb().transaction(async tx => {
    const offeringRows = await tx.select().from(electiveOfferings)
      .where(inArray(electiveOfferings.id, [sourceOfferingId, targetOfferingId]));
    const fromOffering = offeringRows.find(o => o.id === sourceOfferingId);
    const toOffering = offeringRows.find(o => o.id === targetOfferingId);
    if (!fromOffering || !toOffering ||
        fromOffering.slotId !== toOffering.slotId ||
        fromOffering.deletedAt || toOffering.deletedAt ||
        fromOffering.status !== "ACTIVE" || toOffering.status !== "ACTIVE")
      throw new GroupServiceError("ELECTIVE_MOVE_OFFERINGS_INVALID");

    const [slot] = await tx.select().from(electiveSlots)
      .where(eq(electiveSlots.id, fromOffering.slotId)).for("update");
    if (!slot || slot.deletedAt || slot.status !== "ACTIVE")
      throw new GroupServiceError("ELECTIVE_SLOT_NOT_ACTIVE");

    const locked = await tx.select().from(lmsGroups)
      .where(inArray(lmsGroups.id, [fromOffering.groupId, toOffering.groupId]))
      .orderBy(asc(lmsGroups.id)).for("update");
    const fromGroup = locked.find(g => g.id === fromOffering.groupId);
    const toGroup = locked.find(g => g.id === toOffering.groupId);
    if (!fromGroup || !toGroup || fromGroup.id === toGroup.id ||
        fromGroup.kind !== "ELECTIVE" || toGroup.kind !== "ELECTIVE" ||
        fromGroup.ownerScope !== "COLLEGE" || toGroup.ownerScope !== "COLLEGE" ||
        fromGroup.collegeId !== slot.collegeId ||
        toGroup.collegeId !== slot.collegeId ||
        fromGroup.deletedAt || toGroup.deletedAt ||
        fromGroup.status !== "ACTIVE" || toGroup.status !== "ACTIVE")
      throw new GroupServiceError("ELECTIVE_MOVE_GROUPS_INVALID");

    assertScope(context, fromGroup, "MANUAL", memberId);
    await assertPersistedGroupActor(tx, context, { collegeId: fromGroup.collegeId, mode: "MANUAL" });
    await assertTargetMembership(tx, fromGroup, memberId);
    if (!(await hasElectiveAcademicEligibility(tx, slot, memberId)))
      throw new GroupServiceError("ELECTIVE_PRIMARY_SECTION_REQUIRED");
    const [sourceMember] = await tx.select().from(lmsGroupMembers)
      .where(and(
        eq(lmsGroupMembers.groupId, fromGroup.id),
        eq(lmsGroupMembers.membershipId, memberId),
      )).limit(1);
    if (!sourceMember || !["ACTIVE", "WAITLISTED"].includes(sourceMember.state))
      throw new GroupServiceError("ELECTIVE_MOVE_SOURCE_NOT_CURRENT");

    const [oldTarget] = await tx.select().from(lmsGroupMembers)
      .where(and(
        eq(lmsGroupMembers.groupId, toGroup.id),
        eq(lmsGroupMembers.membershipId, memberId),
      )).limit(1);
    if (oldTarget && ["ACTIVE", "WAITLISTED"].includes(oldTarget.state))
      throw new GroupServiceError("ELECTIVE_MOVE_TARGET_ALREADY_HELD");
    // This is an explicit admin transfer. Legacy admin add may revive a locked
    // REMOVED target membership and preserves the lock rather than rejecting it.

    const available = toGroup.capacity === null ||
      toGroup.activeCount < toGroup.capacity;
    if (!available && toGroup.configJson.allowWaitlist === false)
      throw new GroupServiceError("GROUP_CAPACITY_REACHED");
    const toState = available ? "ACTIVE" as const : "WAITLISTED" as const;
    let waitlistPosition: number | null = null;
    if (!available) {
      const [row] = await tx.select({ position: max(lmsGroupMembers.waitlistPosition) })
        .from(lmsGroupMembers)
        .where(and(eq(lmsGroupMembers.groupId, toGroup.id),
                   eq(lmsGroupMembers.state, "WAITLISTED")));
      waitlistPosition = (row?.position ?? 0) + 1;
    }
    const now = new Date();
    await tx.update(lmsGroupMembers).set({
      state: "REMOVED", waitlistPosition: null, updatedAt: now,
      version: sql.raw('"version" + 1'),
    }).where(eq(lmsGroupMembers.id, sourceMember.id));
    await emitEvent(tx, {
      groupId: fromGroup.id, membershipId: memberId,
      fromState: sourceMember.state, toState: "REMOVED",
      source: "MANUAL", context, reason: "ELECTIVE_MOVE_OUT",
    });
    const patch = {
      state: toState, source: "MANUAL" as const, isLocked: oldTarget?.isLocked ?? false,
      waitlistPosition, joinedAt: available ? now : null, updatedAt: now,
    };
    const [target] = oldTarget
      ? await tx.update(lmsGroupMembers).set({
          ...patch, version: sql.raw('"version" + 1'),
        }).where(eq(lmsGroupMembers.id, oldTarget.id)).returning()
      : await tx.insert(lmsGroupMembers).values({
          groupId: toGroup.id, membershipId: memberId, ...patch,
        }).returning();
    if (available) await tx.update(lmsGroups).set({
      activeCount: sql.raw('"active_count" + 1'),
      version: sql.raw('"version" + 1'), updatedAt: now,
    }).where(eq(lmsGroups.id, toGroup.id));
    await emitEvent(tx, {
      groupId: toGroup.id, membershipId: memberId,
      fromState: oldTarget?.state ?? null, toState,
      source: "MANUAL", context, reason: "ELECTIVE_MOVE_IN",
    });
    if (sourceMember.state === "ACTIVE") {
      await tx.update(lmsGroups).set({
        activeCount: sql.raw('"active_count" - 1'),
        version: sql.raw('"version" + 1'), updatedAt: now,
      }).where(eq(lmsGroups.id, fromGroup.id));
      await promoteEligibleWaitlist(tx, fromGroup, slot, context, now);
    }
    return target!;
  });
}

/** Serializes roster locks against add/leave using the SAME locked group row.
 * A locked membership still permits a deliberately confirmed admin removal. */

/**
 * One atomic Remove & Lock action: the member is REMOVED+locked before a seat
 * can be given to the existing eligible waitlist. Never perform two HTTP
 * mutations, which would leave an unlocked removed learner after a failure.
 */
export async function removeAndLockCollegeStudyMember(
  context: RequestContext, groupIdInput: string, memberIdInput: string, expectedVersion: number,
) {
  const groupId = uuid.parse(groupIdInput), memberId = uuid.parse(memberIdInput);
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0)
    throw new GroupServiceError("GROUP_MEMBER_STALE");
  return getDb().transaction(async tx => {
    const group = await lockGroup(tx, groupId);
    if (group.kind !== "STUDY_GROUP" || group.ownerScope !== "COLLEGE" || !group.collegeId)
      throw new GroupServiceError("GROUP_NOT_MANAGEABLE");
    assertScope(context, group, "MANUAL", memberId);
    await assertPersistedGroupActor(tx, context, {
      collegeId: group.collegeId, mode: "MANUAL", memberId,
    });
    if (group.status !== "ACTIVE" && group.status !== "DRAFT")
      throw new GroupServiceError("GROUP_NOT_MUTABLE");
    const [member] = await tx.select().from(lmsGroupMembers).where(and(
      eq(lmsGroupMembers.groupId, groupId), eq(lmsGroupMembers.membershipId, memberId),
    )).for("update").limit(1);
    if (!member || member.state === "REMOVED")
      throw new GroupServiceError("GROUP_MEMBER_NOT_FOUND");
    if (member.version !== expectedVersion)
      throw new GroupServiceError("GROUP_MEMBER_STALE");
    if (!["ACTIVE", "WAITLISTED", "REQUESTED"].includes(member.state))
      throw new GroupServiceError("GROUP_MEMBER_STATE_INVALID");

    const now = new Date();
    const [updated] = await tx.update(lmsGroupMembers).set({
      state: "REMOVED", isLocked: true, waitlistPosition: null,
      version: sql.raw('"version" + 1'), updatedAt: now,
    }).where(and(
      eq(lmsGroupMembers.id, member.id),
      eq(lmsGroupMembers.version, expectedVersion),
    )).returning();
    if (!updated) throw new GroupServiceError("GROUP_MEMBER_STALE");
    await emitEvent(tx, {
      groupId, membershipId: memberId, fromState: member.state,
      toState: "REMOVED", source: "MANUAL", context,
      reason: "MANUAL_REMOVE_AND_LOCK",
    });
    if (member.state === "ACTIVE") {
      await tx.update(lmsGroups).set({
        activeCount: sql.raw('"active_count" - 1'),
        version: sql.raw('"version" + 1'), updatedAt: now,
      }).where(eq(lmsGroups.id, groupId));
      if (group.status === "ACTIVE")
        await promoteEligibleWaitlist(tx, group, null, context, now);
    }
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_GROUP_UPDATED,
      organizationId: context.membership!.organizationId,
      collegeId: group.collegeId,
      subjectType: "lms_group_member", subjectId: member.id,
      subjectLabel: group.name,
      summary: "Study group member removed and locked",
      metadata: {
        groupId, membershipId: memberId,
        before: { state: member.state, isLocked: member.isLocked, version: member.version },
        after: { state: "REMOVED", isLocked: true, version: updated.version },
      },
    });
    return updated;
  });
}

export async function setCollegeStudyMemberLock(
  context: RequestContext, groupIdInput: string, memberIdInput: string, locked: boolean,
) {
  const groupId = uuid.parse(groupIdInput), memberId = uuid.parse(memberIdInput);
  return getDb().transaction(async (tx) => {
    const group = await lockGroup(tx, groupId);
    if (group.ownerScope !== "COLLEGE" || group.kind !== "STUDY_GROUP" ||
        !group.collegeId || !context.membership ||
        context.membership.collegeId !== group.collegeId)
      throw new GroupServiceError("GROUP_NOT_MANAGEABLE");
    requirePermission(context, "academics.manage", {
      collegeId: group.collegeId,
      organizationId: context.membership.organizationId,
    });
    await assertPersistedGroupActor(tx, context, {
      collegeId: group.collegeId, mode: "MANUAL", memberId,
    });
    const [existing] = await tx.select().from(lmsGroupMembers).where(and(
      eq(lmsGroupMembers.groupId, groupId),
      eq(lmsGroupMembers.membershipId, memberId),
    )).for("update");
    if (!existing || existing.state === "REMOVED")
      throw new GroupServiceError("GROUP_MEMBER_NOT_FOUND");
    if (existing.isLocked === locked) return existing;
    const [updated] = await tx.update(lmsGroupMembers).set({
      isLocked: locked, version: sql.raw('"version" + 1'), updatedAt: new Date(),
    }).where(eq(lmsGroupMembers.id, existing.id)).returning();
    await tx.insert(lmsGroupMemberEvents).values({
      groupId, membershipId: memberId, fromState: existing.state, toState: existing.state,
      memberType: existing.memberType, source: "MANUAL", actorType: "COLLEGE_ADMIN",
      actorUserId: context.user.id,
      reason: locked ? "MANUAL_LOCK" : "MANUAL_UNLOCK",
    });
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_GROUP_UPDATED,
      organizationId: context.membership.organizationId,
      collegeId: group.collegeId,
      subjectType: "lms_group_member", subjectId: existing.id,
      subjectLabel: group.name,
      summary: locked ? "Study group member locked" : "Study group member unlocked",
      metadata: { groupId, membershipId: memberId, before: { isLocked: existing.isLocked },
        after: { isLocked: locked } },
    });
    return updated!;
  });
}

/** Legacy elective allocation selector adapter. Every learner is processed in
 * its own atomic group transaction so a failed row does not corrupt neighbors.
 * The note is audit-only and never grants an unauthorized membership.
 */
export async function allocateGroupMembersFromLegacySelection(
 context:RequestContext,groupIdInput:string,raw:unknown,
) {
 const selection=z.strictObject({
  learnerIds:z.array(uuid).max(500).optional(),
  rollNumbers:z.array(z.string().trim().min(1).max(128)).max(500).optional(),
  fromClassId:uuid.optional(),
  note:z.string().trim().max(500).optional(),
 }).refine(v=>Boolean(v.learnerIds?.length||v.rollNumbers?.length||v.fromClassId),{
  message:"Select learners, roll numbers or a class",
 }).parse(raw);
 const groupId=uuid.parse(groupIdInput);
 const [group]=await getDb().select({
  id:lmsGroups.id,collegeId:lmsGroups.collegeId,
 }).from(lmsGroups).where(and(eq(lmsGroups.id,groupId),
  isNull(lmsGroups.deletedAt))).limit(1);
 if(!group?.collegeId)throw new GroupServiceError("GROUP_NOT_MANAGEABLE");
 requirePermission(context,"academics.manage",{collegeId:group.collegeId});
 const all=new Set(selection.learnerIds??[]);
 if(selection.rollNumbers?.length) {
  const found=await getDb().select({
   membershipId:learnerProfiles.membershipId,roll:learnerProfiles.rollNumber,
  }).from(learnerProfiles)
   .innerJoin(collegeMemberships,eq(collegeMemberships.id,learnerProfiles.membershipId))
   .where(and(eq(collegeMemberships.collegeId,group.collegeId),
    eq(collegeMemberships.status,"ACTIVE"),
    inArray(learnerProfiles.rollNumber,selection.rollNumbers))).limit(501);
  for(const row of found)all.add(row.membershipId);
 }
 if(selection.fromClassId){
  const found=await getDb().select({
   membershipId:learnerProgramEnrollments.membershipId,
  }).from(sectionEnrollments)
   .innerJoin(learnerProgramEnrollments,eq(
    learnerProgramEnrollments.id,sectionEnrollments.learnerEnrollmentId))
   .innerJoin(sections,eq(sections.id,sectionEnrollments.sectionId))
   .where(and(eq(sectionEnrollments.sectionId,selection.fromClassId),
    eq(sections.collegeId,group.collegeId),
    eq(sectionEnrollments.status,"ACTIVE"),
    eq(learnerProgramEnrollments.status,"ACTIVE"))).limit(501);
  for(const row of found)all.add(row.membershipId);
 }
 if(all.size>500)throw new GroupServiceError("GROUP_BULK_LIMIT_EXCEEDED");
 const results:{membershipId:string;status:"IMPORTED"|"FAILED";reason?:string}[]=[];
 for(const membershipId of all){
  try{
   await joinGroup(context,groupId,membershipId,"MANUAL",false,"CSV",
    selection.note);
   results.push({membershipId,status:"IMPORTED"});
  }catch(error){
   results.push({membershipId,status:"FAILED",
    reason:error instanceof GroupServiceError?error.code:"GROUP_IMPORT_FAILED"});
  }
 }
 return {requested:all.size,imported:results.filter(row=>row.status==="IMPORTED").length,
  failed:results.filter(row=>row.status==="FAILED").length,results};
}
