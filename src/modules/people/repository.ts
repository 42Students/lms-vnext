import "server-only";

import { and, asc, eq, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  colleges,
  membershipRoles,
  organizations,
  users,
} from "@/db/schema";
import type { MembershipRole } from "@/modules/identity/constants";
import { PeopleServiceError } from "./errors";
import type {
  OnboardedPerson,
  PeopleRepository,
  PersistPersonMembershipInput,
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

export const drizzlePeopleRepository: PeopleRepository = {
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

        if (!membership || membership.status !== "ACTIVE") {
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
          .where(eq(membershipRoles.membershipId, membership.id))
          .orderBy(asc(membershipRoles.role));

        return {
          user,
          membership: {
            id: membership.id,
            collegeId: membership.collegeId,
            status: "ACTIVE",
            roles: roleRows.map((row) => row.role as MembershipRole),
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
};
