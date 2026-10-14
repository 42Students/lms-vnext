import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  colleges,
  lmsGroupMemberEvents,
  lmsGroupMembers,
  lmsGroupRules,
  lmsGroups,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";

/**
 * Read side of Student Groups for College Admin and scoped Super Admin.
 * Authorization is per college (`academics.manage`: College Admin or a scoped
 * Super Admin, because rosters expose member names) and the college is always
 * taken from the stored group, never from the request.
 */

export class GroupReadError extends Error {
  constructor(public readonly code: "GROUP_NOT_FOUND" | "COLLEGE_NOT_FOUND") {
    super(code);
    this.name = "GroupReadError";
  }
}

export const GROUP_STATUSES = ["DRAFT", "ACTIVE", "CLOSED", "ARCHIVED"] as const;

export const groupListQuerySchema = z.object({
  collegeId: z.string().uuid(),
  kind: z.string().trim().min(1).max(40).optional(),
  status: z.enum(GROUP_STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type GroupListRow = {
  id: string;
  name: string;
  kind: string;
  version: number;
  status: string;
  description: string | null;
  capacity: number | null;
  activeCount: number;
  waitlistedCount: number;
  requestedCount: number;
  academicYear: string | null;
  semesterNumber: number | null;
  selfJoinOpenFrom: Date | null;
  selfJoinOpenUntil: Date | null;
  createdAt: Date;
};

async function loadCollegeScope(collegeId: string) {
  const [college] = await getDb()
    .select({
      id: colleges.id,
      name: colleges.name,
      organizationId: colleges.organizationId,
    })
    .from(colleges)
    .where(eq(colleges.id, collegeId))
    .limit(1);

  if (!college) throw new GroupReadError("COLLEGE_NOT_FOUND");
  return college;
}

export async function listCollegeGroups(
  context: RequestContext,
  rawQuery: unknown,
) {
  const query = groupListQuerySchema.parse(rawQuery);
  const college = await loadCollegeScope(query.collegeId);

  requirePermission(context, "academics.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  const filters = [
    eq(lmsGroups.collegeId, college.id),
    eq(lmsGroups.ownerScope, "COLLEGE"),
    isNull(lmsGroups.deletedAt),
    ...(query.kind ? [eq(lmsGroups.kind, query.kind)] : []),
    ...(query.status ? [eq(lmsGroups.status, query.status)] : []),
  ];

  const db = getDb();
  const [rows, totals, kinds] = await Promise.all([
    db
      .select({
        id: lmsGroups.id,
        name: lmsGroups.name,
        kind: lmsGroups.kind,
        version: lmsGroups.version,
        status: lmsGroups.status,
        description: lmsGroups.description,
        capacity: lmsGroups.capacity,
        activeCount: lmsGroups.activeCount,
        academicYear: lmsGroups.academicYear,
        semesterNumber: lmsGroups.semesterNumber,
        selfJoinOpenFrom: lmsGroups.selfJoinOpenFrom,
        selfJoinOpenUntil: lmsGroups.selfJoinOpenUntil,
        createdAt: lmsGroups.createdAt,
        // The outer column is written out in full on purpose: with a single
        // table in FROM, Drizzle renders ${lmsGroups.id} unqualified, which
        // the subquery would resolve to its own id column (always zero).
        waitlistedCount: sql<number>`(
          select count(*)::int from lms_group_members gm
          where gm.group_id = "lms_groups"."id"
            and gm.state = 'WAITLISTED')`,
        requestedCount: sql<number>`(
          select count(*)::int from lms_group_members gm
          where gm.group_id = "lms_groups"."id"
            and gm.state = 'REQUESTED')`,
      })
      .from(lmsGroups)
      .where(and(...filters))
      .orderBy(desc(lmsGroups.createdAt), asc(lmsGroups.id))
      .limit(query.limit)
      .offset(query.offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(lmsGroups)
      .where(and(...filters)),
    db
      .selectDistinct({ kind: lmsGroups.kind })
      .from(lmsGroups)
      .where(
        and(
          eq(lmsGroups.collegeId, college.id),
          eq(lmsGroups.ownerScope, "COLLEGE"),
          isNull(lmsGroups.deletedAt),
        ),
      )
      .orderBy(asc(lmsGroups.kind)),
  ]);

  return {
    collegeName: college.name,
    items: rows as GroupListRow[],
    kinds: kinds.map((row) => row.kind),
    pagination: {
      limit: query.limit,
      offset: query.offset,
      total: totals[0]?.total ?? 0,
    },
  };
}

export async function getCollegeGroupDetail(
  context: RequestContext,
  groupIdInput: string,
) {
  const groupId = z.string().uuid().parse(groupIdInput);
  const db = getDb();

  const [group] = await db
    .select()
    .from(lmsGroups)
    .where(and(eq(lmsGroups.id, groupId), isNull(lmsGroups.deletedAt)))
    .limit(1);

  // Platform-owned groups have no college and are not a college admin's.
  if (!group || !group.collegeId) throw new GroupReadError("GROUP_NOT_FOUND");

  const college = await loadCollegeScope(group.collegeId);
  requirePermission(context, "academics.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  const [members, events, rule] = await Promise.all([
    db
      .select({
        membershipId: lmsGroupMembers.membershipId,
        version: lmsGroupMembers.version,
        displayName: users.displayName,
        memberType: lmsGroupMembers.memberType,
        state: lmsGroupMembers.state,
        source: lmsGroupMembers.source,
        isLocked: lmsGroupMembers.isLocked,
        waitlistPosition: lmsGroupMembers.waitlistPosition,
        joinedAt: lmsGroupMembers.joinedAt,
      })
      .from(lmsGroupMembers)
      .innerJoin(
        collegeMemberships,
        eq(collegeMemberships.id, lmsGroupMembers.membershipId),
      )
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .where(eq(lmsGroupMembers.groupId, group.id))
      .orderBy(
        asc(
          sql`case ${lmsGroupMembers.state}
            when 'ACTIVE' then 0 when 'WAITLISTED' then 1
            when 'REQUESTED' then 2 else 3 end`,
        ),
        asc(lmsGroupMembers.waitlistPosition),
        asc(users.displayName),
      )
      .limit(500),
    db
      .select({
        id: lmsGroupMemberEvents.id,
        displayName: users.displayName,
        fromState: lmsGroupMemberEvents.fromState,
        toState: lmsGroupMemberEvents.toState,
        source: lmsGroupMemberEvents.source,
        actorType: lmsGroupMemberEvents.actorType,
        reason: lmsGroupMemberEvents.reason,
        createdAt: lmsGroupMemberEvents.createdAt,
      })
      .from(lmsGroupMemberEvents)
      .innerJoin(
        collegeMemberships,
        eq(collegeMemberships.id, lmsGroupMemberEvents.membershipId),
      )
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .where(eq(lmsGroupMemberEvents.groupId, group.id))
      .orderBy(desc(lmsGroupMemberEvents.createdAt))
      .limit(25),
    db
      .select({
        criteriaJson: lmsGroupRules.criteriaJson,
        autoRefresh: lmsGroupRules.autoRefresh,
        lastRunAt: lmsGroupRules.lastRunAt,
        lastRunMatched: lmsGroupRules.lastRunMatched,
      })
      .from(lmsGroupRules)
      .where(eq(lmsGroupRules.groupId, group.id))
      .limit(1),
  ]);

  const count = (state: string) =>
    members.filter((member) => member.state === state).length;

  return {
    collegeName: college.name,
    group: {
      id: group.id,
      name: group.name,
      version: group.version,
      kind: group.kind,
      status: group.status,
      description: group.description,
      capacity: group.capacity,
      activeCount: group.activeCount,
      academicYear: group.academicYear,
      semesterNumber: group.semesterNumber,
      selfJoinOpenFrom: group.selfJoinOpenFrom,
      selfJoinOpenUntil: group.selfJoinOpenUntil,
      createdAt: group.createdAt,
    },
    counts: {
      active: count("ACTIVE"),
      waitlisted: count("WAITLISTED"),
      requested: count("REQUESTED"),
      removed: count("REMOVED"),
    },
    members,
    events,
    rule: rule[0] ?? null,
  };
}
