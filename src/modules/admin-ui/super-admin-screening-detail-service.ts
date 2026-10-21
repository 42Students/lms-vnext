import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges,collegeMemberships,placementApplications,placementApplicationScreenings,placementJobs,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {placementDateIst,readSuperAdminPlacementId,type SuperAdminPlacementDetail} from "./super-admin-placement-detail-model";
const QUEUE_STATUSES=["PENDING","HOLD","REJECTED"] as const;
export async function getSuperAdminScreeningDetail(context:RequestContext,rawId:unknown):Promise<SuperAdminPlacementDetail|null>{
 const scope=requireSuperAdminSelectedCollege(context,"placements.read"),id=readSuperAdminPlacementId(rawId);
 if(!id)return null;
 const [r]=await getDb().select({
  applicationId:placementApplications.id,applicationStatus:placementApplications.status,
  eligibility:placementApplications.eligibilityStatus,channel:placementApplications.channel,
  screeningStatus:placementApplicationScreenings.status,decidedAt:placementApplicationScreenings.decidedAt,
  candidateMessage:placementApplicationScreenings.candidateMessage,
  submittedAt:placementApplications.submittedAt,
  jobTitle:placementJobs.title,
 }).from(placementApplications)
 .innerJoin(placementApplicationScreenings,and(eq(placementApplicationScreenings.applicationId,placementApplications.id),
  inArray(placementApplicationScreenings.status,QUEUE_STATUSES)))
 .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),eq(placementJobs.collegeId,scope.collegeId)))
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),eq(collegeMemberships.collegeId,scope.collegeId)))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .innerJoin(colleges,and(eq(colleges.id,placementJobs.collegeId),scope.organizationId?eq(colleges.organizationId,scope.organizationId):undefined))
 .where(eq(placementApplications.id,id)).limit(1);
 if(!r)return null;
 return {title:"Applicant screening",subtitle:r.jobTitle,status:r.screeningStatus,
  backHref:"/admin/placements/screenings",
  related:{href:"/admin/placements/applications/"+encodeURIComponent(r.applicationId),label:"Application"},
  facts:[{label:"Application ID",value:r.applicationId},
   {label:"Application status",value:r.applicationStatus},
   {label:"Eligibility",value:r.eligibility},{label:"Channel",value:r.channel},
   {label:"Submitted",value:placementDateIst(r.submittedAt)},
   {label:"Manual screening status",value:r.screeningStatus},
   {label:"Manual decision recorded",value:placementDateIst(r.decidedAt)},
   {label:"Automated screening",value:"Not performed; this is a human decision"},
   {label:"Automated score (0–1)",value:"Not recorded"},
   {label:"Matched skills",value:"Not assessed in this workflow"},
   {label:"Missing skills",value:"Not assessed in this workflow"},
   {label:"Score provenance",value:"Automated scoring was intentionally retired. A manual status is not a numeric ranking."},
   {label:"Candidate-facing explanation",value:r.candidateMessage?.trim() || "Not recorded"},
   {label:"Excluded attributes",value:"Protected attributes are not used to compute a score"},
   {label:"Privacy",value:"Applicant name, personal contact data, internal review notes and other sensitive attributes are excluded"}]};
}
