import "server-only";
import { and,asc,eq } from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementCompanies,placementCompanyRelationships,placementJobEligibilityPolicies,
 placementJobRoleOptions,placementJobRounds,placementJobs,placementRecruiterDriveRequests,
 placementSeasons} from "@/db/schema";
import {hrDriveDraftSchema} from "./hr-drive-draft-model";

type Tx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
type RequestRow=typeof placementRecruiterDriveRequests.$inferSelect;
export type RecruiterDraftApprovalErrorCode="NO_ACTIVE_SEASON"|"AMBIGUOUS_ACTIVE_SEASONS"|
 "COMPANY_INACTIVE"|"WORK_MODE_REVIEW_REQUIRED"|"EXTERNAL_APPLICATION_URL_REQUIRED"|"REQUEST_STALE";
export class RecruiterDraftApprovalError extends Error{
 constructor(readonly code:RecruiterDraftApprovalErrorCode){super(code);this.name="RecruiterDraftApprovalError";}
}
const inr=(value:string)=>value?Number(value):null;

/** One authoritative draft job writer for both TPO approval and policy-approved requests.
 * The caller owns the transaction: on an error no partial job/role/round/policy persists.
 * A request never publishes the job or bypasses TPO-only publication controls.
 */
export async function createRecruiterApprovedDraftJob(
 tx:Tx,request:Pick<RequestRow,"collegeId"|"companyRelationshipId"|"draft">,
 actorUserId:string,
):Promise<string>{
 const draft=hrDriveDraftSchema.parse(request.draft);
 const [relation]=await tx.select({id:placementCompanyRelationships.id})
  .from(placementCompanyRelationships)
  .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
  .where(and(eq(placementCompanyRelationships.id,request.companyRelationshipId),
   eq(placementCompanyRelationships.collegeId,request.collegeId),
   eq(placementCompanyRelationships.status,"ACTIVE"),
   eq(placementCompanies.status,"ACTIVE"))).limit(1);
 if(!relation)throw new RecruiterDraftApprovalError("COMPANY_INACTIVE");
 const seasons=await tx.select({id:placementSeasons.id}).from(placementSeasons)
  .where(and(eq(placementSeasons.collegeId,request.collegeId),
   eq(placementSeasons.status,"ACTIVE"))).orderBy(asc(placementSeasons.id)).for("update").limit(2);
 if(!seasons.length)throw new RecruiterDraftApprovalError("NO_ACTIVE_SEASON");
 if(seasons.length!==1)throw new RecruiterDraftApprovalError("AMBIGUOUS_ACTIVE_SEASONS");
 if(draft.workMode==="NO_PREFERENCE")throw new RecruiterDraftApprovalError("WORK_MODE_REVIEW_REQUIRED");
 if(draft.driveMode==="OFF_CAMPUS"&&!draft.externalApplicationUrl)
  throw new RecruiterDraftApprovalError("EXTERNAL_APPLICATION_URL_REQUIRED");
 const legacyAnnualCtc=draft.ctcLpa?Math.round(Number(draft.ctcLpa)*100000):null;
 const [job]=await tx.insert(placementJobs).values({
   collegeId:request.collegeId,seasonId:seasons[0].id,
   companyRelationshipId:request.companyRelationshipId,
   title:draft.title,description:draft.description,employmentType:draft.employmentType,
   workMode:draft.workMode,locations:[draft.location],
   recruiterDriveMode:draft.driveMode,eligibleBranches:draft.branches,
   eligiblePassingYear:draft.passingYear?Number(draft.passingYear):null,
   ctcLpa:draft.ctcLpa||null,fixedCtcLpa:draft.fixedLpa||null,
   variableCtcLpa:draft.variableLpa||null,
   stipendPerMonthInr:draft.stipendMonthlyInr?Number(draft.stipendMonthlyInr):null,
   minimumAnnualCtcInr:inr(draft.minimumAnnualCtcInr)??legacyAnnualCtc,
   maximumAnnualCtcInr:inr(draft.maximumAnnualCtcInr)??(!draft.minimumAnnualCtcInr?legacyAnnualCtc:null),
   createdByUserId:actorUserId,status:"DRAFT",
   applicationMode:draft.driveMode==="OFF_CAMPUS"?"EXTERNAL_ONLY":"INTERNAL",
   externalApplicationUrl:draft.driveMode==="OFF_CAMPUS"?draft.externalApplicationUrl:null,
  }).returning({id:placementJobs.id});
 if(!job)throw new RecruiterDraftApprovalError("REQUEST_STALE");
 await tx.insert(placementJobRoleOptions).values({
  jobId:job.id,title:draft.title,employmentType:draft.employmentType,
  workMode:draft.workMode,locations:[draft.location],isPrimary:true,
  minimumAnnualCtcInr:inr(draft.minimumAnnualCtcInr)??legacyAnnualCtc,
  maximumAnnualCtcInr:inr(draft.maximumAnnualCtcInr)??(!draft.minimumAnnualCtcInr?legacyAnnualCtc:null),
  fixedLpa:draft.fixedLpa||(draft.fixedAnnualCtcInr?(Number(draft.fixedAnnualCtcInr)/100000).toFixed(2):null),
  variableLpa:draft.variableLpa||(draft.variableAnnualCtcInr?(Number(draft.variableAnnualCtcInr)/100000).toFixed(2):null),
  bondMonths:inr(draft.bondMonths),bondAmount:draft.bondAmountInr||null,
 });
 if(draft.rounds.length)await tx.insert(placementJobRounds).values(draft.rounds.map((round,index)=>({
  jobId:job.id,sequence:index+1,kind:round.kind,name:round.name,createdByUserId:actorUserId,
 })));
 await tx.insert(placementJobEligibilityPolicies).values({
   jobId:job.id,updatedByUserId:actorUserId,
   minCgpaHundredths:draft.minimumCgpa?Math.round(Number(draft.minimumCgpa)*100):null,
   maxActiveBacklogs:inr(draft.maximumActiveBacklogs),
 });
 return job.id;
}
