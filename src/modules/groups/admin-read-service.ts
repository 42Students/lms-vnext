import { and, asc, desc, eq, isNull, lt, or, sql } from "drizzle-orm";
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
  // The old list endpoint treated invalid/negative offsets as the first page.
  offset: z.coerce.number().int().transform(n=>Math.max(0,n)).default(0),
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
  const [rows, totals, kinds, statuses] = await Promise.all([
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
    db.select({status:lmsGroups.status,total:sql<number>`count(*)::int`})
      .from(lmsGroups).where(and(
       eq(lmsGroups.collegeId,college.id),
       eq(lmsGroups.ownerScope,"COLLEGE"),isNull(lmsGroups.deletedAt),
       ...(query.kind?[eq(lmsGroups.kind,query.kind)]:[]),
      )).groupBy(lmsGroups.status),
  ]);

  return {
    collegeName: college.name,
    items: rows as GroupListRow[],
    kinds: kinds.map((row) => row.kind),
    statusCounts:Object.fromEntries(statuses.map(row=>[row.status,row.total])),
    activeTotal:statuses.find(row=>row.status==="ACTIVE")?.total??0,
    pagination: {
      limit: query.limit,
      offset: query.offset,
      total: totals[0]?.total ?? 0,
    },
  };
}

const groupDetailPageSchema=z.strictObject({
  memberState:z.enum(["ACTIVE","WAITLISTED","REQUESTED","REMOVED"]).optional(),
  memberOffset:z.coerce.number().int().min(0).max(1000000).default(0),
  eventBefore:z.iso.datetime({offset:true}).optional(),
  eventBeforeId:z.string().uuid().optional(),
}).refine(v=>Boolean(v.eventBefore)===Boolean(v.eventBeforeId),{
  message:"Event cursor must include both timestamp and ID",
});

export async function getCollegeGroupDetail(
  context: RequestContext,
  groupIdInput: string,
  rawPage:unknown={},
) {
  const page=groupDetailPageSchema.parse(rawPage);
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

  const eventCursor=page.eventBefore?new Date(page.eventBefore):null;
  const [membersPage, eventsPage, rule, stateCounts] = await Promise.all([
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
      .where(and(eq(lmsGroupMembers.groupId, group.id),
        ...(page.memberState?[eq(lmsGroupMembers.state,page.memberState)]:[])))
      .orderBy(
        asc(
          sql`case ${lmsGroupMembers.state}
            when 'ACTIVE' then 0 when 'WAITLISTED' then 1
            when 'REQUESTED' then 2 else 3 end`,
        ),
        asc(lmsGroupMembers.waitlistPosition),
        asc(users.displayName),asc(lmsGroupMembers.id),
      )
      .offset(page.memberOffset)
      .limit(501),
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
      .where(and(eq(lmsGroupMemberEvents.groupId, group.id),
        eventCursor?or(
          lt(lmsGroupMemberEvents.createdAt,eventCursor),
          and(eq(lmsGroupMemberEvents.createdAt,eventCursor),
              lt(lmsGroupMemberEvents.id,page.eventBeforeId!)),
        ):undefined))
      .orderBy(desc(lmsGroupMemberEvents.createdAt),desc(lmsGroupMemberEvents.id))
      .limit(26),
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
    db.select({state:lmsGroupMembers.state,total:sql<number>`count(*)::int`})
      .from(lmsGroupMembers).where(eq(lmsGroupMembers.groupId,group.id))
      .groupBy(lmsGroupMembers.state),
  ]);

  const members=membersPage.slice(0,500);
  const events=eventsPage.slice(0,25);
  const lastEvent=events.at(-1);
  const memberHasMore=membersPage.length>500;
  const eventHasMore=eventsPage.length>25;
  // Count the ENTIRE persisted group, not the first 500 visible members.
  const count = (state: string) =>
    stateCounts.find(row=>row.state===state)?.total??0;

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
    memberPage:{offset:page.memberOffset,limit:500,hasMore:memberHasMore,
      nextOffset:memberHasMore?page.memberOffset+500:null,
      filterState:page.memberState??null},
    events,
    eventPage:{limit:25,hasMore:eventHasMore,
      nextCursor:eventHasMore&&lastEvent?{
        eventBefore:lastEvent.createdAt.toISOString(),eventBeforeId:lastEvent.id,
      }:null},
    rule: rule[0] ?? null,
  };
}
