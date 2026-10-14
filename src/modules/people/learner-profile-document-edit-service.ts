import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,learnerProfiles,membershipRoles,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {PeopleServiceError} from "./errors";
import {requireOwnLearnerProfileAccess} from "./learner-profile-access-service";
import {learnerProfileDocumentSchema} from "./profile-validation";
import {learnerProfileDocumentEditInputSchema,learnerProfileChangedFields,learnerProfileDocumentIsStale} from "./learner-profile-document-edit-model";
export async function updateOwnLearnerProfileDocument(context:RequestContext,raw:unknown){
  const input=learnerProfileDocumentEditInputSchema.parse(raw);
  const member=await requireOwnLearnerProfileAccess(context);
  if(input.document.identity.aadhaarNumber||input.document.identity.panNumber)
    throw new PeopleServiceError("PRIVATE_IDENTITY_STORAGE_NOT_READY");
  return getDb().transaction(async tx=>{
    const [principal]=await tx.select({id:collegeMemberships.id}).from(collegeMemberships)
      .innerJoin(users,eq(users.id,collegeMemberships.userId))
      .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
      .where(and(eq(collegeMemberships.id,member.id),eq(collegeMemberships.userId,context.user.id),
        eq(collegeMemberships.collegeId,member.collegeId),eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
      .for("update",{of:collegeMemberships}).limit(1);
    if(!principal)throw new AuthorizationError("profile.self.manage");
    await tx.insert(learnerProfiles).values({membershipId:member.id,profileDocument:{}}).onConflictDoNothing();
    const [locked]=await tx.select().from(learnerProfiles).where(eq(learnerProfiles.membershipId,member.id)).for("update").limit(1);
    if(!locked)throw new Error("PROFILE_SAVE_UNAVAILABLE");
    const current=learnerProfileDocumentSchema.parse(locked.profileDocument??{});
    // Check the saved baseline before no-op so a stale replay never bypasses CAS.
    if(learnerProfileDocumentIsStale(current,input.expectedDocument))
      throw new PeopleServiceError("LEARNER_PROFILE_DOCUMENT_STALE");
    const fields=learnerProfileChangedFields(current,input.document);
    if(!fields.length)return {...locked,profileDocument:current};
    const [saved]=await tx.update(learnerProfiles).set({profileDocument:input.document,updatedAt:new Date()})
      .where(eq(learnerProfiles.membershipId,member.id)).returning();
    if(!saved)throw new Error("PROFILE_SAVE_UNAVAILABLE");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.IDENTITY_LEARNER_PROFILE_SECTION_UPDATED,
      collegeId:member.collegeId,organizationId:member.organizationId,
      subjectType:"learner_profile",subjectId:member.id,summary:"Learner updated own profile details",
      metadata:{section:"document",changedFields:fields},
    });
    return {...saved,profileDocument:learnerProfileDocumentSchema.parse(saved.profileDocument)};
  });
}
