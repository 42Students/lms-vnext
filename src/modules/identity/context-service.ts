import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  colleges,
  membershipRoles,
  organizations,
  placementCompanies,
  placementCompanyRelationships,
  placementRecruiterCollegeGrants,
  placementRecruiterProfiles,
  systemRoles as systemRolesTable,
  users,
} from "@/db/schema";
import type {
  AdminScope,
  RecruiterContext,
  RequestContext,
} from "@/modules/identity/context";
import type {
  MembershipRole,
  MembershipStatus,
  SystemRole,
} from "@/modules/identity/constants";
import {MEMBERSHIP_ROLE_DISPLAY_ORDER} from "@/modules/identity/constants";

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
  activeRole?: MembershipRole | null;
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

async function findRecruiterContext(
  userId: string,
): Promise<RecruiterContext | null> {
  const db = getDb();

  const [profile] = await db
    .select({
      userId: placementRecruiterProfiles.userId,
      companyId: placementRecruiterProfiles.companyId,
      companyName: placementCompanies.name,
      title: placementRecruiterProfiles.title,
    })
    .from(placementRecruiterProfiles)
    .innerJoin(
      placementCompanies,
      eq(
        placementCompanies.id,
        placementRecruiterProfiles.companyId,
      ),
    )
    .where(
      and(
        eq(placementRecruiterProfiles.userId, userId),
        eq(placementRecruiterProfiles.status, "ACTIVE"),
        eq(placementCompanies.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!profile) return null;
  const grants = await db
    .select({
      id: placementRecruiterCollegeGrants.id,
      organizationId: colleges.organizationId,
      collegeId: colleges.id,
      collegeName: colleges.name,
      companyRelationshipId:
        placementCompanyRelationships.id,
    })
    .from(placementRecruiterCollegeGrants)
    .innerJoin(
      placementCompanyRelationships,
      eq(
        placementCompanyRelationships.id,
        placementRecruiterCollegeGrants.companyRelationshipId,
      ),
    )
    .innerJoin(
      colleges,
      eq(
        colleges.id,
        placementCompanyRelationships.collegeId,
      ),
    )
    .innerJoin(
      organizations,
      eq(organizations.id, colleges.organizationId),
    )
    .where(
      and(
        eq(
          placementRecruiterCollegeGrants.recruiterUserId,
          userId,
        ),
        eq(
          placementRecruiterCollegeGrants.status,
          "ACTIVE",
        ),
        // T-S1-01: NULL validity, unverified or capability-less grants fail closed.
        sql`${placementRecruiterCollegeGrants.validUntil} > clock_timestamp()`,
        eq(placementRecruiterCollegeGrants.verificationStatus, "VERIFIED"),
        sql`${placementRecruiterCollegeGrants.capabilities} @> ARRAY['DRIVES']::text[]`,
        eq(
          placementCompanyRelationships.status,
          "ACTIVE",
        ),
        eq(
          placementCompanyRelationships.companyId,
          profile.companyId,
        ),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .orderBy(asc(colleges.name));

  if (grants.length === 0) return null;

  return {
    userId: profile.userId,
    companyId: profile.companyId,
    companyName: profile.companyName,
    title: profile.title,
    status: "ACTIVE",
    grants,
  };
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

/** Source migration reference only; NEVER grant a role from this map.
 * Resolve legacy userType/facultyType and numeric source identity against the
 * verified college before creating persisted membership/system role rows.
 */
export const LEGACY_ACCOUNT_ROLE_DISPOSITION = {
  SUPER_ADMIN: { kind: "SYSTEM", role: "SUPER_ADMIN" },
  ADMIN: { kind: "MEMBERSHIP", role: "COLLEGE_ADMIN" },
  TPO: { kind: "MEMBERSHIP", role: "TPO" },
  MENTOR: { kind: "MEMBERSHIP", role: "MENTOR" },
  FACULTY: { kind: "MEMBERSHIP", role: "FACULTY" },
  LEARNER: { kind: "MEMBERSHIP", role: "LEARNER" },
  RECRUITER: { kind: "RECRUITER_PROFILE", role: "RECRUITER" },
} as const;

/** Role shown first when a person holds several roles and has not picked one yet. */
const ROLE_PRIORITY: readonly MembershipRole[] = ["COLLEGE_ADMIN", "TPO", "MENTOR", "FACULTY", "LEARNER"];

/**
 * One workspace at a time: a person holding several roles works in exactly one of them.
 * The chosen role (or the highest-priority held role when none is chosen) becomes the only
 * role of the request context, so menus, pages and permission checks never mix roles.
 */
export function narrowToActiveRole(
  roles: readonly MembershipRole[],
  activeRole?: MembershipRole | null,
): MembershipRole[] {
  if (roles.length <= 1) return [...roles];
  if (activeRole && roles.includes(activeRole)) return [activeRole];
  return [ROLE_PRIORITY.find((role) => roles.includes(role)) ?? roles[0]];
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

  const [assignedSystemRoles, recruiter] = await Promise.all([
    findSystemRoles(user.id),
    findRecruiterContext(user.id),
  ]);

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
      recruiter,
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

  const roles = narrowToActiveRole(await findMembershipRoles(membership.id), input.activeRole);

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
    recruiter,
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
    roles: MEMBERSHIP_ROLE_DISPLAY_ORDER.filter(role=>
      (rolesByMembership.get(row.id)??[]).includes(role)),
  })).sort((a,b)=>a.collegeName.localeCompare(b.collegeName)||
    a.organizationName.localeCompare(b.organizationName)||a.id.localeCompare(b.id));
}

/** A recruiter choice is scoped to the currently selected college, never
 * widened by a separate role or an unverified historical grant.
 */
export function recruiterGrantsForCollege(recruiter:RecruiterContext|null,collegeId:string|null){
 if(!recruiter||!collegeId)return [];
 return recruiter.grants.filter(grant=>grant.collegeId===collegeId);
}
export function contextRecoveryCopy(code:ContextResolutionErrorCode){
 switch(code){
  case "USER_DISABLED":return "Your account is inactive. Contact an administrator.";
  case "MEMBERSHIP_NOT_ACTIVE":return "Your college access has ended. Choose another active college.";
  case "MEMBERSHIP_NOT_FOUND":return "This college membership is no longer available.";
  default:return "Your session is no longer available. Please sign in again.";
 }
}
