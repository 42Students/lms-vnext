import "server-only";

import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import type {
  IdentityDirectory,
  IdentityDirectoryUser,
} from "./identity";
import {PeopleServiceError} from "./errors";

/**
 * Identity directory backed by the platform's own `users` table.
 *
 * vNext authenticates people with first-party one-time codes, so there is no
 * external identity provider to consult. The directory only answers "who
 * already owns this phone or email?" and mints a fresh opaque identity UID
 * for a new person. The `users` row itself is written by the caller inside
 * its own transaction, where the unique indexes on identity_uid, phone and
 * case-insensitive email arbitrate any concurrent creation.
 */

const columns = {
  identityUid: users.identityUid,
  phoneE164: users.phoneE164,
  email: users.email,
  displayName: users.displayName,
};

function toDirectoryUser(row: {
  identityUid: string;
  phoneE164: string | null;
  email: string | null;
  displayName: string | null;
}): IdentityDirectoryUser {
  return {
    uid: row.identityUid,
    phoneNumber: row.phoneE164,
    email: row.email,
    displayName: row.displayName,
  };
}

async function findByIdentityUid(uid: string) {
  const [row] = await getDb()
    .select(columns)
    .from(users)
    .where(eq(users.identityUid, uid))
    .limit(1);

  return row ? toDirectoryUser(row) : null;
}

export const localIdentityDirectory: IdentityDirectory = {
  async findByPhone(phoneNumber) {
    const [row] = await getDb()
      .select(columns)
      .from(users)
      .where(eq(users.phoneE164, phoneNumber))
      .limit(1);

    return row ? toDirectoryUser(row) : null;
  },

  async findByEmail(email) {
    const [row] = await getDb()
      .select(columns)
      .from(users)
      .where(
        sql<boolean>`lower(${users.email}) = ${email
          .trim()
          .toLowerCase()}`,
      )
      .limit(1);

    return row ? toDirectoryUser(row) : null;
  },

  async createUser(input) {
    // Accounts must have at least one verified contact path for OTP login.
    // The identity resolver enforces this, but direct adapter callers must
    // not silently allocate unreachable accounts either.
    if(!input.phoneNumber&&!input.email)
      throw new PeopleServiceError("IDENTITY_CONTACT_REQUIRED");
    return {
      uid: `lms_${randomUUID()}`,
      phoneNumber: input.phoneNumber ?? null,
      email: input.email ?? null,
      displayName: input.displayName,
    };
  },

  async updateUser(uid, input) {
    const existing = await findByIdentityUid(uid);

    return {
      uid,
      phoneNumber:
        input.phoneNumber ?? existing?.phoneNumber ?? null,
      email: input.email ?? existing?.email ?? null,
      displayName:
        input.displayName ?? existing?.displayName ?? null,
    };
  },
};
