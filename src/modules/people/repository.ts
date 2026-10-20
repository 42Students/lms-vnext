import "server-only";

import {
  and,
  asc,
  count,
  eq,
  exists,
  ilike,
  inArray,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  collegeMemberships,
  colleges,
  membershipRoles,
  organizations,
  users,
} from "@/db/schema";
import type { MembershipRole } from "@/modules/identity/constants";
import {
  getMembershipLifecyclePatch,
  removeMembershipRoleFromSet,
} from "./membership-domain";
import type { MembershipManagementRepository } from "./membership-service";
import { PeopleServiceError } from "./errors";
import {assertMutableMembershipTarget} from "./membership-protection";
import {activeMentorProjectCount} from "./active-mentor-project-guard";
import type {
  CollegePeoplePage,
  OnboardedPerson,
  PeopleReadRepository,
  PeopleRepository,
  PersistPersonMembershipInput,
  PersonMembershipView,
  PersonOnboardingMutationContext,
} from "./service";

function isUniqueViolation(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "23505",
  );
}

function emailsEqual(
  first: string | null | undefined,
  second: string | null | undefined,
) {
  return (first?.trim().toLowerCase() ?? null) ===
    (second?.trim().toLowerCase() ?? null);
}

function assertUserCompatible(
  user: {
    phoneE164: string | null;
    email: string | null;
  },
  input: PersistPersonMembershipInput,
) {
  if (user.phoneE164 && user.phoneE164 !== input.phoneE164) {
    throw new PeopleServiceError("IDENTITY_COLLISION");
  }

  if (input.email && user.email && !emailsEqual(user.email, input.email)) {
    throw new PeopleServiceError("IDENTITY_COLLISION");
  }
}

async function loadRolesByMembership(
  membershipIds: string[],
): Promise<Map<string, MembershipRole[]>> {
  if (membershipIds.length === 0) {
    return new Map();
  }

  const db = getDb();
  const roleRows = await db
    .select({
      membershipId: membershipRoles.membershipId,
      role: membershipRoles.role,
    })
    .from(membershipRoles)
    .where(inArray(membershipRoles.membershipId, membershipIds))
    .orderBy(asc(membershipRoles.role));

  const roles = new Map<string, MembershipRole[]>();
  for (const row of roleRows) {
    const existing = roles.get(row.membershipId) ?? [];
    existing.push(row.role);
    roles.set(row.membershipId, existing);
  }

  return roles;
}

async function loadMembershipDetailFromDb(
  membershipId: string,
): Promise<PersonMembershipView | null> {
  const db = getDb();
  const [row] = await db
    .select({
      organizationId: colleges.organizationId,
      userId: users.id,
      identityUid: users.identityUid,
      phoneE164: users.phoneE164,
      email: users.email,
      displayName: users.displayName,
      membershipId: collegeMemberships.id,
      collegeId: collegeMemberships.collegeId,
      status: collegeMemberships.status,
      suspendedAt: collegeMemberships.suspendedAt,
      suspensionReason: collegeMemberships.suspensionReason,
      createdAt: collegeMemberships.createdAt,
      updatedAt: collegeMemberships.updatedAt,
    })
    .from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(colleges, eq(colleges.id, collegeMemberships.collegeId))
    .innerJoin(
      organizations,
      eq(organizations.id, colleges.organizationId),
    )
    .where(
      and(
        eq(collegeMemberships.id, membershipId),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const rolesByMembership = await loadRolesByMembership([row.membershipId]);

  return {
    organizationId: row.organizationId,
    user: {
      id: row.userId,
      identityUid: row.identityUid,
      phoneE164: row.phoneE164,
      email: row.email,
      displayName: row.displayName,
    },
    membership: {
      id: row.membershipId,
      collegeId: row.collegeId,
      status: row.status,
      suspendedAt: row.suspendedAt,
      suspensionReason: row.suspensionReason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      roles: rolesByMembership.get(row.membershipId) ?? [],
    },
  };
}

export const drizzlePeopleRepository:
  PeopleRepository &
  PeopleReadRepository &
  MembershipManagementRepository = {
  async loadActiveCollege(collegeId) {
    const db = getDb();
    const [college] = await db
      .select({
        id: colleges.id,
        organizationId: colleges.organizationId,
      })
      .from(colleges)
      .innerJoin(
        organizations,
        eq(organizations.id, colleges.organizationId),
      )
      .where(
        and(
          eq(colleges.id, collegeId),
          eq(colleges.status, "ACTIVE"),
          eq(organizations.status, "ACTIVE"),
        ),
      )
      .limit(1);

    return college ?? null;
  },

  async persistPersonMembership(
    input: PersistPersonMembershipInput,
    mutation: PersonOnboardingMutationContext,
  ): Promise<OnboardedPerson> {
    const db = getDb();

    try {
      return await db.transaction(async (tx) => {
        const candidateWhere = input.email
          ? or(
              eq(users.identityUid, input.identityUid),
              eq(users.phoneE164, input.phoneE164),
              sql<boolean>`lower(${users.email}) = ${input.email.toLowerCase()}`,
            )
          : or(
              eq(users.identityUid, input.identityUid),
              eq(users.phoneE164, input.phoneE164),
            );

        let candidates = await tx
          .select({
            id: users.id,
            identityUid: users.identityUid,
            phoneE164: users.phoneE164,
            email: users.email,
            displayName: users.displayName,
          })
          .from(users)
          .where(candidateWhere);

        let user = candidates.find(
          (candidate) => candidate.identityUid === input.identityUid,
        );

        const phoneOwner = candidates.find(
          (candidate) => candidate.phoneE164 === input.phoneE164,
        );
        const emailOwner = input.email
          ? candidates.find((candidate) =>
              emailsEqual(candidate.email, input.email),
            )
          : undefined;

        if (
          (phoneOwner && user && phoneOwner.id !== user.id) ||
          (emailOwner && user && emailOwner.id !== user.id)
        ) {
          throw new PeopleServiceError("IDENTITY_COLLISION");
        }

        if (!user && (phoneOwner || emailOwner)) {
          throw new PeopleServiceError("IDENTITY_COLLISION");
        }

        if (user) {
          assertUserCompatible(user, input);

          const [updated] = await tx
            .update(users)
            .set({
              phoneE164: input.phoneE164,
              ...(input.email ? { email: input.email } : {}),
              displayName: input.displayName,
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id))
            .returning({
              id: users.id,
              identityUid: users.identityUid,
              phoneE164: users.phoneE164,
              email: users.email,
              displayName: users.displayName,
            });

          user = updated;
        } else {
          const [created] = await tx
            .insert(users)
            .values({
              identityUid: input.identityUid,
              phoneE164: input.phoneE164,
              email: input.email,
              displayName: input.displayName,
            })
            .onConflictDoNothing()
            .returning({
              id: users.id,
              identityUid: users.identityUid,
              phoneE164: users.phoneE164,
              email: users.email,
              displayName: users.displayName,
            });

          user = created;

          if (!user) {
            candidates = await tx
              .select({
                id: users.id,
                identityUid: users.identityUid,
                phoneE164: users.phoneE164,
                email: users.email,
                displayName: users.displayName,
              })
              .from(users)
              .where(eq(users.identityUid, input.identityUid))
              .limit(1);

            user = candidates[0];

            if (!user) {
              throw new PeopleServiceError("IDENTITY_COLLISION");
            }

            assertUserCompatible(user, input);
          }
        }

        let [membership] = await tx
          .select({
            id: collegeMemberships.id,
            collegeId: collegeMemberships.collegeId,
            status: collegeMemberships.status,
          })
          .from(collegeMemberships)
          .where(
            and(
              eq(collegeMemberships.userId, user.id),
              eq(collegeMemberships.collegeId, input.collegeId),
            ),
          )
          .limit(1);

        if (!membership) {
          const [createdMembership] = await tx
            .insert(collegeMemberships)
            .values({
              userId: user.id,
              collegeId: input.collegeId,
            })
            .onConflictDoNothing()
            .returning({
              id: collegeMemberships.id,
              collegeId: collegeMemberships.collegeId,
              status: collegeMemberships.status,
            });

          membership = createdMembership;

          if (!membership) {
            [membership] = await tx
              .select({
                id: collegeMemberships.id,
                collegeId: collegeMemberships.collegeId,
                status: collegeMemberships.status,
              })
              .from(collegeMemberships)
              .where(
                and(
                  eq(collegeMemberships.userId, user.id),
                  eq(collegeMemberships.collegeId, input.collegeId),
                ),
              )
              .limit(1);
          }
        }

        if (!membership) {
          throw new PeopleServiceError("MEMBERSHIP_NOT_ACTIVE");
        }

        // A membership may be ENDED after the earlier read. Serialize
        // onboarding grants with transitionMembershipLifecycle on its parent
        // row; checking a stale status before the INSERT is not sufficient.
        const [lockedMembership] = await tx
          .select({
            status: collegeMemberships.status,
            userId: collegeMemberships.userId,
            collegeId: collegeMemberships.collegeId,
          })
          .from(collegeMemberships)
          .where(eq(collegeMemberships.id, membership.id))
          .for("update")
          .limit(1);

        if (
          !lockedMembership ||
          lockedMembership.status !== "ACTIVE" ||
          lockedMembership.userId !== user.id ||
          lockedMembership.collegeId !== input.collegeId
        ) {
          throw new PeopleServiceError("MEMBERSHIP_NOT_ACTIVE");
        }

        await tx
          .insert(membershipRoles)
          .values(
            input.roles.map((role) => ({
              membershipId: membership.id,
              role,
            })),
          )
          .onConflictDoNothing();

        const roleRows = await tx
          .select({ role: membershipRoles.role })
          .from(membershipRoles)
          .where(
            eq(
              membershipRoles.membershipId,
              membership.id,
            ),
          )
          .orderBy(asc(membershipRoles.role));
        const roles = roleRows.map(
          (row) => row.role,
        );

        await recordActivityEventInTransaction(
          tx,
          mutation.context,
          {
            eventType:
              ACTIVITY_EVENT_TYPES.IDENTITY_PERSON_ONBOARDED,
            collegeId: membership.collegeId,
            organizationId:
              mutation.organizationId,
            subjectType:
              "college_membership",
            subjectId: membership.id,
            subjectLabel:
              user.displayName ??
              input.displayName,
            summary:
              `${user.displayName ?? input.displayName} onboarded`,
            metadata: {
              userId: user.id,
              membershipId:
                membership.id,
              roles,
            },
            groupKey:
              `college:${membership.collegeId}:onboarding`,
            dedupeKey:
              `person-onboarded:${membership.id}`,
          },
        );

        return {
          user,
          membership: {
            id: membership.id,
            collegeId: membership.collegeId,
            status: "ACTIVE",
            roles,
          },
        };
      });
    } catch (error) {
      if (error instanceof PeopleServiceError) {
        throw error;
      }

      if (isUniqueViolation(error)) {
        throw new PeopleServiceError("IDENTITY_COLLISION");
      }

      throw error;
    }
  },

  async listCollegePeople(input): Promise<CollegePeoplePage> {
    const db = getDb();
    const pattern = "%" + input.q.replace(/[\\%_]/g, "\\$&") + "%";
    const filters = and(
      eq(collegeMemberships.collegeId, input.collegeId),
      input.status === "ALL" ? undefined : eq(collegeMemberships.status, input.status),
      input.q ? or(
        ilike(users.displayName, pattern),
        ilike(users.email, pattern),
        ilike(users.phoneE164, pattern),
      ) : undefined,
      input.role === "ALL" ? undefined : exists(
        db.select({ id: membershipRoles.id }).from(membershipRoles)
          .where(and(
            eq(membershipRoles.membershipId, collegeMemberships.id),
            eq(membershipRoles.role, input.role),
          )),
      ),
    );
    const [totalRow] = await db
      .select({ total: count() })
      .from(collegeMemberships)
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .where(filters);

    const rows = await db
      .select({
        organizationId: colleges.organizationId,
        userId: users.id,
        identityUid: users.identityUid,
        phoneE164: users.phoneE164,
        email: users.email,
        displayName: users.displayName,
        membershipId: collegeMemberships.id,
        collegeId: collegeMemberships.collegeId,
        status: collegeMemberships.status,
        suspendedAt: collegeMemberships.suspendedAt,
        suspensionReason: collegeMemberships.suspensionReason,
        createdAt: collegeMemberships.createdAt,
        updatedAt: collegeMemberships.updatedAt,
      })
      .from(collegeMemberships)
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .innerJoin(colleges, eq(colleges.id, collegeMemberships.collegeId))
      .where(filters)
      .orderBy(
        asc(users.displayName),
        asc(users.id),
        asc(collegeMemberships.id),
      )
      .limit(input.limit)
      .offset(input.offset);

    const rolesByMembership = await loadRolesByMembership(
      rows.map((row) => row.membershipId),
    );

    return {
      items: rows.map((row): PersonMembershipView => ({
        organizationId: row.organizationId,
        user: {
          id: row.userId,
          identityUid: row.identityUid,
          phoneE164: row.phoneE164,
          email: row.email,
          displayName: row.displayName,
        },
        membership: {
          id: row.membershipId,
          collegeId: row.collegeId,
          status: row.status,
          suspendedAt: row.suspendedAt,
          suspensionReason: row.suspensionReason,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          roles: rolesByMembership.get(row.membershipId) ?? [],
        },
      })),
      pagination: {
        limit: input.limit,
        offset: input.offset,
        total: totalRow?.total ?? 0,
      },
    };
  },

  loadMembershipDetail(membershipId) {
    return loadMembershipDetailFromDb(membershipId);
  },

  async addMembershipRole(
    membershipId,
    role,
    mutation,
  ) {
    const db = getDb();
    return db.transaction(async (tx) => {
      // Serialize role grants with SUSPEND/END and other mutations before
      // inspecting child role rows. A service-level precheck can be stale.
      const [parent] = await tx
        .select({
          status: collegeMemberships.status,
          userId: collegeMemberships.userId,
          collegeId: collegeMemberships.collegeId,
        })
        .from(collegeMemberships)
        .where(eq(collegeMemberships.id, membershipId))
        .for("update")
        .limit(1);

      if (
        !parent ||
        parent.userId !== mutation.person.user.id ||
        parent.collegeId !== mutation.person.membership.collegeId
      ) {
        // The preflight authorization snapshot may now describe a different
        // owner or college. Never mutate a role under stale tenant scope.
        throw new PeopleServiceError("MEMBERSHIP_NOT_FOUND");
      }
      if (parent.status === "ENDED") {
        throw new PeopleServiceError("MEMBERSHIP_ENDED");
      }

      const currentRows = await tx
        .select({
          role: membershipRoles.role,
        })
        .from(membershipRoles)
        .where(
          eq(
            membershipRoles.membershipId,
            membershipId,
          ),
        )
        .orderBy(asc(membershipRoles.role))
        .for("update");
      const currentRoles = currentRows.map(
        (row) => row.role,
      );

      assertMutableMembershipTarget(mutation.context,
        {userId:parent.userId,roles:currentRoles},"ROLE_ADD",role);

      if (currentRoles.includes(role)) {
        return currentRoles;
      }

      const [inserted] = await tx
        .insert(membershipRoles)
        .values({ membershipId, role })
        .onConflictDoNothing()
        .returning({
          role: membershipRoles.role,
        });

      if (!inserted) {
        const concurrentRows = await tx
          .select({
            role: membershipRoles.role,
          })
          .from(membershipRoles)
          .where(
            eq(
              membershipRoles.membershipId,
              membershipId,
            ),
          )
          .orderBy(
            asc(membershipRoles.role),
          );
        return concurrentRows.map(
          (row) => row.role,
        );
      }

      const nextRoles = [
        ...currentRoles,
        inserted.role,
      ].sort();

      await recordActivityEventInTransaction(
        tx,
        mutation.context,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.IDENTITY_ROLES_CHANGED,
          collegeId:
            mutation.person.membership
              .collegeId,
          organizationId:
            mutation.person.organizationId,
          subjectType:
            "college_membership",
          subjectId: membershipId,
          subjectLabel:
            mutation.person.user
              .displayName,
          summary:
            `${mutation.person.user.displayName} gained the ${role} role`,
          metadata: {
            userId:
              mutation.person.user.id,
            addedRole: role,
            roles: nextRoles,
          },
          groupKey:
            `membership:${membershipId}:roles`,
        },
      );

      return nextRoles;
    });
  },

  async removeMembershipRole(
    membershipId,
    role,
    mutation,
  ) {
    const db = getDb();

    return db.transaction(async (tx) => {
      // Lock the same parent used by transitionMembershipLifecycle and grant
      // mutations. Serializing removals also preserves the last-role rule.
      const [parent] = await tx
        .select({
          status: collegeMemberships.status,
          userId: collegeMemberships.userId,
          collegeId: collegeMemberships.collegeId,
        })
        .from(collegeMemberships)
        .where(eq(collegeMemberships.id, membershipId))
        .for("update")
        .limit(1);

      if (
        !parent ||
        parent.userId !== mutation.person.user.id ||
        parent.collegeId !== mutation.person.membership.collegeId
      ) {
        // The preflight authorization snapshot may now describe a different
        // owner or college. Never mutate a role under stale tenant scope.
        throw new PeopleServiceError("MEMBERSHIP_NOT_FOUND");
      }
      if (parent.status === "ENDED") {
        throw new PeopleServiceError("MEMBERSHIP_ENDED");
      }

      const currentRows = await tx
        .select({ role: membershipRoles.role })
        .from(membershipRoles)
        .where(eq(membershipRoles.membershipId, membershipId))
        .orderBy(asc(membershipRoles.role))
        .for("update");

      const currentRoles = currentRows.map((row) => row.role);
      assertMutableMembershipTarget(mutation.context,
        {userId:parent.userId,roles:currentRoles},"ROLE_REMOVE",role);
      const nextRoles = removeMembershipRoleFromSet(
        currentRoles,
        role,
      );

      if (nextRoles.length === currentRoles.length) {
        return currentRoles;
      }

      await tx
        .delete(membershipRoles)
        .where(
          and(
            eq(
              membershipRoles.membershipId,
              membershipId,
            ),
            eq(
              membershipRoles.role,
              role,
            ),
          ),
        );

      await recordActivityEventInTransaction(
        tx,
        mutation.context,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.IDENTITY_ROLES_CHANGED,
          collegeId:
            mutation.person.membership
              .collegeId,
          organizationId:
            mutation.person.organizationId,
          subjectType:
            "college_membership",
          subjectId: membershipId,
          subjectLabel:
            mutation.person.user
              .displayName,
          summary:
            `${mutation.person.user.displayName} lost the ${role} role`,
          metadata: {
            userId:
              mutation.person.user.id,
            removedRole: role,
            roles: nextRoles,
          },
          groupKey:
            `membership:${membershipId}:roles`,
        },
      );

      return nextRoles;
    });
  },

  async transitionMembershipLifecycle(
    membershipId,
    input,
    mutation,
  ) {
    const db = getDb();

    await db.transaction(async (tx) => {
      const [current] = await tx
        .select({
          status: collegeMemberships.status,
          suspendedAt: collegeMemberships.suspendedAt,
          suspensionReason: collegeMemberships.suspensionReason,
        })
        .from(collegeMemberships)
        .where(eq(collegeMemberships.id, membershipId))
        .for("update")
        .limit(1);

      if (!current) {
        throw new PeopleServiceError("MEMBERSHIP_NOT_FOUND");
      }

      const lockedRoles=await tx.select({role:membershipRoles.role})
        .from(membershipRoles).where(eq(membershipRoles.membershipId,membershipId))
        .for("share");
      assertMutableMembershipTarget(mutation.context,{
        userId:mutation.person.user.id,roles:lockedRoles.map(row=>row.role),
      },input.action);
      if(input.action==="SUSPEND"||input.action==="END"){
        if(await activeMentorProjectCount(tx,membershipId)>0)
          throw new PeopleServiceError("FACULTY_HAS_ACTIVE_PROJECTS");
      }
      const patch = getMembershipLifecyclePatch(
        current,
        input,
        new Date(),
      );

      if (!patch) {
        return;
      }

      await tx
        .update(collegeMemberships)
        .set({
          ...patch,
          updatedAt: new Date(),
        })
        .where(
          eq(
            collegeMemberships.id,
            membershipId,
          ),
        );

      if (input.action !== "REACTIVATE") {
        // A suspended or ended membership must not keep working sessions:
        // end every device session of the person (they can sign in again for
        // any other membership they still hold).
        await tx.execute(sql`
          UPDATE identity_device_sessions
          SET revoked_at = now(),
              revoked_by_user_id = ${mutation.context.user.id},
              revocation_reason = ${input.action === "SUSPEND" ? "MEMBERSHIP_SUSPENDED" : "MEMBERSHIP_ENDED"}
          WHERE user_id = ${mutation.person.user.id} AND revoked_at IS NULL
        `);
      }

      const eventType =
        input.action === "SUSPEND"
          ? ACTIVITY_EVENT_TYPES.IDENTITY_MEMBERSHIP_SUSPENDED
          : input.action ===
              "REACTIVATE"
            ? ACTIVITY_EVENT_TYPES.IDENTITY_MEMBERSHIP_REACTIVATED
            : ACTIVITY_EVENT_TYPES.IDENTITY_MEMBERSHIP_ENDED;
      const actionLabel =
        input.action === "SUSPEND"
          ? "suspended"
          : input.action ===
              "REACTIVATE"
            ? "reactivated"
            : "ended";

      await recordActivityEventInTransaction(
        tx,
        mutation.context,
        {
          eventType,
          collegeId:
            mutation.person.membership
              .collegeId,
          organizationId:
            mutation.person.organizationId,
          subjectType:
            "college_membership",
          subjectId: membershipId,
          subjectLabel:
            mutation.person.user
              .displayName,
          summary:
            `${mutation.person.user.displayName} membership ${actionLabel}`,
          metadata: {
            userId:
              mutation.person.user.id,
            fromStatus: current.status,
            toStatus: patch.status,
            reason:
              input.action === "SUSPEND"
                ? input.reason
                : null,
          },
          groupKey:
            `membership:${membershipId}:lifecycle`,
        },
      );
    });

    const updated = await loadMembershipDetailFromDb(membershipId);
    if (!updated) {
      throw new PeopleServiceError("MEMBERSHIP_NOT_FOUND");
    }

    return updated;
  },
};
