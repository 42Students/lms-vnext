import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges,collegeMemberships,placementApplications,placementJobs,placementOffers,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {placementDateIst,placementDateOnly,readSuperAdminPlacementId,type SuperAdminPlacementDetail} from "./super-admin-placement-detail-model";
export async function getSuperAdminOfferDetail(context:RequestContext,rawId:unknown):Promise<SuperAdminPlacementDetail|null>{
 const scope=requireSuperAdminSelectedCollege(context,"placements.read"),id=readSuperAdminPlacementId(rawId);
 if(!id)return null;
 const [r]=await getDb().select({
  id:placementOffers.id,applicationId:placementApplications.id,
  status:placementOffers.status,role:placementOffers.roleTitle,version:placementOffers.version,
  salary:placementOffers.annualCtcInr,joiningDate:placementOffers.joiningDate,
  expiresAt:placementOffers.expiresAt,issuedAt:placementOffers.issuedAt,
  respondedAt:placementOffers.respondedAt,withdrawnAt:placementOffers.withdrawnAt,
  applicant:users.displayName,jobId:placementJobs.id,jobTitle:placementJobs.title,
 }).from(placementOffers)
 .innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
 .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),eq(placementJobs.collegeId,scope.collegeId)))
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),eq(collegeMemberships.collegeId,scope.collegeId)))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .innerJoin(colleges,and(eq(colleges.id,placementJobs.collegeId),scope.organizationId?eq(colleges.organizationId,scope.organizationId):undefined))
 .where(eq(placementOffers.id,id)).limit(1);
 if(!r)return null;
 const ctc=r.salary===null?"Not recorded":new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(r.salary);
 return {title:r.applicant||"Offer recipient",subtitle:r.jobTitle+" · "+r.role,status:r.status,
  backHref:"/admin/placements/offers",
  related:{href:"/admin/placements/applications/"+encodeURIComponent(r.applicationId),label:"Application"},
  facts:[{label:"Offer ID",value:r.id},{label:"Version",value:String(r.version)},
   {label:"Annual CTC",value:ctc},{label:"Joining date",value:placementDateOnly(r.joiningDate)},
   {label:"Issued",value:placementDateIst(r.issuedAt)},{label:"Expires",value:placementDateIst(r.expiresAt)},
   {label:"Responded",value:placementDateIst(r.respondedAt)},
   {label:"Withdrawn",value:placementDateIst(r.withdrawnAt)}]};
}
