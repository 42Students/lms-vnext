import "server-only";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,placementCompanyRelationships,placementJobs,placementSeasons} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {AuthorizationError} from "@/modules/permissions/policy";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";

export async function reopenCollegeDrive(context:RequestContext,rawJobId:unknown,raw:unknown){
 const jobId=z.string().uuid().parse(rawJobId);
 z.strictObject({confirmed:z.literal(true)}).parse(raw);
 const collegeId=await requireCollegePlacementAdmin(context);
 const acting=await resolveActingCollege(context,"placements.manage");
 if (acting.collegeId !== collegeId) throw new AuthorizationError("placements.manage");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId,organizationId:acting.organizationId,
  });
  const [row]=await tx.select({id:placementJobs.id,title:placementJobs.title,
   status:placementJobs.status,seasonId:placementJobs.seasonId,
   relationshipId:placementJobs.companyRelationshipId,
  }).from(placementJobs).where(and(eq(placementJobs.id,jobId),
   eq(placementJobs.collegeId,collegeId))).for("update").limit(1);
  if(!row||row.status!=="CLOSED")throw Error("Only a closed drive can be reopened.");
  const [season]=await tx.select({id:placementSeasons.id})
   .from(placementSeasons).where(and(eq(placementSeasons.id,row.seasonId),
    eq(placementSeasons.collegeId,collegeId),eq(placementSeasons.status,"ACTIVE"))).limit(1);
  const [relationship]=await tx.select({id:placementCompanyRelationships.id})
   .from(placementCompanyRelationships).where(and(
    eq(placementCompanyRelationships.id,row.relationshipId),
    eq(placementCompanyRelationships.collegeId,collegeId),
    eq(placementCompanyRelationships.status,"ACTIVE"))).limit(1);
  if(!season||!relationship)throw Error("Season or employer relationship is no longer active.");
  const [saved]=await tx.update(placementJobs).set({
   status:"PUBLISHED",closedAt:null,updatedAt:new Date(),
  }).where(and(eq(placementJobs.id,row.id),eq(placementJobs.status,"CLOSED"))).returning({
   id:placementJobs.id,status:placementJobs.status,
  });
  if(!saved)throw Error("Drive state changed. Refresh and retry.");
  await tx.insert(activityEvents).values({
   organizationId:acting.organizationId,collegeId,
   actorUserId:context.user.id,actorMembershipId:context.membership?.id??null,
   module:"PLACEMENTS",eventType:"PLACEMENTS_COLLEGE_DRIVE_REOPENED",
   subjectType:"placement_job",subjectId:jobId,
   summary:"Placement Admin reopened drive "+row.title,
   metadata:{oldStatus:row.status,newStatus:saved.status,
    withdrawnOffersNotRestored:true},
  });
  return saved;
 });
}
