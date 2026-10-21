import "server-only";
import {and,count,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {placementApplications,placementJobs,placementOffers,placementJobRounds} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {collegeDriveIdSchema} from "./college-drive-read-model";
import {archivePlacementJob} from "./job-service";

export async function previewCollegeDriveArchive(ctx:RequestContext,rawId:unknown){
 const jobId=collegeDriveIdSchema.parse(rawId);
 const collegeId=await requireCollegePlacementAdmin(ctx);
 const db=getDb();
 const [job]=await db.select({id:placementJobs.id,title:placementJobs.title,
  status:placementJobs.status,archivedAt:placementJobs.archivedAt})
  .from(placementJobs).where(and(eq(placementJobs.id,jobId),
   eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!job)throw Error("Drive not found in your college.");
 const [apps,rounds,offers]=await Promise.all([
  db.select({total:count()}).from(placementApplications)
   .where(eq(placementApplications.jobId,jobId)),
  db.select({total:count()}).from(placementJobRounds)
   .where(eq(placementJobRounds.jobId,jobId)),
  db.select({status:placementOffers.status,total:count()}).from(placementOffers)
   .innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
   .where(eq(placementApplications.jobId,jobId)).groupBy(placementOffers.status),
 ]);
 return {
  job,canArchive:job.status!=="PUBLISHED"&&job.status!=="ARCHIVED",
  applications:apps[0]?.total??0,rounds:rounds[0]?.total??0,
  offers:Object.fromEntries(offers.map(row=>[row.status,row.total])),
  note:"Archive hides the drive from active lists but retains its applications, interviews, offer history and audit trail. Published drives must be closed first. Archiving retains scheduled interviews and does not currently issue the legacy cancellation notifications automatically; review affected candidates before proceeding.",
 };
}
export async function archiveCollegeDrive(ctx:RequestContext,rawId:unknown,raw:unknown){
 z.strictObject({confirmed:z.literal(true)}).parse(raw);
 const preview=await previewCollegeDriveArchive(ctx,rawId);
 if(!preview.canArchive)throw Error("Close the drive before archiving it.");
 return archivePlacementJob(ctx,preview.job.id);
}
