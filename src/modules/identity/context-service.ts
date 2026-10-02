import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  colleges,
  membershipRoles,
  organizations,
  systemRoles as systemRolesTable,
  users,
} from "@/db/schema";
import type {
  AdminScope,
  RequestContext,
} from "@/modules/identity/context";
import type {
  MembershipRole,
  MembershipStatus,
  SystemRole,
} from "@/modules/identity/constants";

export type ContextResolutionErrorCode =
  | "USER_NOT_FOUND"
  | "USER_DISABLED"
  | "MEMBERSHIP_NOT_FOUND"
  | "MEMBERSHIP_NOT_ACTIVE";

export class ContextResolutionError extends Error {
  constructor(public readonly code: ContextResolutionErrorCode) {
    super(code);
    this.name = "ContextResolutionError";
  }
}

export type ResolveRequestContextInput = {
  identityUid: string;
  activeMembershipId?: string | null;
  adminScope?: AdminScope | null;
};

export type MembershipChoice = {
  id: string;
  collegeId: string;
  collegeName: string;
  collegeCode: string;
  organizationId: string;
  organizationName: string;
  status: MembershipStatus;
  roles: MembershipRole[];
};

async function findUserByIdentityUid(identityUid: string) {
  const db = getDb();

  const [user] = await db
    .select({
      id: users.id,
      identityUid: users.identityUid,
      platformStatus: users.platformStatus,
    })
    .from(users)
    .where(eq(users.identityUid, identityUid))
    .limit(1);

  return user ?? null;
}

async function findSystemRoles(userId: string): Promise<SystemRole[]> {
  const db = getDb();

  const rows = await db
    .select({ role: systemRolesTable.role })
    .from(systemRolesTable)
    .where(eq(systemRolesTable.userId, userId));

  return rows.map((row) => row.role);
}

async function findMembershipRoles(
  membershipId: string,
): Promise<MembershipRole[]> {
  const db = getDb();

  const rows = await db
    .select({ role: membershipRoles.role })
    .from(membershipRoles)
    .where(eq(membershipRoles.membershipId, membershipId));

  return rows.map((row) => row.role);
}

export async function resolveRequestContext(
  input: ResolveRequestContextInput,
): Promise<RequestContext> {
  const user = await findUserByIdentityUid(input.identityUid);

  if (!user) {
    throw new ContextResolutionError("USER_NOT_FOUND");
  }

  if (user.platformStatus !== "ACTIVE") {
    throw new ContextResolutionError("USER_DISABLED");
  }

  const assignedSystemRoles = await findSystemRoles(user.id);

  if (!input.activeMembershipId) {
    return {
      user: {
        id: user.id,
        identityUid: user.identityUid,
        platformStatus: user.platformStatus,
        systemRoles: assignedSystemRoles,
      },
      membership: null,
      adminScope: input.adminScope ?? null,
    };
  }

  const db = getDb();

  const [membership] = await db
    .select({
      id: collegeMemberships.id,
      collegeId: collegeMemberships.collegeId,
      organizationId: colleges.organizationId,
      status: collegeMemberships.status,
    })
    .from(collegeMemberships)
    .innerJoin(colleges, eq(colleges.id, collegeMemberships.collegeId))
    .innerJoin(
      organizations,
      eq(organizations.id, colleges.organizationId),
    )
    .where(
      and(
        eq(collegeMemberships.id, input.activeMembershipId),
        eq(collegeMemberships.userId, user.id),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new ContextResolutionError("MEMBERSHIP_NOT_FOUND");
  }

  if (membership.status !== "ACTIVE") {
    throw new ContextResolutionError("MEMBERSHIP_NOT_ACTIVE");
  }

  const roles = await findMembershipRoles(membership.id);

  return {
    user: {
      id: user.id,
      identityUid: user.identityUid,
      platformStatus: user.platformStatus,
      systemRoles: assignedSystemRoles,
    },
    membership: {
      id: membership.id,
      collegeId: membership.collegeId,
      organizationId: membership.organizationId,
      status: membership.status,
      roles,
    },
    adminScope: input.adminScope ?? null,
  };
}

export async function listMembershipChoices(
  identityUid: string,
): Promise<MembershipChoice[]> {
  const user = await findUserByIdentityUid(identityUid);

  if (!user) {
    throw new ContextResolutionError("USER_NOT_FOUND");
  }

  if (user.platformStatus !== "ACTIVE") {
    throw new ContextResolutionError("USER_DISABLED");
  }

  const db = getDb();

  const rows = await db
    .select({
      id: collegeMemberships.id,
      collegeId: colleges.id,
      collegeName: colleges.name,
      collegeCode: colleges.code,
      organizationId: organizations.id,
      organizationName: organizations.name,
      status: collegeMemberships.status,
    })
    .from(collegeMemberships)
    .innerJoin(colleges, eq(colleges.id, collegeMemberships.collegeId))
    .innerJoin(
      organizations,
      eq(organizations.id, colleges.organizationId),
    )
    .where(
      and(
        eq(collegeMemberships.userId, user.id),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    );

  if (rows.length === 0) {
    return [];
  }

  const roleRows = await db
    .select({
      membershipId: membershipRoles.membershipId,
      role: membershipRoles.role,
    })
    .from(membershipRoles)
    .where(
      inArray(
        membershipRoles.membershipId,
        rows.map((row) => row.id),
      ),
    );

  const rolesByMembership = new Map<string, MembershipRole[]>();
  for (const row of roleRows) {
    const current = rolesByMembership.get(row.membershipId) ?? [];
    current.push(row.role);
    rolesByMembership.set(row.membershipId, current);
  }

  return rows.map((row) => ({
    ...row,
    roles: rolesByMembership.get(row.id) ?? [],
  }));
}
