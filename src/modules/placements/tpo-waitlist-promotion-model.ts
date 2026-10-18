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
