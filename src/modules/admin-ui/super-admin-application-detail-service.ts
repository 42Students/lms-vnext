import "server-only";
import {and,eq} from "drizzle-orm";
import {placementCollegeApplicationStages} from "@/db/schema/placement-college-application-stages";
import {getDb} from "@/db/client";
import {colleges,collegeMemberships,placementApplications,placementJobs,placementJobRoleOptions,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {placementDateIst,readSuperAdminPlacementId,type SuperAdminPlacementDetail} from "./super-admin-placement-detail-model";
export async function getSuperAdminApplicationDetail(context:RequestContext,rawId:unknown):Promise<SuperAdminPlacementDetail|null>{
 const scope=requireSuperAdminSelectedCollege(context,"placements.read");
 const id=readSuperAdminPlacementId(rawId);
 if(!id)return null;
 const [r]=await getDb().select({
  id:placementApplications.id,status:placementApplications.status,channel:placementApplications.channel,
  eligibilityStatus:placementApplications.eligibilityStatus,submittedAt:placementApplications.submittedAt,
  withdrawnAt:placementApplications.withdrawnAt,jobId:placementJobs.id,jobTitle:placementJobs.title,
  stage:placementCollegeApplicationStages.stage,previousStage:placementCollegeApplicationStages.previousStage,
  stageMovedAt:placementCollegeApplicationStages.movedAt,
  role:placementJobRoleOptions.title,applicant:users.displayName,
 }).from(placementApplications)
 .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),eq(placementJobs.collegeId,scope.collegeId)))
 .innerJoin(placementJobRoleOptions,and(eq(placementJobRoleOptions.id,placementApplications.roleOptionId),eq(placementJobRoleOptions.jobId,placementJobs.id)))
 .leftJoin(placementCollegeApplicationStages,and(eq(placementCollegeApplicationStages.applicationId,placementApplications.id),eq(placementCollegeApplicationStages.jobId,placementJobs.id)))
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),eq(collegeMemberships.collegeId,scope.collegeId)))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .innerJoin(colleges,and(eq(colleges.id,placementJobs.collegeId),scope.organizationId?eq(colleges.organizationId,scope.organizationId):undefined))
 .where(eq(placementApplications.id,id)).limit(1);
 if(!r)return null;
 return {title:r.applicant||"Applicant",subtitle:r.jobTitle+" · "+r.role,status:r.status,
  backHref:"/admin/placements/applications",
  related:{href:"/admin/placements/jobs/"+encodeURIComponent(r.jobId),label:"Job"},
  facts:[{label:"Application ID",value:r.id},{label:"Current hiring stage",value:r.stage??"Applied (no explicit stage move)"},
   {label:"Previous stage",value:r.previousStage??"—"},{label:"Stage last moved",value:placementDateIst(r.stageMovedAt)},
   {label:"Channel",value:r.channel},
   {label:"Eligibility status",value:r.eligibilityStatus},
   {label:"Submitted",value:placementDateIst(r.submittedAt)},
   {label:"Withdrawn",value:placementDateIst(r.withdrawnAt)}]};
}
