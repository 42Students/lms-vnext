import "server-only";
import {and,count,eq,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementApplications,placementJobs,placementJobRounds,placementJobRoundEvents,
 placementOffers,placementOfferStatusHistory,
 collegeMemberships,inAppNotifications} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {isSuperAdmin} from "@/modules/identity/context";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {AuthorizationError} from "@/modules/permissions/policy";
import {placementJobIdSchema} from "./validation";
import {superAdminArchiveCommandSchema,canArchiveDriveWithImpact,sameArchiveImpact} from "./super-admin-drive-archive-model";
type Tx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
async function getImpact(tx:Tx,jobId:string) {
 const [applications,rounds,offers]=await Promise.all([
  tx.select({membershipId:placementApplications.membershipId,status:placementApplications.status})
   .from(placementApplications).where(eq(placementApplications.jobId,jobId)),
  tx.select({id:placementJobRounds.id}).from(placementJobRounds)
   .where(and(eq(placementJobRounds.jobId,jobId),
    inArray(placementJobRounds.status,["PENDING","SCHEDULED"]))),
  tx.select({status:placementOffers.status,n:count()}).from(placementOffers)
   .innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
   .where(eq(placementApplications.jobId,jobId)).groupBy(placementOffers.status),
 ]);
 return {
  activeApplications:applications.filter(a=>a.status==="SUBMITTED").length,
  affectedLearners:new Set(applications.map(a=>a.membershipId)).size,
  openRounds:rounds.length,
  issuedOffers:offers.find(o=>o.status==="ISSUED")?.n??0,
  acceptedOffers:offers.find(o=>o.status==="ACCEPTED")?.n??0,
 };
}
async function scope(context:RequestContext){
 if(!isSuperAdmin(context))throw new AuthorizationError("placements.manage");
 return resolveActingCollege(context,"placements.manage");
}
export async function previewSuperAdminDriveArchive(context:RequestContext,rawJobId:unknown){
 const jobId=placementJobIdSchema.parse(rawJobId),acting=await scope(context);
 return getDb().transaction(async tx=>{
  const [job]=await tx.select({id:placementJobs.id,title:placementJobs.title,status:placementJobs.status,
   updatedAt:placementJobs.updatedAt}).from(placementJobs).where(and(
    eq(placementJobs.id,jobId),eq(placementJobs.collegeId,acting.collegeId))).limit(1);
  if(!job)throw new Error("Drive is unavailable in this college.");
  const impact=await getImpact(tx,jobId);
  return {jobId,title:job.title,status:job.status,expectedUpdatedAt:job.updatedAt.toISOString(),
   impact,archivable:canArchiveDriveWithImpact(job.status,impact)};
 });
}
export async function archiveSuperAdminDrive(context:RequestContext,rawJobId:unknown,raw:unknown){
 const jobId=placementJobIdSchema.parse(rawJobId),input=superAdminArchiveCommandSchema.parse(raw);
 const acting=await scope(context);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:acting.collegeId,organizationId:acting.organizationId,
  });
  const [job]=await tx.select().from(placementJobs)
   .where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,acting.collegeId)))
   .for("update").limit(1);
  if(!job)throw new Error("Drive no longer exists in this college.");
  if(job.updatedAt.toISOString()!==input.expectedUpdatedAt)
   throw new Error("Drive changed. Refresh the impact preview.");
  const current=await getImpact(tx,jobId);
  if(!sameArchiveImpact(current,input.expectedImpact))
   throw new Error("Drive applications or interviews changed. Refresh the impact preview.");
  if(!canArchiveDriveWithImpact(job.status,current))
   throw new Error("Resolve accepted offers before deleting the drive.");
  const now=new Date();
  const [saved]=await tx.update(placementJobs).set({
   status:"ARCHIVED",archivedAt:now,
   closedAt:job.status==="PUBLISHED"?now:job.closedAt,
   updatedAt:sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementJobs.updatedAt})+interval '1 millisecond')`,
  }).where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,acting.collegeId),
   sql`date_trunc('milliseconds',${placementJobs.updatedAt})=${input.expectedUpdatedAt}::timestamptz`))
   .returning({id:placementJobs.id});
  if(!saved)throw new Error("Drive changed. Refresh the impact preview.");
  const cancelledRounds=await tx.update(placementJobRounds).set({
   status:"CANCELLED",cancelledAt:now,updatedAt:now,
  }).where(and(eq(placementJobRounds.jobId,jobId),
   inArray(placementJobRounds.status,["PENDING","SCHEDULED"])))
   .returning({id:placementJobRounds.id});
  if(cancelledRounds.length)await tx.insert(placementJobRoundEvents).values(
   cancelledRounds.map(r=>({roundId:r.id,eventType:"CANCELLED" as const,
    actorUserId:context.user.id,metadata:{reason:input.reason,cause:"DRIVE_ARCHIVED"}}))
  );
  const issued=await tx.select({id:placementOffers.id}).from(placementOffers)
   .innerJoin(placementApplications,eq(placementOffers.applicationId,placementApplications.id))
   .where(and(eq(placementApplications.jobId,jobId),eq(placementOffers.status,"ISSUED")))
   .for("update",{of:placementOffers});
  for(const entry of issued){
   await tx.update(placementOffers).set({
    status:"WITHDRAWN",withdrawnByUserId:context.user.id,withdrawnAt:now,updatedAt:now,
   }).where(eq(placementOffers.id,entry.id));
   await tx.insert(placementOfferStatusHistory).values({
    offerId:entry.id,fromStatus:"ISSUED",toStatus:"WITHDRAWN",
    actorUserId:context.user.id,reason:input.reason,
   });
  }
  const audit=await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_ARCHIVED,
   collegeId:acting.collegeId,organizationId:acting.organizationId,
   subjectType:"placement_job",subjectId:job.id,subjectLabel:job.title,
   summary:"Super Admin archived placement drive",
   metadata:{previousStatus:job.status,reason:input.reason,...current,
    cancelledRounds:cancelledRounds.length,issuedOffersWithdrawn:issued.length},
  });
  const recipients=await tx.select({userId:collegeMemberships.userId}).from(placementApplications)
   .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
   .where(eq(placementApplications.jobId,jobId));
  const distinct=[...new Set(recipients.map(r=>r.userId))];
  for(let i=0;i<distinct.length;i+=200){
   await tx.insert(inAppNotifications).values(distinct.slice(i,i+200).map(userId=>({
    userId,eventId:audit.id,title:"Placement drive archived",
    body:"The "+job.title+" drive has been archived. "+input.reason,
    actionHref:"/learn/my-placements/applications",
   }))).onConflictDoNothing();
  }
  return {jobId,status:"ARCHIVED" as const,cancelledRounds:cancelledRounds.length,
   offersWithdrawn:issued.length,learnersNotified:distinct.length};
 });
}
