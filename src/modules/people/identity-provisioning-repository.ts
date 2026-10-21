import "server-only";

import { eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { PeopleServiceError } from "./errors";
import type {
  IdentityProvisioningRepository,
  PersistResolvedIdentityInput,
  ProvisionedPlatformIdentity,
} from "./identity-provisioning";

/** Legacy /api/v1/users/register and /users/register username/password
 * creation is retired. Only identity-provider verified UID and contacts
 * may enter this repository; never accept, log or persist an old password.
 * This schema validates a read-only migration preview, NOT a signup route. */
export const LEGACY_USER_DTO_FIELD_LIMITS={
 username:255,password:255,email:255,phone:20,name:255,businessTitle:255,
} as const;
export const legacyRegistrationProfilePreviewSchema=z.strictObject({
 userName:z.string().trim().min(1).max(LEGACY_USER_DTO_FIELD_LIMITS.username),
 email:z.email().max(LEGACY_USER_DTO_FIELD_LIMITS.email).nullable().optional(),
 phone:z.string().trim().max(LEGACY_USER_DTO_FIELD_LIMITS.phone).nullable().optional(),
 name:z.string().trim().max(LEGACY_USER_DTO_FIELD_LIMITS.name).nullable().optional(),
 businessTitle:z.string().trim().max(LEGACY_USER_DTO_FIELD_LIMITS.businessTitle).nullable().optional(),
});
export const legacyRegistrationMigration={
 oldEndpoints:["/api/v1/users/register","/users/register"],
 credentialFlow:"Retired: use verified identity/OTP, never a legacy password",
 uidSource:"Verified identity-provider UID; username is not a login credential",
 phone:"Optional, verified E.164 contact; legacy phone limit was 20 characters",
 displayName:"Identity displayName; name and businessTitle remain profile metadata",
 collisions:"Public reply is nonenumerating; admin-only forms may show field details",
} as const;

/** Exact legacy duplicate wording for authorized registration forms only.
 * The generic IDENTITY_COLLISION API code deliberately does not disclose
 * whether an email/phone belongs to an account on public signup endpoints. */
export const LEGACY_REGISTRATION_COLLISION_COPY = {
 username: "Username already exists. Please choose a different username.",
 email: "Email already exists. Please use a different email address.",
 phone: "Phone number already exists. Please use a different phone number.",
} as const;
export type IdentityCollisionField=keyof typeof LEGACY_REGISTRATION_COLLISION_COPY;
export function registeredIdentityCollisionDetail(field:IdentityCollisionField,authorized:boolean){
 return authorized?LEGACY_REGISTRATION_COLLISION_COPY[field]:
  "An account with these details cannot be registered. Check the information or contact support.";
}
/** Equivalent to legacy wrapped success, without passwords, tokens, phones
 * or other credentials. Caller decides navigation only after acknowledged
 * provisioning and an actual authenticated session. */
export function provisionedIdentityAcknowledgement(result:ProvisionedPlatformIdentity){
 return {ok:true,message:"OK",userId:result.userId,
  existed:result.existed,platformStatus:result.platformStatus};
}

type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

type Candidate = {
  id: string;
  identityUid: string;
  phoneE164: string | null;
  email: string | null;
  displayName: string | null;
  platformStatus: "ACTIVE" | "DISABLED";
};

function normalizedEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? null;
}

function candidatePredicate(input: PersistResolvedIdentityInput) {
  const conditions = [eq(users.identityUid, input.identityUid)];
  if (input.phoneE164) {
    conditions.push(eq(users.phoneE164, input.phoneE164));
  }
  if (input.email) {
    conditions.push(
      sql<boolean>`lower(${users.email}) = ${normalizedEmail(input.email)}`,
    );
  }
  return or(...conditions)!;
}

async function loadCandidates(
  tx: Tx,
  input: PersistResolvedIdentityInput,
) {
  return tx
    .select({
      id: users.id,
      identityUid: users.identityUid,
      phoneE164: users.phoneE164,
      email: users.email,
      displayName: users.displayName,
      platformStatus: users.platformStatus,
    })
    .from(users)
    .where(candidatePredicate(input))
    .for("update");
}

function selectCompatibleOwner(
  candidates: Candidate[],
  input: PersistResolvedIdentityInput,
) {
  const uidOwner = candidates.find(
    (candidate) =>
      candidate.identityUid === input.identityUid,
  );
  const phoneOwner = input.phoneE164
    ? candidates.find(
        (candidate) =>
          candidate.phoneE164 === input.phoneE164,
      )
    : undefined;
  const emailOwner = input.email
    ? candidates.find(
        (candidate) =>
          normalizedEmail(candidate.email) ===
          normalizedEmail(input.email),
      )
    : undefined;

  if (
    (phoneOwner &&
      uidOwner &&
      phoneOwner.id !== uidOwner.id) ||
    (emailOwner &&
      uidOwner &&
      emailOwner.id !== uidOwner.id) ||
    (phoneOwner &&
      emailOwner &&
      phoneOwner.id !== emailOwner.id)
  ) {
    throw new PeopleServiceError(
      "IDENTITY_COLLISION",
    );
  }

  if (!uidOwner && (phoneOwner || emailOwner)) {
    throw new PeopleServiceError(
      "IDENTITY_COLLISION",
    );
  }

  if (!uidOwner) return null;

  if (
    input.phoneE164 &&
    uidOwner.phoneE164 &&
    uidOwner.phoneE164 !== input.phoneE164
  ) {
    throw new PeopleServiceError(
      "IDENTITY_COLLISION",
    );
  }
  if (
    input.email &&
    uidOwner.email &&
    normalizedEmail(uidOwner.email) !==
      normalizedEmail(input.email)
  ) {
    throw new PeopleServiceError(
      "IDENTITY_COLLISION",
    );
  }

  return uidOwner;
}

function toProvisioned(
  user: Candidate,
  existed: boolean,
): ProvisionedPlatformIdentity {
  return {
    userId: user.id,
    identityUid: user.identityUid,
    existed,
    platformStatus: user.platformStatus,
  };
}

async function updateExisting(
  tx: Tx,
  user: Candidate,
  input: PersistResolvedIdentityInput,
) {
  const [updated] = await tx
    .update(users)
    .set({
      ...(input.phoneE164 && !user.phoneE164
        ? { phoneE164: input.phoneE164 }
        : {}),
      ...(input.email && !user.email
        ? { email: normalizedEmail(input.email) }
        : {}),
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

  if (!updated) {
    throw new PeopleServiceError(
      "IDENTITY_COLLISION",
    );
  }
  return updated;
}

export const drizzleIdentityProvisioningRepository:
  IdentityProvisioningRepository = {
  async persistResolvedIdentity(input) {
    const db = getDb();

    try {
      return await db.transaction(async (tx) => {
        let candidates = await loadCandidates(
          tx,
          input,
        );
        let existing = selectCompatibleOwner(
          candidates,
          input,
        );

        if (existing) {
          existing = await updateExisting(
            tx,
            existing,
            input,
          );
          return toProvisioned(existing, true);
        }

        const [created] = await tx
          .insert(users)
          .values({
            identityUid: input.identityUid,
            phoneE164: input.phoneE164,
            email: input.email
              ? normalizedEmail(input.email)
              : undefined,
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

        if (created) {
          return toProvisioned(created, false);
        }

        // A concurrent insert may have won one of the unique keys.
        // A fresh READ COMMITTED statement observes that committed row.
        candidates = await loadCandidates(tx, input);
        existing = selectCompatibleOwner(
          candidates,
          input,
        );
        if (!existing) {
          throw new PeopleServiceError(
            "IDENTITY_COLLISION",
          );
        }
        existing = await updateExisting(
          tx,
          existing,
          input,
        );
        return toProvisioned(existing, true);
      });
    } catch (error) {
      if (error instanceof PeopleServiceError) {
        throw error;
      }
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code?: unknown }).code ===
          "23505"
      ) {
        throw new PeopleServiceError(
          "IDENTITY_COLLISION",
        );
      }
      throw error;
    }
  },
};
