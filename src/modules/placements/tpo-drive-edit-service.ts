import "server-only";
import {and,asc,eq,sql,inArray,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementJobRoleOptions,placementJobs,placementSeasons,placementJobEligibilityPolicies,placementApplications,collegeMemberships,users,inAppNotifications,activityEvents,cohorts,programs,departments} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {placementJobIdSchema} from "./validation";
import {auditTpoJobChange,requireTpoJobActor,requireTpoJobCollege} from "./tpo-job-write-base";
import {evaluateTpoDriveEdit,tpoDriveEditSchema} from "./tpo-drive-edit-model";
export async function getTpoDriveEditState(context:RequestContext,rawJobId:unknown){
 const collegeId=await requireTpoJobCollege(context),jobId=placementJobIdSchema.parse(rawJobId);
 const [job]=await getDb().select({
  id:placementJobs.id,title:placementJobs.title,description:placementJobs.description,
  status:placementJobs.status,seasonId:placementJobs.seasonId,updatedAt:placementJobs.updatedAt,
  applicationDeadline:placementJobs.applicationDeadline,
  locations:placementJobs.locations,openings:placementJobs.openings,
  minimumAnnualCtcInr:placementJobs.minimumAnnualCtcInr,
  maximumAnnualCtcInr:placementJobs.maximumAnnualCtcInr,
  fixedCtcLpa:placementJobs.fixedCtcLpa,variableCtcLpa:placementJobs.variableCtcLpa,
  stipendPerMonthInr:placementJobs.stipendPerMonthInr,isDream:placementJobs.isDream,
 }).from(placementJobs).where(and(eq(placementJobs.id,jobId),
  eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 const [season]=await getDb().select({status:placementSeasons.status}).from(placementSeasons)
 .where(and(eq(placementSeasons.id,job.seasonId),eq(placementSeasons.collegeId,collegeId))).limit(1);
 const [policy]=await getDb().select({
  minCgpaHundredths:placementJobEligibilityPolicies.minCgpaHundredths,
  allowedCohortIds:placementJobEligibilityPolicies.allowedCohortIds,
 })
  .from(placementJobEligibilityPolicies).where(eq(placementJobEligibilityPolicies.jobId,jobId)).limit(1);
 // Keep already-targeted inactive batches visible so a live edit never
 // silently drops a historical cohort restriction.
 const allowedCohortIds=policy?.allowedCohortIds??[];
 const availableBatches=await getDb().select({
  id:cohorts.id,name:cohorts.name,code:cohorts.code,status:cohorts.status,
  program:programs.name,
 }).from(cohorts).innerJoin(programs,eq(programs.id,cohorts.programId))
  .innerJoin(departments,eq(departments.id,programs.departmentId))
  .where(and(eq(departments.collegeId,collegeId),
   or(eq(cohorts.status,"ACTIVE"),
    allowedCohortIds.length?inArray(cohorts.id,allowedCohortIds):undefined)))
  .orderBy(asc(programs.name),asc(cohorts.name),asc(cohorts.id));
 const [counter]=await getDb().select({total:sql<number>`count(distinct ${placementApplications.membershipId})::int`})
  .from(placementApplications)
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .where(and(eq(placementApplications.jobId,jobId),eq(placementApplications.status,"SUBMITTED"),
   eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")));
 return {...job,updatedAt:job.updatedAt.toISOString(),
  applicationDeadline:job.applicationDeadline?.toISOString()??null,
  minCgpaHundredths:policy?.minCgpaHundredths??null,
  allowedCohortIds,availableBatches,applicantCount:Number(counter?.total??0),
  editable:["DRAFT","PUBLISHED"].includes(job.status)&&season?.status==="ACTIVE"};
}
export async function editTpoDrive(context:RequestContext,rawJobId:unknown,raw:unknown){
 const collegeId=await requireTpoJobCollege(context),jobId=placementJobIdSchema.parse(rawJobId);
 const input=tpoDriveEditSchema.parse(raw);
 return getDb().transaction(async tx=>{
  await requireTpoJobActor(tx,context);
  const [job]=await tx.select().from(placementJobs)
   .where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,collegeId)))
   .for("update").limit(1);
  if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  if(job.updatedAt.toISOString()!==input.expectedUpdatedAt)
   throw new PlacementsServiceError("PLACEMENT_JOB_STALE");
  const [season]=await tx.select({status:placementSeasons.status}).from(placementSeasons)
   .where(and(eq(placementSeasons.id,job.seasonId),eq(placementSeasons.collegeId,collegeId))).limit(1);
  const decision=evaluateTpoDriveEdit(job.status,season?.status??null,input);
  if(decision==="INVALID_CTC")throw new PlacementsServiceError("PLACEMENT_JOB_INVALID_CTC_RANGE");
  if(decision==="INVALID_DEADLINE")throw new PlacementsServiceError("PLACEMENT_JOB_NOT_EDITABLE");
  if(decision!=="ALLOW")throw new PlacementsServiceError("PLACEMENT_JOB_NOT_EDITABLE");
  const [role]=await tx.select({id:placementJobRoleOptions.id}).from(placementJobRoleOptions)
   .where(and(eq(placementJobRoleOptions.jobId,jobId),eq(placementJobRoleOptions.isPrimary,true),
    eq(placementJobRoleOptions.status,"ACTIVE"))).limit(1);
  if(!role)throw new PlacementsServiceError("PLACEMENT_ROLE_OPTION_PRIMARY_REQUIRED");
  const [duplicate]=await tx.select({id:placementJobRoleOptions.id}).from(placementJobRoleOptions)
   .where(and(eq(placementJobRoleOptions.jobId,jobId),eq(placementJobRoleOptions.isPrimary,false),
    eq(placementJobRoleOptions.status,"ACTIVE"),eq(placementJobRoleOptions.title,input.title))).limit(1);
  if(duplicate)throw new PlacementsServiceError("PLACEMENT_ROLE_OPTION_DUPLICATE");
  const [updated]=await tx.update(placementJobs).set({
   title:input.title,description:input.description,locations:input.locations,openings:input.openings,
   ...(input.applicationDeadline!==undefined?{applicationDeadline:input.applicationDeadline?new Date(input.applicationDeadline):null}:{}),
   minimumAnnualCtcInr:input.minimumAnnualCtcInr,maximumAnnualCtcInr:input.maximumAnnualCtcInr,
   fixedCtcLpa:input.fixedCtcLpa===null?null:input.fixedCtcLpa.toFixed(2),
   variableCtcLpa:input.variableCtcLpa===null?null:input.variableCtcLpa.toFixed(2),
   stipendPerMonthInr:input.stipendPerMonthInr,isDream:input.isDream,
   updatedAt:sql`greatest(clock_timestamp(), date_trunc('milliseconds', ${placementJobs.updatedAt}) + interval '1 millisecond')`,
  }).where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,collegeId),
   inArray(placementJobs.status,["DRAFT","PUBLISHED"]),
   sql`date_trunc('milliseconds', ${placementJobs.updatedAt}) = ${input.expectedUpdatedAt}::timestamptz`
  )).returning();
  if(!updated)throw new PlacementsServiceError("PLACEMENT_JOB_STALE");
  const [savedRole]=await tx.update(placementJobRoleOptions).set({
   title:updated.title,locations:updated.locations,openings:updated.openings,
   minimumAnnualCtcInr:updated.minimumAnnualCtcInr,
   maximumAnnualCtcInr:updated.maximumAnnualCtcInr,updatedAt:new Date(),
  }).where(and(eq(placementJobRoleOptions.id,role.id),
   eq(placementJobRoleOptions.jobId,job.id),
   eq(placementJobRoleOptions.isPrimary,true),
   eq(placementJobRoleOptions.status,"ACTIVE"))).returning({id:placementJobRoleOptions.id});
  if(!savedRole)throw new PlacementsServiceError("PLACEMENT_ROLE_OPTION_PRIMARY_REQUIRED");
  const [existingPolicy]=await tx.select({
   allowedCohortIds:placementJobEligibilityPolicies.allowedCohortIds,
   minCgpaHundredths:placementJobEligibilityPolicies.minCgpaHundredths,
  }).from(placementJobEligibilityPolicies)
   .where(eq(placementJobEligibilityPolicies.jobId,job.id)).limit(1);
  if(input.allowedCohortIds!==undefined&&input.allowedCohortIds.length){
   const linked=await tx.select({id:cohorts.id,status:cohorts.status})
    .from(cohorts).innerJoin(programs,eq(programs.id,cohorts.programId))
    .innerJoin(departments,eq(departments.id,programs.departmentId))
    .where(and(eq(departments.collegeId,collegeId),
      inArray(cohorts.id,input.allowedCohortIds)))
    .for("share",{of:cohorts});
   if(linked.length!==input.allowedCohortIds.length||
      linked.some(batch=>batch.status!=="ACTIVE"&&
        !(existingPolicy?.allowedCohortIds??[]).includes(batch.id)))
     throw new PlacementsServiceError("PLACEMENT_JOB_NOT_EDITABLE");
  }
  if(input.minCgpaHundredths!==undefined||input.allowedCohortIds!==undefined){
   const minCgpaHundredths=input.minCgpaHundredths===undefined
    ?existingPolicy?.minCgpaHundredths??null:input.minCgpaHundredths;
   const allowedCohortIds=input.allowedCohortIds??existingPolicy?.allowedCohortIds??[];
   await tx.insert(placementJobEligibilityPolicies).values({
    jobId:job.id,updatedByUserId:context.user.id,minCgpaHundredths,allowedCohortIds,
   }).onConflictDoUpdate({target:placementJobEligibilityPolicies.jobId,
    set:{minCgpaHundredths,allowedCohortIds,
      updatedByUserId:context.user.id,updatedAt:new Date()}});
  }
  await auditTpoJobChange(tx,context,updated,"PLACEMENTS_TPO_DRIVE_EDITED","edited",{
   reason:input.reason,fromTitle:job.title,toTitle:updated.title,
   notifyApplicants:input.notifyApplicants,fromDeadline:job.applicationDeadline?.toISOString()??null,
   toDeadline:updated.applicationDeadline?.toISOString()??null,
   fromUpdatedAt:job.updatedAt.toISOString(),toUpdatedAt:updated.updatedAt.toISOString(),
   changedFields:["title","description","locations","openings","minimumAnnualCtcInr","maximumAnnualCtcInr","fixedCtcLpa","variableCtcLpa","stipendPerMonthInr","isDream",...(input.allowedCohortIds!==undefined?["allowedCohortIds"]:[])],
  });
  let notified=0;
  if(job.status==="PUBLISHED"&&input.notifyApplicants){
   const recipients=await tx.selectDistinct({userId:users.id}).from(placementApplications)
    .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .where(and(eq(placementApplications.jobId,job.id),eq(placementApplications.status,"SUBMITTED"),
      eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE"),
      eq(users.platformStatus,"ACTIVE")));
   if(recipients.length){
    const [event]=await tx.insert(activityEvents).values({
     organizationId:context.membership!.organizationId,collegeId,actorUserId:context.user.id,
     actorMembershipId:context.membership!.id,module:"PLACEMENTS",
     eventType:"placements.drive.live_edit_notification",subjectType:"placement_job",subjectId:job.id,
     summary:"Placement cell notified applicants about changes to "+updated.title,
     metadata:{reason:input.reason,applicants:recipients.length},occurredAt:new Date(),
    }).returning({id:activityEvents.id});
    if(!event)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_EDITABLE");
    for(let i=0;i<recipients.length;i+=250)
     await tx.insert(inAppNotifications).values(recipients.slice(i,i+250).map(recipient=>({
      userId:recipient.userId,eventId:event.id,title:"Drive details updated",
      body:"The placement cell updated "+updated.title+". Review the drive details before your next step.",
      actionHref:"/learn/my-placements",
     })));
    notified=recipients.length;
   }
  }
  return {id:updated.id,status:updated.status,updatedAt:updated.updatedAt.toISOString(),notified};
 });
}
