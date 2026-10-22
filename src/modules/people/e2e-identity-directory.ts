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
import {buildE2EFixtureManifest,reconcileE2EFixtureManifest,E2E_FIXTURE_INSERT_ORDER} from "./e2e-fixture-manifest";
export {buildE2EFixtureManifest,reconcileE2EFixtureManifest,buildE2EFixtureSeedLedger,E2E_FIXTURE_INSERT_ORDER} from "./e2e-fixture-manifest";
export {seedIsolatedE2EAcademicGraph} from "./e2e-fixture-seed-service";

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

/** Create only the five synthetic identity *users*, never memberships or
 * authentication bypasses. Other fixture writers must use these returned UUIDs
 * for foreign keys and must not claim a full seed until every graph node is
 * persisted. This is intentionally inaccessible in dev preview or production.
 *
 * Operator authorization is an explicit caller assertion, not a request
 * parameter from a public route. The separate test-database gate prevents
 * a local development process from inserting sign-in identities in live data.
 */
export async function persistIsolatedE2EIdentityUsers(input:{
 namespace:string;
 operatorAuthorized:boolean;
}):Promise<{namespace:string;userIds:Record<"facultyA"|"facultyB"|"adminA"|"learnerA"|"learnerB",string>;
 reused:number;created:number}>{
 if(process.env.NODE_ENV==="production"||
    process.env["APP_ENV"]!=="test"||
    process.env["E2E_SEED_ENABLED"]!=="true"||
    process.env["E2E_ISOLATED_DATABASE"]!=="true"||
    process.env["E2E_ALLOW_GRAPH_WRITES"]!=="true"||
    process.env["APP_E2E_SEED_ENABLED"]!=="true"||
    !input.operatorAuthorized)
  throw new Error("E2E_SEED_DISABLED");
 const manifest=buildE2EFixtureManifest(input.namespace);
 const personas=[
  {key:"facultyA" as const,displayName:"E2E Teacher A"},
  {key:"facultyB" as const,displayName:"E2E Teacher B"},
  {key:"adminA" as const,displayName:"E2E Admin A"},
  {key:"learnerA" as const,displayName:"E2E Learner A"},
  {key:"learnerB" as const,displayName:"E2E Learner B"},
 ];
 return getDb().transaction(async tx=>{
  const result={} as Record<typeof personas[number]["key"],string>;
  let reused=0,created=0;
  for(const persona of personas){
   const phone=manifest.testPhones[persona.key];
   const uid=e2eUid(phone);
   const [existing]=await tx.select({id:users.id,identityUid:users.identityUid,
     phoneE164:users.phoneE164,displayName:users.displayName})
     .from(users).where(eq(users.phoneE164,phone)).for("update").limit(1);
   if(existing){
    // Never take over a real person whose phone overlaps the fixture range.
    if(existing.identityUid!==uid||existing.displayName!==persona.displayName)
     throw new Error("E2E_IDENTITY_COLLISION");
    result[persona.key]=existing.id;
    reused++;
    continue;
   }
   const [inserted]=await tx.insert(users).values({
    identityUid:uid,phoneE164:phone,displayName:persona.displayName,
    platformStatus:"ACTIVE",
   }).onConflictDoNothing().returning({id:users.id});
   if(!inserted)throw new Error("E2E_IDENTITY_COLLISION");
   result[persona.key]=inserted.id;
   created++;
  }
  return {namespace:manifest.namespace,userIds:result,reused,created};
 });
}

/** Preview only; fixture creation must be performed by explicit module-owned
 * service writers. This can never create synthetic production identities or
 * grant a role, membership, token or object-read permission. */
export function previewNonproductionE2ESeed(namespace="e2e-dev"){
 if(process.env.NODE_ENV==="production"||
    process.env["E2E_SEED_ENABLED"]!=="true")
  throw new Error("E2E_SEED_DISABLED");
 const manifest=buildE2EFixtureManifest(namespace);
 const decisions=reconcileE2EFixtureManifest(manifest,new Map());
 return {manifest,decisions,requiredWriteOrder:E2E_FIXTURE_INSERT_ORDER,
  persisted:false as const,
  message:"Fixture plan generated. Database seeding and file attestation still require an authorized writer."};
}
