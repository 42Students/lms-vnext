import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges,collegeMemberships,placementApplications,placementJobs,placementOffers,placementJoiningOutcomes,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {superAdminJoiningIntegrityNote} from "./super-admin-joining-integrity-model";
import {placementDateIst,placementDateOnly,readSuperAdminPlacementId,type SuperAdminPlacementDetail} from "./super-admin-placement-detail-model";
export async function getSuperAdminJoiningDetail(context:RequestContext,rawId:unknown):Promise<SuperAdminPlacementDetail|null>{
 const scope=requireSuperAdminSelectedCollege(context,"placements.read"),id=readSuperAdminPlacementId(rawId);
 if(!id)return null;
 const [r]=await getDb().select({
  id:placementJoiningOutcomes.offerId,status:placementJoiningOutcomes.status,
  joiningDate:placementJoiningOutcomes.joiningDate,recordedAt:placementJoiningOutcomes.recordedAt,
  offerStatus:placementOffers.status,role:placementOffers.roleTitle,
  applicationId:placementApplications.id,jobId:placementJobs.id,jobTitle:placementJobs.title,
  applicant:users.displayName,
 }).from(placementJoiningOutcomes)
 .innerJoin(placementOffers,eq(placementOffers.id,placementJoiningOutcomes.offerId))
 .innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
 .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),eq(placementJobs.collegeId,scope.collegeId)))
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),eq(collegeMemberships.collegeId,scope.collegeId)))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .innerJoin(colleges,and(eq(colleges.id,placementJobs.collegeId),scope.organizationId?eq(colleges.organizationId,scope.organizationId):undefined))
 .where(eq(placementJoiningOutcomes.offerId,id)).limit(1);
 if(!r)return null;
 const integrityNote=superAdminJoiningIntegrityNote(r.status,r.offerStatus);
 return {title:r.applicant||"Offer recipient",subtitle:r.jobTitle+" · "+r.role,status:r.status,
  backHref:"/admin/placements/joining",
  related:{href:"/admin/placements/offers/"+encodeURIComponent(r.id),label:"Offer"},
  facts:[{label:"Offer ID",value:r.id},{label:"Joining outcome",value:r.status},
   {label:"Offer status",value:r.offerStatus},
   ...(integrityNote?[{label:"Review",value:integrityNote}]:[]),
   {label:"Joining date",value:placementDateOnly(r.joiningDate)},
   {label:"Outcome recorded",value:placementDateIst(r.recordedAt)},
   {label:"Application ID",value:r.applicationId}]};
}
