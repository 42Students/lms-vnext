import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, learnerProfiles, membershipRoles, users } from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can } from "@/modules/permissions/policy";
import { validateLearnerProfileSectionEdit,isLearnerProfileSectionStale } from "./learner-profile-section-model";
import {learnerProfileDocumentSchema} from "./profile-validation";
import { PeopleServiceError } from "./errors";
import { syncLearnerEducationProjection } from "./learner-education-projection-service";

/** Sort most recent qualifications for read parity without changing JSONB order. */
export function sortLearnerEducationForView<T extends {id:string;
 startYear?:string;endYear?:string;isCurrentlyPursuing?:boolean;isRecentEducation?:boolean;
}>(items:readonly T[]):T[]{
 return [...items].sort((a,b)=>
  Number(Boolean(b.isCurrentlyPursuing))-Number(Boolean(a.isCurrentlyPursuing)) ||
  Number(b.endYear||0)-Number(a.endYear||0) ||
  Number(b.startYear||0)-Number(a.startYear||0) ||
  Number(Boolean(b.isRecentEducation))-Number(Boolean(a.isRecentEducation)) ||
  a.id.localeCompare(b.id));
}

export async function updateOwnLearnerProfileSection(context:RequestContext,rawInput:unknown) {
  const input=validateLearnerProfileSectionEdit(rawInput);
  const membership=context.membership;
  if(!membership || !membership.roles.includes("LEARNER") ||
      !can(context,"profile.self.manage",{collegeId:membership.collegeId,organizationId:membership.organizationId})) {
    throw new AuthorizationError("profile.self.manage");
  }
  return getDb().transaction(async tx => {
    const [owner]=await tx.select({
      userId:collegeMemberships.userId,collegeId:collegeMemberships.collegeId,
      status:collegeMemberships.status,
    }).from(collegeMemberships).where(eq(collegeMemberships.id,membership.id)).for("share").limit(1);
    const [account]=await tx.select({status:users.platformStatus})
      .from(users).where(eq(users.id,context.user.id)).for("share").limit(1);
    const [role]=await tx.select({id:membershipRoles.id}).from(membershipRoles)
      .where(and(eq(membershipRoles.membershipId,membership.id),eq(membershipRoles.role,"LEARNER")))
      .for("share").limit(1);
    if(!owner || owner.userId!==context.user.id || owner.collegeId!==membership.collegeId ||
       owner.status!=="ACTIVE" || !account || account.status!=="ACTIVE" || !role) {
      throw new AuthorizationError("profile.self.manage");
    }
    // Serialize all edits to this profile before comparing only the target
    // section; other section updates remain independent, and can merge.
    await tx.insert(learnerProfiles).values({
      membershipId:membership.id,profileDocument:{},
    }).onConflictDoNothing();
    const [locked]=await tx.select({document:learnerProfiles.profileDocument})
      .from(learnerProfiles).where(eq(learnerProfiles.membershipId,membership.id))
      .for("update").limit(1);
    const document=(locked?.document??{}) as Record<string,unknown>;
    const current=learnerProfileDocumentSchema.shape[input.section].parse(document[input.section]??[]);
    // Staff correction is a separately permissioned workflow. This
    // self-edit never accepts a client-supplied target membership.
    const view=(items:typeof current)=>input.section==="education"?
      sortLearnerEducationForView<(typeof current)[number]>(items):items;
    if(input.expectedItems!==undefined){
      const before=input.expectedItems;
      if(isLearnerProfileSectionStale(view(current),view(before))) {
        // A list row can have moved or been removed after the editor opened.
        // Never apply a stale index to a different item; the client receives
        // a stable code whose friendly copy tells it to reload first.
        throw new PeopleServiceError("LEARNER_PROFILE_SECTION_STALE");
      }
    }
    if(!isLearnerProfileSectionStale(view(current),view(input.items)))
      return {section:input.section,items:view(current)};
    if (input.section === "education") {
      await syncLearnerEducationProjection(tx, membership.id, input.items);
    }
    const [saved]=await tx.update(learnerProfiles).set({
      profileDocument:sql`jsonb_set(
        ${learnerProfiles.profileDocument},
        ARRAY[${input.section}]::text[],
        ${JSON.stringify(input.items)}::jsonb,
        true
      )`,
      updatedAt:new Date(),
    }).where(eq(learnerProfiles.membershipId,membership.id))
      .returning({document:learnerProfiles.profileDocument});
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.IDENTITY_LEARNER_PROFILE_SECTION_UPDATED,
      collegeId:membership.collegeId,
      organizationId:membership.organizationId,
      subjectType:"learner_profile",
      subjectId:membership.id,
      summary:"Learner updated profile section",
      metadata:{section:input.section,itemCount:input.items.length,
        previousItemCount:current.length,actorUserId:context.user.id,
        subjectMembershipId:membership.id,itemIds:input.items.map(item=>item.id)},
    });
    const savedDocument=saved?.document ?? {};
    return {section:input.section,items:view((savedDocument[input.section] ?? input.items) as typeof current)};
  });
}
