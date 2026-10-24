import "server-only";

import { asc, eq, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { systemRoles, users } from "@/db/schema";
import type { SystemRole } from "@/modules/identity/constants";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import type {RequestContext} from "@/modules/identity/context";
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

export const drizzleSystemRoleRepository: SystemRoleRepository = {
  async persistBootstrapUser(
    input: PersistBootstrapUserInput,
  ): Promise<SystemRoleUserView> {
    const db = getDb();

    try {
      return await db.transaction(async (tx) => {
        // A phone-less email bootstrap must not match every unrelated
        // null phone row. Only compare phone numbers when one was provided.
        const phoneMatch=input.phoneE164
          ?eq(users.phoneE164,input.phoneE164):undefined;
        const candidateWhere = input.email
          ? or(
              eq(users.identityUid, input.identityUid),
              phoneMatch,
              sql<boolean>`lower(${users.email}) = ${input.email.toLowerCase()}`,
            )
          : or(eq(users.identityUid, input.identityUid), phoneMatch);

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
        const phoneOwner = input.phoneE164 ? candidates.find(
          (candidate) => candidate.phoneE164 === input.phoneE164,
        ) : undefined;
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

  async assignRole(userId:string,role:SystemRole,context:RequestContext) {
    const db=getDb();
    return db.transaction(async tx=>{
      // The request-snapshot permission alone is insufficient: role removal,
      // platform disablement and membership revocation must win concurrent
      // races against any attempted Super Admin privilege escalation.
      await assertPersistedPlatformPermission(tx,context,"system-role.manage");
      const [target]=await tx.select({id:users.id,platformStatus:users.platformStatus})
        .from(users).where(eq(users.id,userId)).for("share").limit(1);
      if(!target)throw new SystemRoleServiceError("USER_NOT_FOUND");
      if(target.platformStatus!=="ACTIVE")
        throw new SystemRoleServiceError("USER_DISABLED");
      const inserted=await tx.insert(systemRoles)
        .values({userId:target.id,role}).onConflictDoNothing()
        .returning({role:systemRoles.role});
      if(inserted.length){
        // Only a genuinely new grant creates an audit event, not idempotent
        // retries or repeated double-clicks.
        await recordActivityEventInTransaction(tx,context,{
          eventType:ACTIVITY_EVENT_TYPES.PLATFORM_SYSTEM_ROLE_ASSIGNED,
          importance:"CRITICAL",
          subjectType:"user",subjectId:target.id,subjectLabel:role,
          summary:"System role assigned",
          metadata:{after:{role}},
        });
      }
      const roleRows=await tx.select({role:systemRoles.role})
        .from(systemRoles).where(eq(systemRoles.userId,target.id))
        .orderBy(asc(systemRoles.role));
      return roleRows.map(row=>row.role);
    });
  },
};
