import "server-only";
import {and,desc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementCompanies,placementCompanyRelationships,
 placementJobs,placementJoiningOutcomes,placementOffers,placementSeasons,users} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {PlacementsServiceError} from "./errors";
import {requirePlacementManageScope} from "./scope";
import {isoDateInIndia} from "./tpo-offer-expiry-model";
import {projectTpoJoiningFollowups,tpoJoiningFollowupQuerySchema} from "./tpo-joining-followup-model";
export async function getTpoJoiningFollowups(context:RequestContext,raw:unknown,now=new Date()){
 const member=context.membership;
 if(!member||!hasMembershipRole(context,"TPO")||member.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE")
   throw new AuthorizationError("placements.manage");
 const collegeId=member.collegeId;
 if(!can(context,"placements.manage",{collegeId}))throw new AuthorizationError("placements.manage");
 requirePermission(context,"placements.manage",{collegeId});
 const input=tpoJoiningFollowupQuerySchema.parse(raw);
 await requirePlacementManageScope(context,collegeId);
 const db=getDb();
 const seasons=await db.select({id:placementSeasons.id,name:placementSeasons.name,
  status:placementSeasons.status,startDate:placementSeasons.startDate})
   .from(placementSeasons).where(eq(placementSeasons.collegeId,collegeId))
   .orderBy(desc(placementSeasons.startDate),desc(placementSeasons.createdAt));
 const season=input.seasonId?seasons.find(x=>x.id===input.seasonId):
   seasons.find(x=>x.status==="ACTIVE")??seasons[0]??null;
 if(input.seasonId&&!season)throw new PlacementsServiceError("PLACEMENT_SEASON_NOT_FOUND");
 const offers=season?await db.select({
  offerId:placementOffers.id,jobId:placementJobs.id,jobTitle:placementJobs.title,
  companyName:placementCompanies.name,candidateName:users.displayName,
  roleTitle:placementOffers.roleTitle,offerStatus:placementOffers.status,
  acceptanceChannel:placementOffers.acceptanceChannel,
  acceptedDisputableUntil:placementOffers.acceptedDisputableUntil,
  cascadeId:placementOffers.cascadeId,
  joiningStatus:placementJoiningOutcomes.status,
  outcomeDate:placementJoiningOutcomes.joiningDate,offerJoiningDate:placementOffers.joiningDate,
 }).from(placementOffers)
   .innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
   .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),
     eq(placementJobs.collegeId,collegeId),eq(placementJobs.seasonId,season.id)))
   .innerJoin(placementCompanyRelationships,and(
     eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
     eq(placementCompanyRelationships.collegeId,collegeId)))
   .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
   .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
     eq(collegeMemberships.collegeId,collegeId)))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .leftJoin(placementJoiningOutcomes,eq(placementJoiningOutcomes.offerId,placementOffers.id))
   .where(eq(placementOffers.status,"ACCEPTED"))
   .orderBy(placementOffers.id)
   .limit(501):[];
 const today=isoDateInIndia(now);
 const report=projectTpoJoiningFollowups(offers.slice(0,500).map(r=>({
  offerId:r.offerId,jobId:r.jobId,jobTitle:r.jobTitle,companyName:r.companyName,
  candidateName:r.candidateName,roleTitle:r.roleTitle,offerStatus:r.offerStatus,
  joiningStatus:r.joiningStatus,scheduledDate:r.outcomeDate??r.offerJoiningDate,
 })),today,input.state);
 // Legacy JobOffer kept acceptance provenance, dispute window and cascade
 // identifiers beside joiningStatus. vNext retains the three offer columns
 // and resolves joiningStatus from the one-row-per-offer outcome record.
 // Keep null outcome distinct from a recorded PENDING status for review.
 const acceptanceEvidence=offers.slice(0,500).map(offer=>({
  offerId:offer.offerId,
  acceptanceChannel:offer.acceptanceChannel,
  acceptedDisputableUntil:offer.acceptedDisputableUntil?.toISOString()??null,
  cascadeId:offer.cascadeId,
  joiningOutcomeStatus:offer.joiningStatus,
 }));
 return {...report,season,seasons,state:input.state,
   acceptanceEvidence,
   truncated:offers.length>500,asOf:now.toISOString()};
}
