import "server-only";
import {and,desc,eq,ilike,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementApplicationScreenings,
 placementJobRoleOptions,placementJobs,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {requireTpoJobCollege} from "./tpo-job-write-base";
import {projectTpoDriveApplicationsExport,tpoDriveApplicationsExportQuerySchema,
 TPO_DRIVE_APPLICATION_EXPORT_LIMIT,tpoApplicantExportSearchPattern} from "./tpo-drive-applications-export-model";
export async function getTpoDriveApplicationsExport(context:RequestContext,raw:unknown){
 const collegeId=await requireTpoJobCollege(context);
 const {jobId,stage,search,channel}=tpoDriveApplicationsExportQuerySchema.parse(raw);
 const db=getDb();
 const [job]=await db.select({id:placementJobs.id,title:placementJobs.title})
  .from(placementJobs).where(and(eq(placementJobs.id,jobId),
   eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 const records=await db.select({
  applicationId:placementApplications.id,studentName:users.displayName,
  roleTitle:placementJobRoleOptions.title,status:placementApplications.status,
  screeningStatus:placementApplicationScreenings.status,
  channel:placementApplications.channel,submittedAt:placementApplications.submittedAt,
 }).from(placementApplications)
  .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
   eq(collegeMemberships.collegeId,collegeId)))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(placementJobRoleOptions,and(eq(placementJobRoleOptions.id,placementApplications.roleOptionId),
   eq(placementJobRoleOptions.jobId,job.id)))
  .leftJoin(placementApplicationScreenings,
   eq(placementApplicationScreenings.applicationId,placementApplications.id))
  .where(and(eq(placementApplications.jobId,job.id),
   channel!=="ALL"?eq(placementApplications.channel,channel):undefined,
   stage==="ALL"?undefined:stage==="SUBMITTED"?eq(placementApplications.status,"SUBMITTED"):
    sql`case when ${placementApplications.status} = 'WITHDRAWN' then 'WITHDRAWN'
     when ${placementApplicationScreenings.status} in ('SHORTLISTED','HOLD','REJECTED')
     then ${placementApplicationScreenings.status}::text else 'PENDING' end = ${stage}::text`,
   search?or(ilike(users.displayName,tpoApplicantExportSearchPattern(search)),
    ilike(placementJobRoleOptions.title,tpoApplicantExportSearchPattern(search))):undefined,
  ))
  .orderBy(desc(placementApplications.submittedAt),placementApplications.id)
  .limit(TPO_DRIVE_APPLICATION_EXPORT_LIMIT+1);
 return {job,stage,search,channel,...projectTpoDriveApplicationsExport(records.map(r=>({
  ...r,submittedAt:r.submittedAt.toISOString(),
 })),job.title)};
}
