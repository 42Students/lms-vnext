import "server-only";

import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { PeopleServiceError } from "./errors";
import {
  displayNameFromPersonName,
  personNameSchema,
  type PersonName,
} from "./person-name";

type IdentityProfileRow = {
  id: string;
  identity_uid: string;
  email: string | null;
  display_name: string | null;
  given_name: string | null;
  family_name: string | null;
  identity_profile_version: number;
};

export type OwnIdentityProfile = {
  givenName: string | null;
  familyName: string | null;
  displayName: string | null;
  email: string | null;
  version: number;
};

function toProfile(row: IdentityProfileRow): OwnIdentityProfile {
  return {
    givenName: row.given_name,
    familyName: row.family_name,
    displayName: row.display_name,
    email: row.email,
    version: row.identity_profile_version,
  };
}

/**
 * STAGED DB01 adapter. It must stay unreachable from runtime routes until the
 * matching users columns are promoted through a generated Drizzle migration
 * and the full migration journal is replayed.
 */
export async function loadOwnIdentityProfileStaged(
  context: RequestContext,
): Promise<OwnIdentityProfile> {
  return getDb().transaction(async (tx) => {
    await assertPersistedPlatformPermission(
      tx,
      context,
      "identity.self.manage",
    );

    const result = await tx.execute<IdentityProfileRow>(sql`
      select
        id,
        identity_uid,
        email,
        display_name,
        given_name,
        family_name,
        identity_profile_version
      from users
      where id = ${context.user.id}
    `);

    const row = result.rows[0];
    if (!row) {
      throw new PeopleServiceError("MEMBERSHIP_NOT_FOUND");
    }
    return toProfile(row);
  });
}

/**
 * Database half of the self-name update.
 *
 * The caller must synchronize the resulting displayName to the external
 * IdentityDirectory before this adapter is activated in an API. W01 keeps
 * provider-email changes out of this method: email changes require a verified
 * Identity Platform flow, not a profile-form DB overwrite.
 */
export async function saveOwnPersonNameStaged(
  context: RequestContext,
  rawName: unknown,
  expectedVersion: number,
): Promise<OwnIdentityProfile & { name: PersonName }> {
  if (
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion < 1
  ) {
    throw new PeopleServiceError(
      "IDENTITY_PROFILE_VERSION_CONFLICT",
    );
  }

  const name = personNameSchema.parse(rawName);
  const displayName = displayNameFromPersonName(name);

  return getDb().transaction(async (tx) => {
    await assertPersistedPlatformPermission(
      tx,
      context,
      "identity.self.manage",
      {},
      { actorLock: "update" },
    );

    const result = await tx.execute<IdentityProfileRow>(sql`
      update users
      set
        given_name = ${name.givenName},
        family_name = ${name.familyName || null},
        display_name = ${displayName},
        identity_profile_version =
          identity_profile_version + 1,
        updated_at = clock_timestamp()
      where id = ${context.user.id}
        and identity_profile_version =
          ${expectedVersion}
      returning
        id,
        identity_uid,
        email,
        display_name,
        given_name,
        family_name,
        identity_profile_version
    `);

    const row = result.rows[0];
    if (!row) {
      throw new PeopleServiceError(
        "IDENTITY_PROFILE_VERSION_CONFLICT",
      );
    }

    return {
      ...toProfile(row),
      name,
    };
  });
}
