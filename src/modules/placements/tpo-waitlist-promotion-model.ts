import {createHash} from "node:crypto";
import {z} from "zod";
export const tpoWaitlistPromotionSchema=z.object({
 action:z.literal("OFFER_NEXT"),confirmed:z.literal(true),
 expectedPreviewToken:z.string().length(64).regex(/^[0-9a-f]{64}$/),
 reason:z.string().trim().min(3).max(500),
}).strict();
export function waitlistPreviewToken(jobId:string,raw:unknown){
 return createHash("sha256").update(JSON.stringify([jobId,raw])).digest("hex");
}
/** PostgreSQL does not guarantee result ordering without ORDER BY.
 * Reordering independent offers/promotions must never make an unchanged
 * preview token appear stale to the next TPO reviewer.
 */
export function canonicalWaitlistPreviewCollections(
  promotions: readonly {id:string;status:string;applicationId:string;seatNumber:number}[],
  activeOffers: readonly {applicationId:string;kind:string}[],
) {
  return {
    promotions:promotions.map(p=>[p.id,p.status,p.applicationId,p.seatNumber] as const)
      .sort((a,b)=>a[0].localeCompare(b[0])),
    activeOffers:activeOffers.map(o=>[o.applicationId,o.kind] as const)
      .sort((a,b)=>a[0].localeCompare(b[0])||a[1].localeCompare(b[1])),
  };
}
export type WaitlistRow={
 applicationId:string;name:string;roleTitle:string;rank:number;
 reasons:string[];canPromote:boolean;
};

/** Decision made under the promotion row lock when multiple HTTP retries
 * reconcile the same issued offer. Returning IDEMPOTENT must not re-audit.
 */
export function decideWaitlistReleaseSettlement(
 status:string,storedOfferId:string|null,issuedOfferId:string,
):"WRITE"|"IDEMPOTENT"|"STALE"{
 if(status==="PENDING"&&storedOfferId===null)return "WRITE";
 if(status==="RELEASED"&&storedOfferId===issuedOfferId)return "IDEMPOTENT";
 return "STALE";
}
