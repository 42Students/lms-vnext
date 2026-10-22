import "server-only";

import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import type {
  IdentityDirectory,
  IdentityDirectoryUser,
} from "./identity";
import {PeopleServiceError} from "./errors";
import {buildE2EFixtureManifest,reconcileE2EFixtureManifest} from "./e2e-fixture-manifest";
export {buildE2EFixtureManifest,reconcileE2EFixtureManifest} from "./e2e-fixture-manifest";

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
    // Deterministic fixture IDs must not collapse every missing-contact person
    // into one synthetic identity. The production resolver forbids this too.
    if(!input.phoneNumber&&!input.email)
      throw new PeopleServiceError("IDENTITY_CONTACT_REQUIRED");
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

/** Preview only; fixture creation must be performed by explicit module-owned
 * service writers. This can never create synthetic production identities or
 * grant a role, membership, token or object-read permission. */
export function previewNonproductionE2ESeed(namespace="e2e-dev"){
 if(process.env.NODE_ENV==="production"||
    process.env.E2E_SEED_ENABLED!=="true")
  throw new Error("E2E_SEED_DISABLED");
 const manifest=buildE2EFixtureManifest(namespace);
 const decisions=reconcileE2EFixtureManifest(manifest,new Map());
 return {manifest,decisions,persisted:false as const,
  message:"Fixture plan generated. Database seeding and file attestation still require an authorized writer."};
}
