import "server-only";
import {asc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementOfferStatusHistory,placementJoiningHistory} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {getTpoDriveOfferRegister} from "./tpo-drive-offer-register-service";
import {listPlacementJobOffers} from "./offer-service";
import {tpoOfferEvidenceQuery,projectOfferEvidence} from "./tpo-offer-evidence-model";
/** First check the college-scoped job, then demand that the offer belongs to it. */
export async function getTpoOfferEvidence(context:RequestContext,raw:unknown){
 const input=tpoOfferEvidenceQuery.parse(raw);
 const scope=await getTpoDriveOfferRegister(context,{jobId:input.jobId});
 const match=(await listPlacementJobOffers(context,scope.job.id)).find(r=>r.offer.id===input.offerId);
 if(!match)throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_FOUND");
 const db=getDb();
 const [statusEvents,joiningEvents]=await Promise.all([
  db.select({id:placementOfferStatusHistory.id,fromStatus:placementOfferStatusHistory.fromStatus,
   toStatus:placementOfferStatusHistory.toStatus,reason:placementOfferStatusHistory.reason,
   createdAt:placementOfferStatusHistory.createdAt})
   .from(placementOfferStatusHistory).where(eq(placementOfferStatusHistory.offerId,input.offerId))
   .orderBy(asc(placementOfferStatusHistory.createdAt),asc(placementOfferStatusHistory.id)),
  db.select({id:placementJoiningHistory.id,fromStatus:placementJoiningHistory.fromStatus,
   toStatus:placementJoiningHistory.toStatus,reason:placementJoiningHistory.reason,
   createdAt:placementJoiningHistory.createdAt})
   .from(placementJoiningHistory).where(eq(placementJoiningHistory.offerId,input.offerId))
   .orderBy(asc(placementJoiningHistory.createdAt),asc(placementJoiningHistory.id)),
 ]);
 return {job:scope.job,offer:{id:match.offer.id,status:match.offer.status,role:match.offer.roleTitle,
   issued:match.offer.issuedAt.toISOString(),expires:match.offer.expiresAt?.toISOString()??null,
   responded:match.offer.respondedAt?.toISOString()??null},
   candidate:{name:match.candidate.displayName?.trim()||"Unnamed learner",membershipId:match.candidate.membershipId},
   joining:match.offer.status==="ACCEPTED"?(match.joining?.status??"PENDING"):null,
   ...projectOfferEvidence(statusEvents,joiningEvents)};
}
