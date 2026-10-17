import "server-only";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,placementJobs} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {collegeDriveIdSchema} from "./college-drive-read-model";
const input=z.strictObject({
 deadline:z.iso.datetime({offset:true}),
 confirmed:z.literal(true),
});
export async function extendCollegeDriveDeadline(ctx:RequestContext,rawId:unknown,raw:unknown){
 const id=collegeDriveIdSchema.parse(rawId),value=input.parse(raw);
 const collegeId=await requireCollegePlacementAdmin(ctx);
 const deadline=new Date(value.deadline);
 if(deadline<=new Date())throw Error("Choose a future deadline.");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:ctx.membership!.organizationId,
  });
  const [job]=await tx.select({id:placementJobs.id,title:placementJobs.title,
   status:placementJobs.status,deadline:placementJobs.applicationDeadline})
   .from(placementJobs).where(and(eq(placementJobs.id,id),
    eq(placementJobs.collegeId,collegeId))).for("update").limit(1);
  if(!job||job.status!=="PUBLISHED")throw Error("Only active drives can extend their deadlines.");
  if(job.deadline&&deadline<=job.deadline)throw Error("The new deadline must be later than the existing deadline.");
  const [saved]=await tx.update(placementJobs).set({
   applicationDeadline:deadline,updatedAt:new Date(),
  }).where(and(eq(placementJobs.id,id),eq(placementJobs.status,"PUBLISHED")))
  .returning({id:placementJobs.id,deadline:placementJobs.applicationDeadline});
  if(!saved)throw Error("Drive changed; refresh and retry.");
  await tx.insert(activityEvents).values({
   organizationId:ctx.membership!.organizationId,collegeId,
   actorUserId:ctx.user.id,actorMembershipId:ctx.membership!.id,
   module:"PLACEMENTS",eventType:"PLACEMENTS_COLLEGE_DRIVE_DEADLINE_EXTENDED",
   subjectType:"placement_job",subjectId:id,summary:"Extended application deadline for "+job.title,
   metadata:{oldDeadline:job.deadline?.toISOString()??null,
    newDeadline:deadline.toISOString()},
  });
  return {id:saved.id,deadline:saved.deadline?.toISOString()??null};
 });
}
