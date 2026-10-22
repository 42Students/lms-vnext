import "server-only";
import {and,asc,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {placementJobEligibilityPolicies,placementJobRoleOptions,placementJobRounds,placementJobRoundEvents,placementJobs} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {createPlacementJob} from "./job-service";
import {requireTpoJobCollege} from "./tpo-job-write-base";
import {placementJobIdSchema} from "./validation";
import {PlacementsServiceError} from "./errors";
import {cloneTpoEligibilityAudience} from "./tpo-drive-clone-eligibility-model";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";

const cloneCommand=z.object({confirmed:z.literal(true)}).strict();

/** TPO-drives-26 / TPO-drive-workspace-05. Clone into a fresh season as DRAFT. */
export async function cloneTpoDrive(context:RequestContext,rawJobId:unknown,raw:unknown){
 cloneCommand.parse(raw);
 const collegeId=await requireTpoJobCollege(context),jobId=placementJobIdSchema.parse(rawJobId);
 const [source]=await getDb().select().from(placementJobs).where(and(
  eq(placementJobs.id,jobId),eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!source)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 if(!["CLOSED","CANCELLED","REJECTED"].includes(source.status))
  throw new Error("Only completed or cancelled drives can be run again.");
 const draft=await createPlacementJob(context,{
  collegeId,companyRelationshipId:source.companyRelationshipId,
  title:source.title.slice(0,100),description:("Copied from "+source.title+" (historical drive "+source.id+"). Review every field before publishing.\n\n"+source.description).slice(0,15000),
  employmentType:source.employmentType as "FULL_TIME"|"INTERNSHIP"|"CONTRACT",
  workMode:source.workMode as "ONSITE"|"REMOTE"|"HYBRID",
  locations:source.locations,openings:source.openings,
  minimumAnnualCtcInr:source.minimumAnnualCtcInr,
  maximumAnnualCtcInr:source.maximumAnnualCtcInr,
  // Never carry a past deadline or old company portal URL into a new drive.
  applicationMode:"INTERNAL",externalApplicationUrl:null,applicationDeadline:null,
 });
 if(!draft)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 // Copy active non-primary packages while the newly created draft remains unpublished.
 const [oldPolicy]=await getDb().select().from(placementJobEligibilityPolicies)
  .where(eq(placementJobEligibilityPolicies.jobId,source.id)).limit(1);
 // A single ordered read preserves historical JSON package array order.
 const options=await getDb().select().from(placementJobRoleOptions)
  .where(and(eq(placementJobRoleOptions.jobId,source.id),
   eq(placementJobRoleOptions.status,"ACTIVE")))
  .orderBy(asc(placementJobRoleOptions.createdAt),asc(placementJobRoleOptions.id));
 options.sort((a,b)=>(a.position??32767)-(b.position??32767)||
  a.createdAt.getTime()-b.createdAt.getTime()||a.id.localeCompare(b.id));
 // Legacy "Copy drive" also copies the round plan. Historic dates, venues,
 // test/meeting links and results belong to the old cohort, not this draft.
 const sourceRounds=await getDb().select().from(placementJobRounds)
  .where(eq(placementJobRounds.jobId,source.id))
  .orderBy(asc(placementJobRounds.sequence),asc(placementJobRounds.id));
 const cloneableRounds=sourceRounds.filter(round=>round.status!=="CANCELLED");
 await getDb().transaction(async tx=>{
  await tx.update(placementJobs).set({
    isDream:source.isDream,legacyJobCategory:source.legacyJobCategory,
    legacyCategoryOverrideReason:source.legacyCategoryOverrideReason,
    stipendPerMonthInr:source.stipendPerMonthInr,
    ctcLpa:source.ctcLpa,fixedCtcLpa:source.fixedCtcLpa,
    variableCtcLpa:source.variableCtcLpa,updatedAt:new Date(),
  }).where(and(eq(placementJobs.id,draft.id),eq(placementJobs.status,"DRAFT")));
  const audience=oldPolicy?cloneTpoEligibilityAudience({
    allowedCohortIds:oldPolicy.allowedCohortIds??[],
    allowedPassingYears:oldPolicy.allowedPassingYears??[],
  },new Date().getUTCFullYear()):null;
  if(oldPolicy&&audience)await tx.insert(placementJobEligibilityPolicies).values({
    jobId:draft.id,allowedProgramIds:oldPolicy.allowedProgramIds,
    allowedCohortIds:audience.allowedCohortIds,allowedSectionIds:oldPolicy.allowedSectionIds,
    minCgpaHundredths:oldPolicy.minCgpaHundredths,
    maxActiveBacklogs:oldPolicy.maxActiveBacklogs,maxPastBacklogs:oldPolicy.maxPastBacklogs,
    minTenthPctBasisPoints:oldPolicy.minTenthPctBasisPoints,
    minTwelfthPctBasisPoints:oldPolicy.minTwelfthPctBasisPoints,
    minDiplomaPctBasisPoints:oldPolicy.minDiplomaPctBasisPoints,
    minUndergraduatePctBasisPoints:oldPolicy.minUndergraduatePctBasisPoints,
    minPctThroughoutBasisPoints:oldPolicy.minPctThroughoutBasisPoints,
    maxGapYears:oldPolicy.maxGapYears,allowedPassingYears:audience.allowedPassingYears,
    requireVerifiedEvidence:oldPolicy.requireVerifiedEvidence,
    missingEvidencePolicy:oldPolicy.missingEvidencePolicy,updatedByUserId:context.user.id,
  });
  const [primary]=await tx.select({id:placementJobRoleOptions.id}).from(placementJobRoleOptions)
    .where(and(eq(placementJobRoleOptions.jobId,draft.id),
      eq(placementJobRoleOptions.isPrimary,true))).limit(1);
  const primarySource=options.find(row=>row.isPrimary);
  if(primary&&primarySource){
   await tx.update(placementJobRoleOptions).set({
    title:primarySource.title,position:primarySource.position,
    ctcLpa:primarySource.ctcLpa,
    stipendPerMonthInr:primarySource.stipendPerMonthInr,
    stipendMonths:primarySource.stipendMonths,
    fixedLpa:primarySource.fixedLpa,variableLpa:primarySource.variableLpa,
    joiningBonusLpa:primarySource.joiningBonusLpa,bondMonths:primarySource.bondMonths,
    bondAmount:primarySource.bondAmount,updatedAt:new Date(),
   }).where(eq(placementJobRoleOptions.id,primary.id));
  }else if(primary&&!primarySource){
   // An empty legacy roleOptionsJson displayed one editable Default package.
   // The new draft already has a canonical primary role option.
   await tx.update(placementJobRoleOptions).set({
    title:"Default",position:null,updatedAt:new Date(),
   }).where(eq(placementJobRoleOptions.id,primary.id));
  }
  for(const option of options.filter(row=>!row.isPrimary)){
   await tx.insert(placementJobRoleOptions).values({
    jobId:draft.id,title:option.title,position:option.position,
    employmentType:option.employmentType,
    workMode:option.workMode,locations:option.locations,openings:option.openings,
    minimumAnnualCtcInr:option.minimumAnnualCtcInr,
    maximumAnnualCtcInr:option.maximumAnnualCtcInr,
    ctcLpa:option.ctcLpa,stipendPerMonthInr:option.stipendPerMonthInr,
    stipendMonths:option.stipendMonths,
    fixedLpa:option.fixedLpa,variableLpa:option.variableLpa,
    joiningBonusLpa:option.joiningBonusLpa,bondMonths:option.bondMonths,
    bondAmount:option.bondAmount,isPrimary:false,
   });
  }
  for(const [index,round] of cloneableRounds.entries()){
   const [copied]=await tx.insert(placementJobRounds).values({
    jobId:draft.id,sequence:index+1,status:"PENDING",
    kind:round.kind,name:round.name,
    legacyRoundDescription:round.legacyRoundDescription,
    legacyInterviewType:round.legacyInterviewType,
    whatToBring:round.whatToBring,platform:round.platform,
    durationMinutes:round.durationMinutes,
    // Dates, venue, room and all external links are intentionally blank.
    scheduledAt:null,assessmentDueAt:null,resultsDueAt:null,
    timezone:null,mode:null,venue:null,meetingUrl:null,testUrl:null,
    createdByUserId:context.user.id,
   }).returning({id:placementJobRounds.id});
   if(!copied)throw new Error("CLONE_ROUND_FAILED");
   await tx.insert(placementJobRoundEvents).values({
    roundId:copied.id,eventType:"CREATED",actorUserId:context.user.id,
    metadata:{sourceJobId:source.id,sourceRoundId:round.id,
     sourceSequence:round.sequence,sequence:index+1,kind:round.kind,
     name:round.name,datesAndLinksCleared:true},
   });
  }
 });
 await getDb().transaction(tx=>recordActivityEventInTransaction(tx,context,{
  eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_DRAFT_CREATED,collegeId,
  subjectType:"placement_job",subjectId:draft.id,subjectLabel:draft.title,
  summary:"New placement drive draft copied from a historical drive",
  metadata:{sourceJobId:source.id,sourceStatus:source.status,
   copied:["round configuration","role packages","eligibility"],
   cleared:["deadlines","round dates","round links","applications","results","offers","external portal link"],
   reviewRequired:["eligible cohorts and passing years","role packages","pay and eligibility rules"]},
  groupKey:"placement-jobs:"+collegeId,
 }));
 return {jobId:draft.id,sourceJobId:source.id,status:draft.status,
  copiedRoundCount:cloneableRounds.length,
  cleared:["Deadlines","Round dates","Round links","Applications","Results","Offers","External portal link"],
  reviewRequired:["Eligible cohorts and passing years","Role packages","Pay and eligibility rules"]};
}
