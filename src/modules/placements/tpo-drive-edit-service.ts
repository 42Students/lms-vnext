import "server-only";
import {and,asc,eq,sql,inArray,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementJobRoleOptions,placementJobRounds,placementJobs,placementSeasons,placementCompanyRelationships,placementCompanies,placementJobEligibilityPolicies,placementApplications,placementRecruiterDriveRequests,collegeMemberships,users,inAppNotifications,activityEvents,cohorts,programs,departments,learnerProgramEnrollments,membershipRoles} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {placementJobIdSchema} from "./validation";
import {auditTpoJobChange,requireTpoJobActor,requireTpoJobCollege} from "./tpo-job-write-base";
import {evaluateTpoDriveEdit,tpoDriveEditSchema} from "./tpo-drive-edit-model";
import {evaluatePlacementEligibilityBatch} from "./eligibility-service";
import {placementTpoJobTypes} from "@/db/schema/tpo-configuration";
import {TPO_BUILTIN_JOB_TYPES} from "./tpo-builtin-job-types";
import {resolveTpoDriveJobTypeChoice} from "./tpo-job-type-selection-model";
export async function getTpoDriveEditState(context:RequestContext,rawJobId:unknown){
 const collegeId=await requireTpoJobCollege(context),jobId=placementJobIdSchema.parse(rawJobId);
 const [job]=await getDb().select({
  id:placementJobs.id,title:placementJobs.title,description:placementJobs.description,
  status:placementJobs.status,seasonId:placementJobs.seasonId,updatedAt:placementJobs.updatedAt,
  applicationDeadline:placementJobs.applicationDeadline,
  jobDescriptionObjectPath:placementJobs.jobDescriptionObjectPath,
  jobTypeLabel:placementJobs.jobTypeLabel,employmentType:placementJobs.employmentType,
  workMode:placementJobs.workMode,recruiterDriveMode:placementJobs.recruiterDriveMode,
  companyRelationshipId:placementJobs.companyRelationshipId,
  legacyCreatorRole:placementJobs.legacyCreatorRole,
  legacyPostingDetails:placementJobs.legacyPostingDetails,
  locations:placementJobs.locations,openings:placementJobs.openings,
  minimumAnnualCtcInr:placementJobs.minimumAnnualCtcInr,
  maximumAnnualCtcInr:placementJobs.maximumAnnualCtcInr,
  fixedCtcLpa:placementJobs.fixedCtcLpa,variableCtcLpa:placementJobs.variableCtcLpa,
  stipendPerMonthInr:placementJobs.stipendPerMonthInr,isDream:placementJobs.isDream,
 }).from(placementJobs).where(and(eq(placementJobs.id,jobId),
  eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 const [companyLink]=await getDb().select({
  companyName:placementCompanies.name,companyStatus:placementCompanies.status,
  relationshipStatus:placementCompanyRelationships.status,
  archivedAt:placementCompanyRelationships.archivedAt,
 }).from(placementCompanyRelationships)
  .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
  .where(and(eq(placementCompanyRelationships.id,job.companyRelationshipId),
   eq(placementCompanyRelationships.collegeId,collegeId))).limit(1);
 const companyReady=Boolean(companyLink&&companyLink.companyStatus==="ACTIVE"&&
  companyLink.relationshipStatus==="ACTIVE"&&!companyLink.archivedAt);
 // An approved recruiter request belongs to its actual submitting recruiter,
 // even when the TPO was the user who authored the resulting draft. Company
 // membership alone is not proof of recruiter ownership.
 const [recruiterRequest]=await getDb().select({id:placementRecruiterDriveRequests.id})
  .from(placementRecruiterDriveRequests).where(and(
   eq(placementRecruiterDriveRequests.approvedJobId,jobId),
   eq(placementRecruiterDriveRequests.collegeId,collegeId),
   eq(placementRecruiterDriveRequests.companyRelationshipId,job.companyRelationshipId),
  )).limit(1);
 const recruiterOwned=Boolean(recruiterRequest)||
  job.legacyCreatorRole?.toUpperCase()==="RECRUITER";
 const [season]=await getDb().select({status:placementSeasons.status}).from(placementSeasons)
 .where(and(eq(placementSeasons.id,job.seasonId),eq(placementSeasons.collegeId,collegeId))).limit(1);
 const [policy]=await getDb().select({
  minCgpaHundredths:placementJobEligibilityPolicies.minCgpaHundredths,
  allowedCohortIds:placementJobEligibilityPolicies.allowedCohortIds,
  requireVerifiedEvidence:placementJobEligibilityPolicies.requireVerifiedEvidence,
  minTenthPctBasisPoints:placementJobEligibilityPolicies.minTenthPctBasisPoints,
  minTwelfthPctBasisPoints:placementJobEligibilityPolicies.minTwelfthPctBasisPoints,
  minDiplomaPctBasisPoints:placementJobEligibilityPolicies.minDiplomaPctBasisPoints,
  minUndergraduatePctBasisPoints:placementJobEligibilityPolicies.minUndergraduatePctBasisPoints,
  minPostgraduatePctBasisPoints:placementJobEligibilityPolicies.minPostgraduatePctBasisPoints,
  allowedPassingYears:placementJobEligibilityPolicies.allowedPassingYears,
  allowedProgramIds:placementJobEligibilityPolicies.allowedProgramIds,
 })
  .from(placementJobEligibilityPolicies).where(eq(placementJobEligibilityPolicies.jobId,jobId)).limit(1);
 // Keep already-targeted inactive batches visible so a live edit never
 // silently drops a historical cohort restriction.
 const allowedCohortIds=policy?.allowedCohortIds??[];
 const allowedProgramIds=policy?.allowedProgramIds??[];
 const availablePrograms=await getDb().select({
  id:programs.id,name:programs.name,code:programs.code,status:programs.status,
  departmentName:departments.name,
 }).from(programs).innerJoin(departments,eq(departments.id,programs.departmentId))
  .where(and(eq(departments.collegeId,collegeId),
   or(eq(programs.status,"ACTIVE"),
    allowedProgramIds.length?inArray(programs.id,allowedProgramIds):undefined)))
  .orderBy(asc(departments.name),asc(programs.name),asc(programs.id));
 const availableBatches=await getDb().select({
  id:cohorts.id,name:cohorts.name,code:cohorts.code,status:cohorts.status,
  program:programs.name,
 }).from(cohorts).innerJoin(programs,eq(programs.id,cohorts.programId))
  .innerJoin(departments,eq(departments.id,programs.departmentId))
  .where(and(eq(departments.collegeId,collegeId),
   or(eq(cohorts.status,"ACTIVE"),
    allowedCohortIds.length?inArray(cohorts.id,allowedCohortIds):undefined)))
  .orderBy(asc(programs.name),asc(cohorts.name),asc(cohorts.id));
 const roleOptions=await getDb().select({
  id:placementJobRoleOptions.id,title:placementJobRoleOptions.title,
  employmentType:placementJobRoleOptions.employmentType,
  workMode:placementJobRoleOptions.workMode,
  locations:placementJobRoleOptions.locations,
  minimumAnnualCtcInr:placementJobRoleOptions.minimumAnnualCtcInr,
  maximumAnnualCtcInr:placementJobRoleOptions.maximumAnnualCtcInr,
  stipendPerMonthInr:placementJobRoleOptions.stipendPerMonthInr,
 }).from(placementJobRoleOptions).where(and(
  eq(placementJobRoleOptions.jobId,jobId),eq(placementJobRoleOptions.status,"ACTIVE")))
  .orderBy(asc(placementJobRoleOptions.position),asc(placementJobRoleOptions.id));
 const roundRows=await getDb().select({
  id:placementJobRounds.id,name:placementJobRounds.name,kind:placementJobRounds.kind,
  status:placementJobRounds.status,sequence:placementJobRounds.sequence,
  scheduledAt:placementJobRounds.scheduledAt,
 }).from(placementJobRounds).where(eq(placementJobRounds.jobId,jobId))
  .orderBy(asc(placementJobRounds.sequence),asc(placementJobRounds.id)).limit(101);
 const roundsComplete=roundRows.length<=100;
 const rounds=roundRows.slice(0,100).map(item=>({
  ...item,scheduledAt:item.scheduledAt?.toISOString()??null,
 }));
 const [counter]=await getDb().select({total:sql<number>`count(distinct ${placementApplications.membershipId})::int`})
  .from(placementApplications)
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .where(and(eq(placementApplications.jobId,jobId),eq(placementApplications.status,"SUBMITTED"),
   eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")));
 return {...job,recruiterOwned,companyName:companyLink?.companyName??null,companyReady,
  recruiterOwnershipSource:recruiterRequest?"APPROVED_RECRUITER_REQUEST":
   recruiterOwned?"LEGACY_RECRUITER_ORIGIN":"TPO_MANAGED",
  updatedAt:job.updatedAt.toISOString(),
  applicationDeadline:job.applicationDeadline?.toISOString()??null,
  minCgpaHundredths:policy?.minCgpaHundredths??null,
  verifiedMarksOnly:policy?.requireVerifiedEvidence??false,
  minTenthPctBasisPoints:policy?.minTenthPctBasisPoints??null,
  minTwelfthPctBasisPoints:policy?.minTwelfthPctBasisPoints??null,
  minDiplomaPctBasisPoints:policy?.minDiplomaPctBasisPoints??null,
  minUndergraduatePctBasisPoints:policy?.minUndergraduatePctBasisPoints??null,
  minPostgraduatePctBasisPoints:policy?.minPostgraduatePctBasisPoints??null,
  allowedPassingYears:policy?.allowedPassingYears??[],
  allowedProgramIds,availablePrograms,
  roleOptions,rounds,roundsComplete,
  allowedCohortIds,availableBatches,applicantCount:Number(counter?.total??0),
  editable:["DRAFT","PUBLISHED"].includes(job.status)&&companyReady,
  editingBlockedReason:!companyReady?"Add the company. The linked employer is unavailable.":
   ["DRAFT","PUBLISHED"].includes(job.status)?null:"Drive is closed or cancelled",
  setupWarnings:season?[]:["Could not load season information. Retry setup data."]};
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
   const [liveCompany]=await tx.select({id:placementCompanyRelationships.id})
    .from(placementCompanyRelationships)
    .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
    .where(and(eq(placementCompanyRelationships.id,job.companyRelationshipId),
     eq(placementCompanyRelationships.collegeId,collegeId),
     eq(placementCompanyRelationships.status,"ACTIVE"),
     eq(placementCompanies.status,"ACTIVE"),
     sql`${placementCompanyRelationships.archivedAt} is null`))
    .for("share").limit(1);
   if(!liveCompany)throw new PlacementsServiceError("PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND");
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
  if(input.portal!==undefined&&!job.legacyPostingDetails)
   throw new PlacementsServiceError("PLACEMENT_JOB_NOT_EDITABLE");
  const nextImportantDates=input.applicationDeadline===undefined?
   job.legacyPostingDetails?.importantDates??[]:[
    ...(job.legacyPostingDetails?.importantDates??[]).filter(date=>
     date.label.trim().toLowerCase()!=="application deadline"),
    ...(input.applicationDeadline?[{label:"Application deadline",at:input.applicationDeadline}]:[]),
   ];
  const nextPostingDetails=job.legacyPostingDetails?{
   ...job.legacyPostingDetails,
   ...(input.portal!==undefined?{portal:input.portal}:{}),
   importantDates:nextImportantDates,
  }:job.legacyPostingDetails;
  // A hidden historical type is valid ONLY when the existing label stays
  // unchanged. Every changed value must resolve to an active type owned by
  // this college; never accept arbitrary labels or drop the saved type.
  let selectedJobType: {label:string;countsAsPlaced:boolean} | undefined;
  if(input.jobTypeLabel!==undefined){
   const configured=await tx.select({
    label:placementTpoJobTypes.label,active:placementTpoJobTypes.active,
    countsAsPlaced:placementTpoJobTypes.countsAsPlaced,
   }).from(placementTpoJobTypes)
    .where(eq(placementTpoJobTypes.collegeId,collegeId));
   selectedJobType=resolveTpoDriveJobTypeChoice(
    input.jobTypeLabel,{label:job.jobTypeLabel,countsAsPlaced:job.countsAsPlaced},
    configured,TPO_BUILTIN_JOB_TYPES,
   )??undefined;
   if(!selectedJobType)throw new PlacementsServiceError("PLACEMENT_JOB_TYPE_INVALID");
  }
  const [updated]=await tx.update(placementJobs).set({
   title:input.title,description:input.description,locations:input.locations,openings:input.openings,
   ...(selectedJobType?{jobTypeLabel:selectedJobType.label,countsAsPlaced:selectedJobType.countsAsPlaced}:{}),
   ...(input.employmentType!==undefined?{employmentType:input.employmentType}:{}),
   ...(input.workMode!==undefined?{workMode:input.workMode}:{}),
   ...(input.recruiterDriveMode!==undefined?{recruiterDriveMode:input.recruiterDriveMode}:{}),
   ...(input.applicationDeadline!==undefined?{
    applicationDeadline:input.applicationDeadline?new Date(input.applicationDeadline):null,
   }:{}),
   ...(input.applicationDeadline!==undefined||input.portal!==undefined?{
    legacyPostingDetails:nextPostingDetails,
   }:{}),
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
   ...(input.employmentType!==undefined?{employmentType:input.employmentType}:{}),
   ...(input.workMode!==undefined?{workMode:input.workMode}:{}),
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
   requireVerifiedEvidence:placementJobEligibilityPolicies.requireVerifiedEvidence,
   minTenthPctBasisPoints:placementJobEligibilityPolicies.minTenthPctBasisPoints,
   minTwelfthPctBasisPoints:placementJobEligibilityPolicies.minTwelfthPctBasisPoints,
   minDiplomaPctBasisPoints:placementJobEligibilityPolicies.minDiplomaPctBasisPoints,
   minUndergraduatePctBasisPoints:placementJobEligibilityPolicies.minUndergraduatePctBasisPoints,
   minPostgraduatePctBasisPoints:placementJobEligibilityPolicies.minPostgraduatePctBasisPoints,
   allowedPassingYears:placementJobEligibilityPolicies.allowedPassingYears,
   allowedProgramIds:placementJobEligibilityPolicies.allowedProgramIds,
  }).from(placementJobEligibilityPolicies)
   .where(eq(placementJobEligibilityPolicies.jobId,job.id)).limit(1);
  if(input.allowedProgramIds!==undefined&&input.allowedProgramIds.length){
   const linked=await tx.select({id:programs.id,status:programs.status})
    .from(programs).innerJoin(departments,eq(departments.id,programs.departmentId))
    .where(and(eq(departments.collegeId,collegeId),
     inArray(programs.id,input.allowedProgramIds)))
    .for("share",{of:programs});
   if(linked.length!==input.allowedProgramIds.length||
      linked.some(program=>program.status!=="ACTIVE"&&
       !(existingPolicy?.allowedProgramIds??[]).includes(program.id)))
    throw new PlacementsServiceError("PLACEMENT_JOB_NOT_EDITABLE");
  }
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
  if(input.minCgpaHundredths!==undefined||input.allowedCohortIds!==undefined||
     input.verifiedMarksOnly!==undefined||
     input.minTenthPctBasisPoints!==undefined||input.minTwelfthPctBasisPoints!==undefined||
     input.minDiplomaPctBasisPoints!==undefined||input.minUndergraduatePctBasisPoints!==undefined||
     input.minPostgraduatePctBasisPoints!==undefined||
     input.allowedPassingYears!==undefined||input.allowedProgramIds!==undefined){
   const minCgpaHundredths=input.minCgpaHundredths===undefined
    ?existingPolicy?.minCgpaHundredths??null:input.minCgpaHundredths;
   const allowedCohortIds=input.allowedCohortIds??existingPolicy?.allowedCohortIds??[];
   const policyUpdates={
    minCgpaHundredths,allowedCohortIds,
    requireVerifiedEvidence:input.verifiedMarksOnly??existingPolicy?.requireVerifiedEvidence??false,
    minTenthPctBasisPoints:input.minTenthPctBasisPoints===undefined
     ?existingPolicy?.minTenthPctBasisPoints??null:input.minTenthPctBasisPoints,
    minTwelfthPctBasisPoints:input.minTwelfthPctBasisPoints===undefined
     ?existingPolicy?.minTwelfthPctBasisPoints??null:input.minTwelfthPctBasisPoints,
    minDiplomaPctBasisPoints:input.minDiplomaPctBasisPoints===undefined
     ?existingPolicy?.minDiplomaPctBasisPoints??null:input.minDiplomaPctBasisPoints,
    minUndergraduatePctBasisPoints:input.minUndergraduatePctBasisPoints===undefined
     ?existingPolicy?.minUndergraduatePctBasisPoints??null:input.minUndergraduatePctBasisPoints,
    minPostgraduatePctBasisPoints:input.minPostgraduatePctBasisPoints===undefined
     ?existingPolicy?.minPostgraduatePctBasisPoints??null:input.minPostgraduatePctBasisPoints,
    allowedPassingYears:input.allowedPassingYears??existingPolicy?.allowedPassingYears??[],
    allowedProgramIds:input.allowedProgramIds??existingPolicy?.allowedProgramIds??[],
   };
   await tx.insert(placementJobEligibilityPolicies).values({
    jobId:job.id,updatedByUserId:context.user.id,...policyUpdates,
   }).onConflictDoUpdate({target:placementJobEligibilityPolicies.jobId,
    set:{...policyUpdates,updatedByUserId:context.user.id,updatedAt:new Date()}});

  }
  await auditTpoJobChange(tx,context,updated,"PLACEMENTS_TPO_DRIVE_EDITED","edited",{
   reason:input.reason,fromTitle:job.title,toTitle:updated.title,
   notifyApplicants:input.notifyApplicants,fromDeadline:job.applicationDeadline?.toISOString()??null,
   toDeadline:updated.applicationDeadline?.toISOString()??null,
   fromUpdatedAt:job.updatedAt.toISOString(),toUpdatedAt:updated.updatedAt.toISOString(),
   changedFields:["title","description","locations","openings","minimumAnnualCtcInr","maximumAnnualCtcInr","fixedCtcLpa","variableCtcLpa","stipendPerMonthInr","isDream",
    ...(input.allowedCohortIds!==undefined?["allowedCohortIds"]:[]),
    ...(input.verifiedMarksOnly!==undefined?["verifiedMarksOnly"]:[]),
    ...(input.applicationDeadline!==undefined?["applicationDeadline","importantDates"]:[]),
    ...(input.allowedPassingYears!==undefined?["allowedPassingYears"]:[]),
    ...(input.allowedProgramIds!==undefined?["allowedProgramIds"]:[]),
    ...(input.portal!==undefined?["portal"]:[])],
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

/** Exact saved-policy reach of active, enrolled learners in one college.
 * Never return learner identities. Oversized cohorts must fail closed instead
 * of disguising a partial sample as an exact all-college count.
 */
export async function getTpoDriveEligibilityReachPreview(
 context:RequestContext,rawJobId:unknown,
){
 const collegeId=await requireTpoJobCollege(context);
 const jobId=placementJobIdSchema.parse(rawJobId);
 const [job]=await getDb().select({id:placementJobs.id,
  updatedAt:placementJobs.updatedAt,
 }).from(placementJobs).where(and(
  eq(placementJobs.id,jobId),eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 const audience=await getDb().selectDistinct({
  membershipId:collegeMemberships.id,
  programName:programs.name,
 }).from(collegeMemberships)
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(membershipRoles,and(
   eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"LEARNER")))
  .innerJoin(learnerProgramEnrollments,and(
   eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
   eq(learnerProgramEnrollments.status,"ACTIVE")))
  .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),
   eq(departments.collegeId,collegeId)))
  .where(and(eq(collegeMemberships.collegeId,collegeId),
   eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
  .orderBy(asc(collegeMemberships.id),asc(programs.name))
  .limit(1001);
 const memberIds=[...new Set(audience.map(row=>row.membershipId))];
 if(audience.length>1000)return {
  kind:"UNAVAILABLE" as const,
  reason:"More than 1,000 active enrollment records. Narrow the eligibility scope before calculating a complete preview.",
 };
 const evaluated=await evaluatePlacementEligibilityBatch(context,jobId,memberIds);
 const result={eligible:0,eligibleWithMissingEvidence:0,needsData:0,ineligible:0};
 const branchMap=new Map<string,{eligible:number;total:number}>();
 const unique=new Map<string,string>();
 for(const row of audience){
  // Ambiguous concurrent program enrollments are evaluated by the canonical
  // eligibility service and counted once; do not double-count a learner.
  unique.set(row.membershipId,unique.has(row.membershipId)?
   "Multiple active programs":row.programName);
 }
 for(const [id,branch] of unique){
  const value=evaluated.get(id);
  if(!value)throw new Error("ELIGIBILITY_PREVIEW_INCOMPLETE");
  if(value.status==="ELIGIBLE")result.eligible++;
  else if(value.status==="ELIGIBLE_WITH_MISSING_EVIDENCE")result.eligibleWithMissingEvidence++;
  else if(value.status==="NEEDS_DATA")result.needsData++;
  else result.ineligible++;
  const stats=branchMap.get(branch)??{eligible:0,total:0};
  stats.total++;
  if(value.status==="ELIGIBLE")stats.eligible++;
  branchMap.set(branch,stats);
 }
 const branches=[...branchMap.entries()].sort((a,b)=>a[0].localeCompare(b[0]))
  .map(([name,counts])=>({name,...counts}));
 return {kind:"READY" as const,asOf:new Date().toISOString(),
  savedRevision:job.updatedAt.toISOString(),
  evaluated:memberIds.length,...result,branches,
  scopeNote:"Saved policy only. Active enrolled learners; grade and evidence checks use the canonical apply evaluator. The preview excludes learners without an active program enrollment.",
 };
}
