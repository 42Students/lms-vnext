import "server-only";

import { asc, eq, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { systemRoles, users } from "@/db/schema";
import type { SystemRole } from "@/modules/identity/constants";
import {
  SystemRoleServiceError,
  type PersistBootstrapUserInput,
  type SystemRoleRepository,
  type SystemRoleUserView,
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
  return (
    (first?.trim().toLowerCase() ?? null) ===
    (second?.trim().toLowerCase() ?? null)
  );
}

function assertCompatibleUser(
  user: {
    phoneE164: string | null;
    email: string | null;
    platformStatus: "ACTIVE" | "DISABLED";
  },
  input: PersistBootstrapUserInput,
) {
  if (user.platformStatus !== "ACTIVE") {
    throw new SystemRoleServiceError("USER_DISABLED");
  }
  if (user.phoneE164 && user.phoneE164 !== input.phoneE164) {
    throw new SystemRoleServiceError("IDENTITY_COLLISION");
  }
  if (input.email && user.email && !emailsEqual(user.email, input.email)) {
    throw new SystemRoleServiceError("IDENTITY_COLLISION");
  }
}

async function loadRoles(
  db: ReturnType<typeof getDb>,
  userId: string,
): Promise<SystemRole[]> {
  const rows = await db
    .select({ role: systemRoles.role })
    .from(systemRoles)
    .where(eq(systemRoles.userId, userId))
    .orderBy(asc(systemRoles.role));

  return rows.map((row) => row.role);
}

export const drizzleSystemRoleRepository: SystemRoleRepository = {
  async persistBootstrapUser(
    input: PersistBootstrapUserInput,
  ): Promise<SystemRoleUserView> {
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
            platformStatus: users.platformStatus,
          })
          .from(users)
          .where(candidateWhere);

        const identityOwner = candidates.find(
          (candidate) => candidate.identityUid === input.identityUid,
        );
        const phoneOwner = candidates.find(
          (candidate) => candidate.phoneE164 === input.phoneE164,
        );
        const emailOwner = input.email
          ? candidates.find((candidate) => emailsEqual(candidate.email, input.email))
          : undefined;

        const ownerIds = new Set(
          [identityOwner?.id, phoneOwner?.id, emailOwner?.id].filter(
            (id): id is string => Boolean(id),
          ),
        );

        if (ownerIds.size > 1 || (!identityOwner && ownerIds.size > 0)) {
          throw new SystemRoleServiceError("IDENTITY_COLLISION");
        }

        let user = identityOwner;

        if (user) {
          assertCompatibleUser(user, input);

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
              platformStatus: users.platformStatus,
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
              platformStatus: users.platformStatus,
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
                platformStatus: users.platformStatus,
              })
              .from(users)
              .where(eq(users.identityUid, input.identityUid))
              .limit(1);

            user = candidates[0];
            if (!user) {
              throw new SystemRoleServiceError("IDENTITY_COLLISION");
            }
            assertCompatibleUser(user, input);
          }
        }

        if (!user) {
          throw new SystemRoleServiceError("IDENTITY_COLLISION");
        }

        await tx
          .insert(systemRoles)
          .values({ userId: user.id, role: "SUPER_ADMIN" })
          .onConflictDoNothing();

        const roleRows = await tx
          .select({ role: systemRoles.role })
          .from(systemRoles)
          .where(eq(systemRoles.userId, user.id))
          .orderBy(asc(systemRoles.role));

        return {
          ...user,
          systemRoles: roleRows.map((row) => row.role),
        };
      });
    } catch (error) {
      if (error instanceof SystemRoleServiceError) {
        throw error;
      }
      if (isUniqueViolation(error)) {
        throw new SystemRoleServiceError("IDENTITY_COLLISION");
      }
      throw error;
    }
  },

  async loadUser(userId) {
    const db = getDb();
    const [user] = await db
      .select({
        id: users.id,
        platformStatus: users.platformStatus,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user ?? null;
  },

  async assignRole(userId, role) {
    const db = getDb();
    await db
      .insert(systemRoles)
      .values({ userId, role })
      .onConflictDoNothing();

    return loadRoles(db, userId);
  },
};
