import "server-only";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,learnerProfiles,membershipRoles,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {PeopleServiceError} from "./errors";
import {requireOwnLearnerProfileAccess} from "./learner-profile-access-service";
import {learnerProfileDocumentSchema,learnerProfileEducationWriteSchema} from "./profile-validation";
import {learnerProfileDocumentEditInputSchema,learnerProfileChangedFields,learnerProfileDocumentIsStale} from "./learner-profile-document-edit-model";
/**
 * Legacy crosswalk: learner self fields live in membership-scoped profile
 * JSON, while Aadhaar/PAN proof requires a separate private receipt-backed
 * store and placement notification toggles live in their own scoped service.
 * Historical numeric learner IDs, file/video object keys and raw identity
 * documents cannot be reconstructed here (no migration was approved).
 *
 * Full-document edits use expectedDocument CAS; a JobPreferences-only patch
 * uses expectedJobPreferences CAS so unrelated sections are never replaced.
 * No cross-service transaction with notification preferences is implied.
 */
const ownJobPreferencesPatchSchema=z.strictObject({
  jobPreferencesPatch:z.record(z.string().max(100),z.unknown())
    .refine(value=>Object.keys(value).length>0,"Choose at least one preference to update"),
  expectedJobPreferences:z.unknown().refine(value=>
    value!==null&&typeof value==="object"&&!Array.isArray(value),
    "The saved job-preference baseline is required"),
});
export async function updateOwnLearnerProfileDocument(context:RequestContext,raw:unknown){
  const input=z.union([learnerProfileDocumentEditInputSchema,ownJobPreferencesPatchSchema]).parse(raw);
  const member=await requireOwnLearnerProfileAccess(context);
  if("document" in input && (input.document.identity.aadhaarNumber||input.document.identity.panNumber))
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
    // Compare only the fields this operation owns. A partial preferences edit
    // must not roll back an unrelated profile section or split-service toggle.
    let nextDocument= current;
    if("document" in input){
      if(learnerProfileDocumentIsStale(current,input.expectedDocument))
        throw new PeopleServiceError("LEARNER_PROFILE_DOCUMENT_STALE");
      nextDocument=input.document;
    }else{
      const expected=learnerProfileDocumentSchema.parse({
        jobPreferences:input.expectedJobPreferences,
      }).jobPreferences;
      if(JSON.stringify(current.jobPreferences)!==JSON.stringify(expected))
        throw new PeopleServiceError("LEARNER_PROFILE_DOCUMENT_STALE");
      nextDocument=learnerProfileDocumentSchema.parse({
        ...current,
        jobPreferences:{...current.jobPreferences,...input.jobPreferencesPatch},
      });
    }
    const fields=learnerProfileChangedFields(current,nextDocument);
    if(fields.includes("education")) learnerProfileEducationWriteSchema.parse(nextDocument.education);
    if(!fields.length)return {...locked,profileDocument:current};
    const [saved]=await tx.update(learnerProfiles).set({profileDocument:nextDocument,updatedAt:new Date()})
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
