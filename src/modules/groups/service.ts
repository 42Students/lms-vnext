import { and, asc, count, eq, inArray, isNull, max, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  collegeMemberships, electiveOfferings, electiveSlots,
  lmsGroupMemberEvents, lmsGroupMembers, lmsGroups, membershipRoles,
} from "@/db/schema";
import { hasActiveMembership, isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";

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
      group.ownerScope !== "COLLEGE" || group.collegeId === null ||
      !hasActiveMembership(context) ||
      !context.membership?.roles.includes("LEARNER") ||
      context.membership.id !== memberId ||
      context.membership.collegeId !== group.collegeId
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
  }).from(collegeMemberships).where(eq(collegeMemberships.id, memberId)).limit(1);
  if (!m || m.status !== "ACTIVE") throw new GroupServiceError("GROUP_MEMBER_INACTIVE");
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
  toState: "ACTIVE" | "WAITLISTED" | "REMOVED"; source: "SELF" | "MANUAL";
  context: RequestContext; reason?: string;
}) {
  await tx.insert(lmsGroupMemberEvents).values({
    groupId: args.groupId,
    membershipId: args.membershipId,
    fromState: args.fromState,
    toState: args.toState,
    source: args.source,
    actorType: actorType(args.context),
    actorUserId: args.context.user.id,
    reason: args.reason ?? null,
  });
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
  const [created] = await getDb().insert(lmsGroups).values({
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
  }).returning();
  return created!;
}

export async function joinGroup(
  context: RequestContext,
  groupIdInput: string,
  memberIdInput: string,
  requestedMode: "SELF" | "MANUAL" = "SELF",
) {
  const groupId = uuid.parse(groupIdInput);
  const memberId = uuid.parse(memberIdInput);
  const mode = supportedMode.parse(requestedMode);
  return getDb().transaction(async tx => {
    const slot = await lockElectiveSlot(tx, groupId);
    const group = await lockGroup(tx, groupId);
    assertScope(context, group, mode, memberId);
    await assertTargetMembership(tx, group, memberId);
    if (mode === "SELF") assertSelfWindow(group, new Date());
    else if (!["DRAFT", "ACTIVE"].includes(group.status))
      throw new GroupServiceError("GROUP_NOT_MUTABLE");
    const [existing] = await tx.select().from(lmsGroupMembers)
      .where(and(eq(lmsGroupMembers.groupId, groupId), eq(lmsGroupMembers.membershipId, memberId))).limit(1);
    if (existing?.state === "ACTIVE" || existing?.state === "WAITLISTED") return existing;
    if (existing?.isLocked && existing.state === "REMOVED")
      throw new GroupServiceError("GROUP_MEMBERSHIP_LOCKED");
    if (slot) {
      if (group.kind !== "ELECTIVE" || group.collegeId !== slot.collegeId)
        throw new GroupServiceError("ELECTIVE_GROUP_SCOPE_MISMATCH");
      await assertElectivePickLimit(tx, slot, memberId);
    }
    const available = group.capacity === null || group.activeCount < group.capacity;
    const allowWaitlist = group.configJson.allowWaitlist === true;
    if (!available && !allowWaitlist) throw new GroupServiceError("GROUP_CAPACITY_REACHED");
    const newState = available ? "ACTIVE" : "WAITLISTED";
    let waitlistPosition: number | null = null;
    if (newState === "WAITLISTED") {
      const [last] = await tx.select({ position: max(lmsGroupMembers.waitlistPosition) })
        .from(lmsGroupMembers).where(and(eq(lmsGroupMembers.groupId, groupId), eq(lmsGroupMembers.state, "WAITLISTED")));
      waitlistPosition = (last?.position ?? 0) + 1;
    }
    const patch = {
      state: newState, source: mode, isLocked: false,
      waitlistPosition, joinedAt: available ? new Date() : null,
      updatedAt: new Date(),
    } as const;
    const [saved] = existing
      ? await tx.update(lmsGroupMembers)
          .set({ ...patch, version: sql.raw('"version" + 1') })
          .where(eq(lmsGroupMembers.id, existing.id)).returning()
      : await tx.insert(lmsGroupMembers)
          .values({ groupId, membershipId: memberId, ...patch }).returning();
    if (available) await tx.update(lmsGroups)
      .set({ activeCount: sql.raw('"active_count" + 1'), version: sql.raw('"version" + 1'), updatedAt: new Date() })
      .where(eq(lmsGroups.id, groupId));
    await emitEvent(tx, {
      groupId, membershipId: memberId, fromState: existing?.state ?? null,
      toState: newState, source: mode, context,
    });
    return saved!;
  });
}

export async function leaveGroup(
  context: RequestContext,
  groupIdInput: string,
  memberIdInput: string,
  requestedMode: "SELF" | "MANUAL" = "SELF",
) {
  const groupId = uuid.parse(groupIdInput), memberId = uuid.parse(memberIdInput);
  const mode = supportedMode.parse(requestedMode);
  return getDb().transaction(async tx => {
    await lockElectiveSlot(tx, groupId);
    const group = await lockGroup(tx, groupId);
    assertScope(context, group, mode, memberId);
    if (mode === "SELF" && group.configJson.allowSelfLeave !== true)
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
      await tx.update(lmsGroups).set({
        activeCount: sql.raw('"active_count" - 1'),
        version: sql.raw('"version" + 1'), updatedAt: now,
      }).where(eq(lmsGroups.id, groupId));
      if (group.status === "ACTIVE") {
        const [first] = await tx.select().from(lmsGroupMembers)
          .where(and(eq(lmsGroupMembers.groupId, groupId), eq(lmsGroupMembers.state, "WAITLISTED")))
          .orderBy(asc(lmsGroupMembers.waitlistPosition), asc(lmsGroupMembers.createdAt)).limit(1);
        if (first) {
          await tx.update(lmsGroupMembers).set({
            state: "ACTIVE", waitlistPosition: null, joinedAt: now,
            updatedAt: now, version: sql.raw('"version" + 1'),
          }).where(eq(lmsGroupMembers.id, first.id));
          await tx.update(lmsGroups).set({
            activeCount: sql.raw('"active_count" + 1'),
            version: sql.raw('"version" + 1'), updatedAt: now,
          }).where(eq(lmsGroups.id, groupId));
          await emitEvent(tx, {
            groupId, membershipId: first.membershipId, fromState: "WAITLISTED",
            toState: "ACTIVE", source: mode, context, reason: "WAITLIST_PROMOTION",
          });
        }
      }
    }
    return removed!;
  });
}
