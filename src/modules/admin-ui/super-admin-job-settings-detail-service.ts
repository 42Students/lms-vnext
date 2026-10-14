import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges,placementJobs,placementJobEligibilityPolicies} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {placementDateIst,readSuperAdminPlacementId,type SuperAdminPlacementDetail} from "./super-admin-placement-detail-model";
export async function getSuperAdminJobSettingsDetail(context:RequestContext,rawId:unknown):Promise<SuperAdminPlacementDetail|null>{
 const scope=requireSuperAdminSelectedCollege(context,"placements.read"),id=readSuperAdminPlacementId(rawId);
 if(!id)return null;
 const [r]=await getDb().select({
  id:placementJobs.id,title:placementJobs.title,status:placementJobs.status,
  deadline:placementJobs.applicationDeadline,mode:placementJobs.applicationMode,
  configuredId:placementJobEligibilityPolicies.jobId,
  minCgpa:placementJobEligibilityPolicies.minCgpaHundredths,
  maxActiveBacklogs:placementJobEligibilityPolicies.maxActiveBacklogs,
  maxPastBacklogs:placementJobEligibilityPolicies.maxPastBacklogs,
  maxGapYears:placementJobEligibilityPolicies.maxGapYears,
  allowedProgramIds:placementJobEligibilityPolicies.allowedProgramIds,
  allowedCohortIds:placementJobEligibilityPolicies.allowedCohortIds,
  missingEvidencePolicy:placementJobEligibilityPolicies.missingEvidencePolicy,
  updatedAt:placementJobEligibilityPolicies.updatedAt,
 }).from(placementJobs)
 .innerJoin(colleges,and(eq(colleges.id,placementJobs.collegeId),eq(placementJobs.collegeId,scope.collegeId),
  scope.organizationId?eq(colleges.organizationId,scope.organizationId):undefined))
 .leftJoin(placementJobEligibilityPolicies,eq(placementJobEligibilityPolicies.jobId,placementJobs.id))
 .where(eq(placementJobs.id,id)).limit(1);
 if(!r)return null;
 const policy=r.configuredId!==null;
 const value=(n:number|null)=>n===null?"No restriction recorded":String(n);
 return {title:r.title,subtitle:policy?"Eligibility policy configured":"No eligibility policy recorded",status:r.status,
  backHref:"/admin/placements/job-settings",
  related:{href:"/admin/placements/jobs/"+encodeURIComponent(r.id),label:"Job"},
  facts:[{label:"Job ID",value:r.id},{label:"Application mode",value:r.mode},
   {label:"Deadline (IST)",value:placementDateIst(r.deadline)},
   {label:"Minimum CGPA",value:!policy?"No policy":r.minCgpa===null?"No restriction recorded":(r.minCgpa/100).toFixed(2)},
   {label:"Maximum active backlogs",value:policy?value(r.maxActiveBacklogs):"No policy"},
   {label:"Maximum past backlogs",value:policy?value(r.maxPastBacklogs):"No policy"},
   {label:"Maximum gap years",value:policy?value(r.maxGapYears):"No policy"},
   {label:"Allowed program restrictions",value:policy?String(r.allowedProgramIds?.length??0)+" registered program IDs (empty means no program filter)":"No policy"},
   {label:"Allowed batch restrictions",value:policy?String(r.allowedCohortIds?.length??0)+" registered cohort IDs (empty means no cohort filter)":"No policy"},
   {label:"Missing evidence handling",value:r.missingEvidencePolicy??"Not configured"},
   {label:"Policy updated",value:placementDateIst(r.updatedAt)}]};
}
