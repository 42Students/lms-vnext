import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { PeopleServiceError } from "./errors";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import { displayNameFromPersonName, personNameSchema } from "./person-name";

/** DB-004 first-party identity: the canonical user row is authoritative.
 * Profile editing never changes verified OTP/email/phone login identifiers.
 * A profile name change is separate from tenant membership/role versions.
 */
export async function getOwnIdentityProfile(context: RequestContext) {
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"identity.self.manage");
  const [row]=await tx.select({
   givenName:users.givenName,familyName:users.familyName,
   displayName:users.displayName,email:users.email,
   version:users.identityProfileVersion,
  }).from(users).where(and(eq(users.id,context.user.id),
   eq(users.platformStatus,"ACTIVE"))).limit(1);
  if(!row)throw new PeopleServiceError("MEMBERSHIP_NOT_FOUND");
  return row;
 });
}

export async function updateOwnIdentityName(context:RequestContext,raw:unknown,
 expectedVersion:number){
 if(!Number.isSafeInteger(expectedVersion)||expectedVersion<1)
  throw new PeopleServiceError("IDENTITY_PROFILE_VERSION_CONFLICT");
 const name=personNameSchema.parse(raw);
 const displayName=displayNameFromPersonName(name);
 return getDb().transaction(async tx=>{
  // Locking and checking the persisted actor before the CAS means an account
  // disabled while a tab is open cannot edit its identity row.
  await assertPersistedPlatformPermission(tx,context,"identity.self.manage",{},
   {actorLock:"update"});
  const [updated]=await tx.update(users).set({
   givenName:name.givenName,familyName:name.familyName||null,
   displayName,identityProfileVersion:sql`${users.identityProfileVersion}+1`,
   updatedAt:new Date(),
  }).where(and(eq(users.id,context.user.id),
   eq(users.platformStatus,"ACTIVE"),
   eq(users.identityProfileVersion,expectedVersion)))
    .returning({givenName:users.givenName,familyName:users.familyName,
      displayName:users.displayName,email:users.email,
      version:users.identityProfileVersion});
  if(!updated)throw new PeopleServiceError("IDENTITY_PROFILE_VERSION_CONFLICT");
  // Audit the successful CAS in the same transaction, without echoing any
  // personal name, phone number or verified email into shared metadata.
  await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.IDENTITY_PERSON_NAME_UPDATED,
   subjectType:"user",subjectId:context.user.id,
   summary:"Own identity name updated",
   metadata:{previousVersion:expectedVersion,nextVersion:updated.version},
  });
  return updated;
 });
}
