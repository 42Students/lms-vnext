import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  colleges,
  departments,
  facultyProfiles,
  membershipRoles,
  users,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";

/**
 * TPO self profile, strictly bound to the authenticated
 * user and their already-selected membership.
 *
 * No user ID, membership ID or college ID is accepted
 * from a URL, query parameter or form body.
 *
 * Only the requested display fields are selected:
 * - the signed-in user's display name;
 * - their college;
 * - persisted membership roles/status;
 * - their own optional faculty department.
 *
 * Login phone and email are read-only and returned only for the authenticated
 * membership owner. Profile documents and other memberships remain excluded.
 */
export async function getOwnTpoProfile(
  context: RequestContext,
) {
  const membership = context.membership;

  if (
    !membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    throw new AuthorizationError(
      "placements.manage",
    );
  }

  // Central placements.manage check, active college
  // resolution, and current authenticated membership
  // scope are not delegated to the page.
  await requirePlacementManageScope(
    context,
    membership.collegeId,
  );

  const rows = await getDb()
    .select({
      displayName: users.displayName,
      phone: users.phoneE164,
      email: users.email,
      avatarObjectPath: facultyProfiles.avatarObjectPath,
      collegeName: colleges.name,
      collegeCode: colleges.code,
      membershipStatus:
        collegeMemberships.status,
      role: membershipRoles.role,
      departmentName: departments.name,
    })
    .from(collegeMemberships)
    .innerJoin(
      users,
      eq(
        users.id,
        collegeMemberships.userId,
      ),
    )
    .innerJoin(
      colleges,
      eq(
        colleges.id,
        collegeMemberships.collegeId,
      ),
    )
    .innerJoin(
      membershipRoles,
      eq(
        membershipRoles.membershipId,
        collegeMemberships.id,
      ),
    )
    .leftJoin(
      facultyProfiles,
      eq(
        facultyProfiles.membershipId,
        collegeMemberships.id,
      ),
    )
    .leftJoin(
      departments,
      and(
        eq(
          departments.id,
          facultyProfiles.primaryDepartmentId,
        ),
        eq(
          departments.collegeId,
          colleges.id,
        ),
      ),
    )
    .where(
      and(
        eq(
          collegeMemberships.id,
          membership.id,
        ),
        eq(
          collegeMemberships.userId,
          context.user.id,
        ),
        eq(
          collegeMemberships.collegeId,
          membership.collegeId,
        ),
        eq(
          collegeMemberships.status,
          "ACTIVE",
        ),
        eq(
          colleges.organizationId,
          membership.organizationId,
        ),
        eq(colleges.status, "ACTIVE"),
        eq(
          users.platformStatus,
          "ACTIVE",
        ),
      ),
    )
    .orderBy(membershipRoles.role);

  // The current DB membership must still exist and
  // retain TPO, even when the request context was
  // constructed before a role change.
  if (
    rows.length === 0 ||
    !rows.some((row) => row.role === "TPO")
  ) {
    throw new AuthorizationError(
      "placements.manage",
    );
  }

  const own = rows[0]!;

  return {
    displayName: own.displayName,
    phone: own.phone,
    email: own.email,
    avatarObjectPath: own.avatarObjectPath,
    collegeName: own.collegeName,
    collegeCode: own.collegeCode,
    membershipStatus: own.membershipStatus,
    roles: [...new Set(rows.map((row) => row.role))],
    departmentName: own.departmentName,
    contactMail: own.contactMail,
    contactMobile: own.contactMobile,
    // A private object key must be signed by a separately authorized media
    // endpoint. Never hand this key or an unverified external URL to the UI.
    profileImageAvailable: Boolean(own.avatarObjectPath),
    profileImageUrl: null as string | null,
    avatarInitials: (own.displayName ?? "").trim().split(/\s+/).slice(0,2)
      .map(part=>part[0]?.toUpperCase()??"").join("") || "?",
    website: (() => {
      const raw=own.profileDocument?.website;
      if(typeof raw!=="string")return null;
      try{
        const url=new URL(raw);
        return url.protocol==="https:" && !url.username && !url.password && url.hostname
          ? url.toString():null;
      }catch{return null;}
    })(),
  };
}
