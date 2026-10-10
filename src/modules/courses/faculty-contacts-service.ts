import "server-only";

import {
  and,
  asc,
  count,
  eq,
  ilike,
  or,
} from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  membershipRoles,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { CoursesServiceError } from "./errors";

const querySchema = z.object({
  tab: z.enum(["ALL", "FACULTY", "LEARNER"]),
  search: z.string().trim().max(200).default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(10).max(50).default(20),
});

async function requirePersistedFaculty(context: RequestContext) {
  if (!context.membership || context.user.platformStatus !== "ACTIVE") {
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  }

  const [row] = await getDb()
    .select({
      membershipId: collegeMemberships.id,
      collegeId: collegeMemberships.collegeId,
    })
    .from(collegeMemberships)
    .innerJoin(
      membershipRoles,
      and(
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, "FACULTY"),
      ),
    )
    .where(
      and(
        eq(collegeMemberships.id, context.membership.id),
        eq(collegeMemberships.userId, context.user.id),
        eq(collegeMemberships.collegeId, context.membership.collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!row) {
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  }
  return row;
}

export async function listFacultyContacts(
  context: RequestContext,
  rawInput: unknown,
) {
  const input = querySchema.parse(rawInput);
  const actor = await requirePersistedFaculty(context);
  const db = getDb();

  const role =
    input.tab === "ALL" ? null : input.tab;
  const searchCondition = input.search
    ? or(
        ilike(users.displayName, `%${input.search}%`),
        ilike(users.email, `%${input.search}%`),
        ilike(users.phoneE164, `%${input.search}%`),
      )
    : null;

  const conditions = [
    eq(collegeMemberships.collegeId, actor.collegeId),
    eq(collegeMemberships.status, "ACTIVE"),
    eq(users.platformStatus, "ACTIVE"),
    ...(searchCondition ? [searchCondition] : []),
  ];

  const totalQuery = role
    ? db
        .select({ total: count() })
        .from(collegeMemberships)
        .innerJoin(users, eq(users.id, collegeMemberships.userId))
        .innerJoin(
          membershipRoles,
          and(
            eq(membershipRoles.membershipId, collegeMemberships.id),
            eq(membershipRoles.role, role),
          ),
        )
        .where(and(...conditions))
    : db
        .select({ total: count() })
        .from(collegeMemberships)
        .innerJoin(users, eq(users.id, collegeMemberships.userId))
        .where(and(...conditions));

  const offset = (input.page - 1) * input.pageSize;
  const pageQuery = role
    ? db
        .select({
          membershipId: collegeMemberships.id,
          displayName: users.displayName,
          email: users.email,
          phoneE164: users.phoneE164,
        })
        .from(collegeMemberships)
        .innerJoin(users, eq(users.id, collegeMemberships.userId))
        .innerJoin(
          membershipRoles,
          and(
            eq(membershipRoles.membershipId, collegeMemberships.id),
            eq(membershipRoles.role, role),
          ),
        )
        .where(and(...conditions))
        .orderBy(asc(users.displayName), asc(users.email), asc(collegeMemberships.id))
        .limit(input.pageSize)
        .offset(offset)
    : db
        .select({
          membershipId: collegeMemberships.id,
          displayName: users.displayName,
          email: users.email,
          phoneE164: users.phoneE164,
        })
        .from(collegeMemberships)
        .innerJoin(users, eq(users.id, collegeMemberships.userId))
        .where(and(...conditions))
        .orderBy(asc(users.displayName), asc(users.email), asc(collegeMemberships.id))
        .limit(input.pageSize)
        .offset(offset);

  const [[totalRow], items] = await Promise.all([
    totalQuery,
    pageQuery,
  ]);

  const ids = items.map((item) => item.membershipId);
  const roleRows =
    ids.length === 0
      ? []
      : await db
          .select({
            membershipId: membershipRoles.membershipId,
            role: membershipRoles.role,
          })
          .from(membershipRoles)
          .where(
            or(
              ...ids.map((id) =>
                eq(membershipRoles.membershipId, id),
              ),
            ),
          )
          .orderBy(
            asc(membershipRoles.membershipId),
            asc(membershipRoles.role),
          );

  const rolesByMembership = new Map<string, string[]>();
  for (const row of roleRows) {
    const bucket = rolesByMembership.get(row.membershipId) ?? [];
    bucket.push(row.role);
    rolesByMembership.set(row.membershipId, bucket);
  }

  const total = Number(totalRow?.total ?? 0);
  return {
    tab: input.tab,
    search: input.search,
    page: input.page,
    pageSize: input.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
    items: items.map((item) => ({
      ...item,
      roles: rolesByMembership.get(item.membershipId) ?? [],
    })),
  };
}
