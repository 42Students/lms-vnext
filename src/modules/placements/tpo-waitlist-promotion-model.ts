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
