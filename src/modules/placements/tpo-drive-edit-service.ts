import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementJobRoleOptions,placementJobs,placementSeasons} from "@/db/schema";
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
 return {...job,updatedAt:job.updatedAt.toISOString(),
  editable:job.status==="DRAFT"&&season?.status==="ACTIVE"};
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
   minimumAnnualCtcInr:input.minimumAnnualCtcInr,maximumAnnualCtcInr:input.maximumAnnualCtcInr,
   fixedCtcLpa:input.fixedCtcLpa===null?null:input.fixedCtcLpa.toFixed(2),
   variableCtcLpa:input.variableCtcLpa===null?null:input.variableCtcLpa.toFixed(2),
   stipendPerMonthInr:input.stipendPerMonthInr,isDream:input.isDream,
   updatedAt:sql`greatest(clock_timestamp(), date_trunc('milliseconds', ${placementJobs.updatedAt}) + interval '1 millisecond')`,
  }).where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,collegeId),
   eq(placementJobs.status,"DRAFT"),
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
  await auditTpoJobChange(tx,context,updated,"PLACEMENTS_TPO_DRIVE_EDITED","edited",{
   reason:input.reason,fromTitle:job.title,toTitle:updated.title,
   fromUpdatedAt:job.updatedAt.toISOString(),toUpdatedAt:updated.updatedAt.toISOString(),
   changedFields:["title","description","locations","openings","minimumAnnualCtcInr","maximumAnnualCtcInr","fixedCtcLpa","variableCtcLpa","stipendPerMonthInr","isDream"],
  });
  return {id:updated.id,status:updated.status,updatedAt:updated.updatedAt.toISOString()};
 });
}
