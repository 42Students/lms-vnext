import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges,collegeMemberships,placementApplications,placementApplicationScreenings,placementJobs,placementJobRoleOptions,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {placementDateIst,readSuperAdminPlacementId,type SuperAdminPlacementDetail} from "./super-admin-placement-detail-model";
export async function getSuperAdminShortlistedDetail(context:RequestContext,rawId:unknown):Promise<SuperAdminPlacementDetail|null>{
 const scope=requireSuperAdminSelectedCollege(context,"placements.read"),id=readSuperAdminPlacementId(rawId);
 if(!id)return null;
 const [r]=await getDb().select({
  applicationId:placementApplications.id,applicationStatus:placementApplications.status,
  channel:placementApplications.channel,submittedAt:placementApplications.submittedAt,
  screeningStatus:placementApplicationScreenings.status,decidedAt:placementApplicationScreenings.decidedAt,
  applicant:users.displayName,jobTitle:placementJobs.title,role:placementJobRoleOptions.title,
 }).from(placementApplications)
 .innerJoin(placementApplicationScreenings,and(eq(placementApplicationScreenings.applicationId,placementApplications.id),eq(placementApplicationScreenings.status,"SHORTLISTED")))
 .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),eq(placementJobs.collegeId,scope.collegeId)))
 .innerJoin(placementJobRoleOptions,and(eq(placementJobRoleOptions.id,placementApplications.roleOptionId),eq(placementJobRoleOptions.jobId,placementJobs.id)))
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),eq(collegeMemberships.collegeId,scope.collegeId)))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .innerJoin(colleges,and(eq(colleges.id,placementJobs.collegeId),scope.organizationId?eq(colleges.organizationId,scope.organizationId):undefined))
 .where(eq(placementApplications.id,id)).limit(1);
 if(!r)return null;
 return {title:r.applicant||"Shortlisted applicant",subtitle:r.jobTitle+" · "+r.role,status:r.screeningStatus,
  backHref:"/admin/placements/shortlisted",
  related:{href:"/admin/placements/applications/"+encodeURIComponent(r.applicationId),label:"Application"},
  facts:[{label:"Application ID",value:r.applicationId},{label:"Application status",value:r.applicationStatus},
   {label:"Channel",value:r.channel},{label:"Submitted",value:placementDateIst(r.submittedAt)},
   {label:"Screening decided",value:placementDateIst(r.decidedAt)},
   {label:"Privacy",value:"Internal screening reason and recruiter notes are withheld"}]};
}
