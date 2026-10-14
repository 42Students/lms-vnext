import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementRecruiterProfiles,users} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {hasActiveRecruiter,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {PlacementsServiceError} from "./errors";
import {normalizeRecruiterDesignation,recruiterDesignationPatchSchema,sameRecruiterProfileVersion} from "./recruiter-designation-model";
export async function updateOwnRecruiterDesignation(context:RequestContext, raw:unknown) {
  const input=recruiterDesignationPatchSchema.parse(raw);
  requirePermission(context,"identity.self.manage");
  if(!hasActiveRecruiter(context) || !context.recruiter ||
    context.recruiter.userId!==context.user.id) throw new AuthorizationError("identity.self.manage");
  const title=normalizeRecruiterDesignation(input.title);
  return getDb().transaction(async tx=>{
    const [profile]=await tx.select({userId:placementRecruiterProfiles.userId,
      companyId:placementRecruiterProfiles.companyId,title:placementRecruiterProfiles.title,
      updatedAt:placementRecruiterProfiles.updatedAt})
      .from(placementRecruiterProfiles)
      .innerJoin(users,eq(users.id,placementRecruiterProfiles.userId))
      .where(and(eq(placementRecruiterProfiles.userId,context.user.id),
        eq(placementRecruiterProfiles.companyId,context.recruiter!.companyId),
        eq(placementRecruiterProfiles.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
      .for("update").limit(1);
    if(!profile) throw new AuthorizationError("identity.self.manage");
    if(!sameRecruiterProfileVersion(profile.updatedAt,input.expectedUpdatedAt))
      throw new PlacementsServiceError("PLACEMENT_RECRUITER_PROFILE_STALE");
    if(profile.title===title) return {title,updatedAt:profile.updatedAt.toISOString(),changed:false};
    const [updated]=await tx.update(placementRecruiterProfiles)
      .set({title,updatedAt:new Date()})
      .where(and(eq(placementRecruiterProfiles.userId,context.user.id),
        eq(placementRecruiterProfiles.companyId,context.recruiter!.companyId),
        eq(placementRecruiterProfiles.status,"ACTIVE"),
        sql`date_trunc('milliseconds', ${placementRecruiterProfiles.updatedAt}) = ${input.expectedUpdatedAt}::timestamptz`))
      .returning({title:placementRecruiterProfiles.title,updatedAt:placementRecruiterProfiles.updatedAt});
    if(!updated) throw new PlacementsServiceError("PLACEMENT_RECRUITER_PROFILE_STALE");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_RECRUITER_PROFILE_UPDATED,
      subjectType:"recruiter_profile",subjectId:context.user.id,
      summary:"Recruiter designation updated",metadata:{field:"title"},
    });
    return {title:updated.title,updatedAt:updated.updatedAt.toISOString(),changed:true};
  });
}
