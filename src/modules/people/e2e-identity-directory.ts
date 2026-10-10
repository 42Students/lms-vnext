import "server-only";

import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import type {
  IdentityDirectory,
  IdentityDirectoryUser,
} from "./identity";

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

function e2eUid(contact: string) {
  const digest = createHash("sha256")
    .update(contact)
    .digest("hex")
    .slice(0, 32);
  return `e2e-person-${digest}`;
}

async function findByIdentityUid(uid: string) {
  const [row] = await getDb()
    .select({
      identityUid: users.identityUid,
      phoneE164: users.phoneE164,
      email: users.email,
      displayName: users.displayName,
    })
    .from(users)
    .where(eq(users.identityUid, uid))
    .limit(1);

  return row ? toDirectoryUser(row) : null;
}

export const e2eIdentityDirectory: IdentityDirectory = {
  async findByPhone(phoneNumber) {
    const [row] = await getDb()
      .select({
        identityUid: users.identityUid,
        phoneE164: users.phoneE164,
        email: users.email,
        displayName: users.displayName,
      })
      .from(users)
      .where(eq(users.phoneE164, phoneNumber))
      .limit(1);

    return row ? toDirectoryUser(row) : null;
  },

  async findByEmail(email) {
    const [row] = await getDb()
      .select({
        identityUid: users.identityUid,
        phoneE164: users.phoneE164,
        email: users.email,
        displayName: users.displayName,
      })
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
    return {
      uid: e2eUid(
        input.phoneNumber ??
          input.email ??
          "missing-contact",
      ),
      phoneNumber: input.phoneNumber ?? null,
      email: input.email ?? null,
      displayName: input.displayName,
    };
  },

  async updateUser(uid, input) {
    const existing = await findByIdentityUid(uid);
    if (!existing) {
      return {
        uid,
        phoneNumber: input.phoneNumber ?? null,
        email: input.email ?? null,
        displayName: input.displayName ?? null,
      };
    }

    return {
      ...existing,
      phoneNumber:
        input.phoneNumber ??
        existing.phoneNumber,
      email: input.email ?? existing.email,
      displayName:
        input.displayName ??
        existing.displayName,
    };
  },
};
