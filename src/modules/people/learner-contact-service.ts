import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships, learnerProfiles, membershipRoles, users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can } from "@/modules/permissions/policy";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { learnerProfileDocumentSchema } from "./profile-validation";
import { learnerContactEditSchema,learnerContactsAreStale,
 validateLearnerAlternatePhoneAgainstPrimary } from "./learner-contact-model";
import {PeopleServiceError} from "./errors";


export async function updateOwnLearnerContacts(
  context: RequestContext,
  rawInput: unknown,
) {
  const input = learnerContactEditSchema.parse(rawInput);
  const membership = context.membership;
  if (
    !membership ||
    !membership.roles.includes("LEARNER") ||
    !can(context, "profile.self.manage", {
      collegeId: membership.collegeId,
      organizationId: membership.organizationId,
    })
  ) {
    throw new AuthorizationError("profile.self.manage");
  }

  return getDb().transaction(async (tx) => {
    // Lock the same persisted membership, user and role inputs checked by
    // the write. Caller-supplied identity or college IDs are never accepted.
    const [owner] = await tx.select({
      userId: collegeMemberships.userId,
      collegeId: collegeMemberships.collegeId,
      status: collegeMemberships.status,
    }).from(collegeMemberships)
      .where(eq(collegeMemberships.id, membership.id))
      .for("share").limit(1);
    if (!owner || owner.userId !== context.user.id ||
        owner.collegeId !== membership.collegeId ||
        owner.status !== "ACTIVE") {
      throw new AuthorizationError("profile.self.manage");
    }

    const [user] = await tx.select({
      status: users.platformStatus,
      phoneE164: users.phoneE164,
    }).from(users).where(eq(users.id, context.user.id))
      .for("share").limit(1);
    const [role] = await tx.select({ id: membershipRoles.id })
      .from(membershipRoles)
      .where(and(
        eq(membershipRoles.membershipId, membership.id),
        eq(membershipRoles.role, "LEARNER"),
      )).for("share").limit(1);
    if (!user || user.status !== "ACTIVE" || !role) {
      throw new AuthorizationError("profile.self.manage");
    }

    const alternateIssue=validateLearnerAlternatePhoneAgainstPrimary(
      input.contacts.alternatePhone,user.phoneE164);
    if(alternateIssue)throw new PeopleServiceError(alternateIssue);
    // One locked profile row prevents same-contact lost updates while still
    // allowing unrelated profile sections to merge through jsonb_set.
    await tx.insert(learnerProfiles).values({
      membershipId:membership.id,profileDocument:{},
    }).onConflictDoNothing();
    const [locked]=await tx.select({document:learnerProfiles.profileDocument})
      .from(learnerProfiles).where(eq(learnerProfiles.membershipId,membership.id))
      .for("update").limit(1);
    const current=learnerProfileDocumentSchema.shape.contacts.parse(
      (locked?.document as Record<string,unknown>|null|undefined)?.contacts,
    );
    if(input.expectedContacts && learnerContactsAreStale(current,input.expectedContacts))
      throw new PeopleServiceError("LEARNER_CONTACT_STALE");
    if(!learnerContactsAreStale(current,input.contacts))return {contacts:current};
    const [row]=await tx.update(learnerProfiles).set({
      profileDocument:sql`jsonb_set(
        ${learnerProfiles.profileDocument},
        '{contacts}',
        ${JSON.stringify(input.contacts)}::jsonb,
        true
      )`,
      updatedAt:new Date(),
    }).where(eq(learnerProfiles.membershipId,membership.id))
      .returning({document:learnerProfiles.profileDocument});
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.IDENTITY_LEARNER_CONTACT_UPDATED,
      collegeId: membership.collegeId,
      organizationId: membership.organizationId,
      subjectType: "learner_profile",
      subjectId: membership.id,
      summary: "Learner contact details updated",
      // Do not log email/phone values, including in activity metadata.
      metadata: { fields: ["alternatePhone", "contactEmail"] },
    });

    return {
      contacts: learnerProfileDocumentSchema.parse(
        row?.document ?? {},
      ).contacts,
    };
  });
}
