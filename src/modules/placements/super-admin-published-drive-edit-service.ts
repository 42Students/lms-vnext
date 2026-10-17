import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementJobs,placementJobRoleOptions,placementSeasons} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {AuthorizationError} from "@/modules/permissions/policy";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {placementJobIdSchema} from "./validation";
import {superAdminPublishedDriveEditSchema} from "./super-admin-published-drive-edit-model";

/** A published edit changes only public descriptive terms and future application deadline.
 * It does not rewrite historical eligibility snapshots, submitted applications or prior offers.
 */
export async function editSuperAdminPublishedDrive(context:RequestContext,rawJobId:unknown,raw:unknown){
 if(!isSuperAdmin(context))throw new AuthorizationError("placements.manage");
 const acting=await resolveActingCollege(context,"placements.manage");
 const jobId=placementJobIdSchema.parse(rawJobId);
 const cmd=superAdminPublishedDriveEditSchema.parse(raw);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:acting.collegeId,organizationId:acting.organizationId,
  });
  const [job]=await tx.select().from(placementJobs)
   .where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,acting.collegeId)))
   .for("update").limit(1);
  if(!job||job.status!=="PUBLISHED")throw new Error("Only published drives can be edited here.");
  if(job.updatedAt.toISOString()!==cmd.expectedUpdatedAt)
   throw new Error("Drive changed. Reload the current details before saving.");
  const deadline=new Date(cmd.applicationDeadline);
  if(deadline.getTime()<=Date.now())throw new Error("Application deadline must be in the future.");
  const [season]=await tx.select({status:placementSeasons.status}).from(placementSeasons)
   .where(and(eq(placementSeasons.id,job.seasonId),
    eq(placementSeasons.collegeId,acting.collegeId))).limit(1);
  if(season?.status!=="ACTIVE")throw new Error("An inactive season cannot be edited.");
  const [primary]=await tx.select({id:placementJobRoleOptions.id}).from(placementJobRoleOptions)
   .where(and(eq(placementJobRoleOptions.jobId,job.id),
    eq(placementJobRoleOptions.isPrimary,true),eq(placementJobRoleOptions.status,"ACTIVE")))
   .for("update").limit(1);
  if(!primary)throw new Error("A primary job role is required.");
  const [duplicate]=await tx.select({id:placementJobRoleOptions.id}).from(placementJobRoleOptions)
   .where(and(eq(placementJobRoleOptions.jobId,job.id),
    eq(placementJobRoleOptions.isPrimary,false),
    eq(placementJobRoleOptions.status,"ACTIVE"),
    eq(placementJobRoleOptions.title,cmd.title))).limit(1);
  if(duplicate)throw new Error("Another active role already uses this title.");
  const [saved]=await tx.update(placementJobs).set({
   title:cmd.title,description:cmd.description,locations:cmd.locations,
   applicationDeadline:deadline,
   openings:cmd.openings,
   minimumAnnualCtcInr:cmd.minimumAnnualCtcInr,
   maximumAnnualCtcInr:cmd.maximumAnnualCtcInr,
   updatedAt:sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementJobs.updatedAt})+interval '1 millisecond')`,
  }).where(and(eq(placementJobs.id,job.id),eq(placementJobs.status,"PUBLISHED"),
   eq(placementJobs.collegeId,acting.collegeId),
   sql`date_trunc('milliseconds',${placementJobs.updatedAt})=${cmd.expectedUpdatedAt}::timestamptz`))
   .returning({id:placementJobs.id,updatedAt:placementJobs.updatedAt});
  if(!saved)throw new Error("Drive changed. Reload before saving.");
  await tx.update(placementJobRoleOptions).set({
   title:cmd.title,locations:cmd.locations,openings:cmd.openings,
   minimumAnnualCtcInr:cmd.minimumAnnualCtcInr,
   maximumAnnualCtcInr:cmd.maximumAnnualCtcInr,updatedAt:new Date(),
  }).where(eq(placementJobRoleOptions.id,primary.id));
  await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_PUBLISHED_EDITED,
   collegeId:acting.collegeId,organizationId:acting.organizationId,
   subjectType:"placement_job",subjectId:job.id,subjectLabel:job.title,
   summary:"Super Admin edited published placement drive",
   metadata:{reason:cmd.reason,previousTitle:job.title,newTitle:cmd.title,
    oldDeadline:job.applicationDeadline?.toISOString()??null,
    newDeadline:deadline.toISOString(),
    fields:["title","description","locations","applicationDeadline","openings",
     "minimumAnnualCtcInr","maximumAnnualCtcInr"],
    existingApplicationsUnchanged:true},
  });
  return {jobId:saved.id,updatedAt:saved.updatedAt.toISOString()};
 });
}
