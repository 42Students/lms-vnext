import "server-only";
import {and,eq,inArray,gt,ne,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementApplicationScreenings,
 placementJobs,placementJobRounds,placementRoundResults,placementRecruiterCollegeGrants,placementCompanyRelationships,
 users,activityEvents} from "@/db/schema";
import {hasActiveRecruiter,type RequestContext} from "@/modules/identity/context";
import {getRecruiterPlacementWorkspace} from "./recruiter-workspace-service";
import {hrSelectionReadyApplicationIds} from "./hr-offer-selection-read-model";
import {recruiterSelectionListInputSchema,recruiterSelectionRangeWarning} from "./recruiter-selection-list-model";
import {stagedRecruiterSelectionLists,stagedRecruiterSelectionItems} from "./recruiter-selection-staged-schema";
import {placementTableExists} from "./staged-tables";

/** A recruiter's proposed selection is NOT an offer. The placement cell must
 * verify it before any formal offer is issued. Never trust client college,
 * candidate identities, readiness or pay-range acknowledgement by themselves.
 */
export async function submitRecruiterSelectionList(
 context:RequestContext,rawJobId:string,raw:unknown,
){
 if(!hasActiveRecruiter(context)||context.recruiter?.userId!==context.user.id)
  throw new Error("RECRUITER_ACCESS_REQUIRED");
 const input=recruiterSelectionListInputSchema.parse(raw);
 if(input.jobId!==rawJobId)throw new Error("SELECTION_JOB_MISMATCH");
 const workspace=await getRecruiterPlacementWorkspace(context,rawJobId);
 if(input.collegeId!==workspace.college.id)throw new Error("SELECTION_COLLEGE_MISMATCH");
 if(workspace.job.status!=="PUBLISHED")throw new Error("SELECTION_DRIVE_CLOSED");
 const eligible=new Set(hrSelectionReadyApplicationIds(workspace.rounds));
 if(input.applicationIds.some(id=>!eligible.has(id)))
  throw new Error("SELECTION_RESULTS_CHANGED");
 const warning=recruiterSelectionRangeWarning(input.ctcLpa,
  workspace.job.minimumAnnualCtcInr,workspace.job.maximumAnnualCtcInr);
 if(warning&&!input.acknowledgedCtcWarning)
  throw new Error("SELECTION_CTC_CONFIRM_REQUIRED");
 if(!(await placementTableExists("placement_recruiter_selection_lists"))||
    !(await placementTableExists("placement_recruiter_selection_items")))
  throw new Error("SELECTION_STORAGE_UNAVAILABLE");

 return getDb().transaction(async tx=>{
  // Lock the job before revalidating the employer grant and candidate audience.
  // A changed drive or expired employer grant must never authorize a new list.
  const [job]=await tx.select({id:placementJobs.id,status:placementJobs.status,
   collegeId:placementJobs.collegeId,relationshipId:placementJobs.companyRelationshipId})
   .from(placementJobs).where(and(eq(placementJobs.id,workspace.job.id),
    eq(placementJobs.collegeId,workspace.college.id))).for("update").limit(1);
  if(!job||job.status!=="PUBLISHED")throw new Error("SELECTION_DRIVE_CLOSED");
  const [grant]=await tx.select({id:placementRecruiterCollegeGrants.id})
   .from(placementRecruiterCollegeGrants)
   .innerJoin(placementCompanyRelationships,and(
    eq(placementCompanyRelationships.id,placementRecruiterCollegeGrants.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,workspace.college.id),
    eq(placementCompanyRelationships.status,"ACTIVE")))
   .where(and(eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
    eq(placementRecruiterCollegeGrants.companyRelationshipId,job.relationshipId),
    eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
    eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED"),
    gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`),
    sql<boolean>`'DRIVES' = ANY(${placementRecruiterCollegeGrants.capabilities})`))
   .limit(1);
  if(!grant)throw new Error("RECRUITER_ACCESS_REQUIRED");
  const allowed=await tx.select({id:placementApplications.id})
   .from(placementApplications)
   .innerJoin(placementApplicationScreenings,
    eq(placementApplicationScreenings.applicationId,placementApplications.id))
   .innerJoin(collegeMemberships,
    eq(collegeMemberships.id,placementApplications.membershipId))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(and(inArray(placementApplications.id,input.applicationIds),
    eq(placementApplications.jobId,job.id),
    eq(placementApplications.status,"SUBMITTED"),
    eq(placementApplicationScreenings.status,"SHORTLISTED"),
    eq(collegeMemberships.collegeId,job.collegeId),
    eq(collegeMemberships.status,"ACTIVE"),
    eq(users.platformStatus,"ACTIVE")))
   .for("share");
  if(allowed.length!==input.applicationIds.length)
   throw new Error("SELECTION_AUDIENCE_CHANGED");
  const rounds=await tx.select({id:placementJobRounds.id,status:placementJobRounds.status})
   .from(placementJobRounds).where(and(
    eq(placementJobRounds.jobId,job.id),
    ne(placementJobRounds.kind,"TALK"),
    ne(placementJobRounds.status,"CANCELLED")))
   .for("share");
  if(rounds.length===0||rounds.some(round=>round.status!=="COMPLETED"))
   throw new Error("SELECTION_RESULTS_CHANGED");
  const passed=await tx.select({
   roundId:placementRoundResults.roundId,
   applicationId:placementRoundResults.applicationId,
   status:placementRoundResults.status,outcome:placementRoundResults.outcome,
  }).from(placementRoundResults).where(and(
   inArray(placementRoundResults.roundId,rounds.map(round=>round.id)),
   inArray(placementRoundResults.applicationId,input.applicationIds),
   ne(placementRoundResults.status,"SUPERSEDED"))).for("share");
  const passCount=new Map<string,number>();
  for(const result of passed){
   if(result.status!=="APPLIED"||result.outcome!=="PASS")
    throw new Error("SELECTION_RESULTS_CHANGED");
   const key=result.roundId+":"+result.applicationId;
   passCount.set(key,(passCount.get(key)??0)+1);
  }
  if(rounds.some(round=>input.applicationIds.some(applicationId=>
    passCount.get(round.id+":"+applicationId)!==1)))
   throw new Error("SELECTION_RESULTS_CHANGED");

  // Stable client submission ID makes network retries idempotent. A different
  // payload cannot silently reuse a previous selection proposal.
  const [inserted]=await tx.insert(stagedRecruiterSelectionLists).values({
   collegeId:job.collegeId,jobId:job.id,recruiterUserId:context.user.id,
   submissionId:input.submissionId,kind:input.kind,ctcLpa:input.ctcLpa||null,
   packageDescription:input.packageDescription||null,status:"SENT_FOR_VERIFICATION",
  }).onConflictDoNothing().returning({id:stagedRecruiterSelectionLists.id});
  if(!inserted){
   const [existing]=await tx.select({
    id:stagedRecruiterSelectionLists.id,jobId:stagedRecruiterSelectionLists.jobId,
    kind:stagedRecruiterSelectionLists.kind,ctcLpa:stagedRecruiterSelectionLists.ctcLpa,
    packageDescription:stagedRecruiterSelectionLists.packageDescription,
    status:stagedRecruiterSelectionLists.status,
   }).from(stagedRecruiterSelectionLists).where(and(
    eq(stagedRecruiterSelectionLists.collegeId,job.collegeId),
    eq(stagedRecruiterSelectionLists.recruiterUserId,context.user.id),
    eq(stagedRecruiterSelectionLists.submissionId,input.submissionId))).limit(1);
   if(!existing||existing.jobId!==job.id||existing.kind!==input.kind||
      (existing.ctcLpa??"")!==(input.ctcLpa||"")||
      (existing.packageDescription??"")!==input.packageDescription)
    throw new Error("SELECTION_IDEMPOTENCY_CONFLICT");
   const items=await tx.select({id:stagedRecruiterSelectionItems.applicationId})
    .from(stagedRecruiterSelectionItems)
    .where(eq(stagedRecruiterSelectionItems.selectionListId,existing.id));
   if(items.length!==input.applicationIds.length||
      items.some(item=>!input.applicationIds.includes(item.id)))
    throw new Error("SELECTION_IDEMPOTENCY_CONFLICT");
   return {id:existing.id,status:existing.status,submitted:false};
  }
  await tx.insert(stagedRecruiterSelectionItems).values(
   input.applicationIds.map(applicationId=>({
    selectionListId:inserted.id,applicationId,jobId:job.id,status:"PROPOSED",
   })));
  await tx.insert(activityEvents).values({
   organizationId:null,collegeId:job.collegeId,actorUserId:context.user.id,
   module:"PLACEMENTS",eventType:"placements.recruiter.selection_list_submitted",
   subjectType:"recruiter_selection_list",subjectId:inserted.id,
   summary:"Recruiter submitted a selection list for placement-cell verification",
   metadata:{jobId:job.id,kind:input.kind,count:input.applicationIds.length},
  });
  return {id:inserted.id,status:"SENT_FOR_VERIFICATION" as const,submitted:true};
 });
}
