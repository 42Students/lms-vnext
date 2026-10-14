import {z} from "zod";
export const tpoOfferEvidenceQuery=z.object({jobId:z.string().uuid(),offerId:z.string().uuid()}).strict();
export type OfferEvidenceEvent={id:string;fromStatus:string|null;toStatus:string;reason:string|null;createdAt:Date};
export function projectOfferEvidence(offer:readonly OfferEvidenceEvent[],joining:readonly OfferEvidenceEvent[]){
 const events=[...offer.map(e=>({id:"offer:"+e.id,kind:"Offer" as const,from:e.fromStatus,to:e.toStatus,reason:e.reason,when:e.createdAt.toISOString()})),
  ...joining.map(e=>({id:"joining:"+e.id,kind:"Joining" as const,from:e.fromStatus,to:e.toStatus,reason:e.reason,when:e.createdAt.toISOString()}))]
  .sort((a,b)=>a.when.localeCompare(b.when)||a.id.localeCompare(b.id));
 return {events,offerHistoryRecorded:offer.length>0,joiningHistoryRecorded:joining.length>0};
}
