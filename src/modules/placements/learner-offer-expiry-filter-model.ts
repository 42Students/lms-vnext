import {z} from "zod";
export const learnerOfferExpirySchema=z.enum(["all","expired","undated"]);
export type LearnerOfferExpiryFilter=z.infer<typeof learnerOfferExpirySchema>;
/** Do not describe closed offers as awaiting a response. */
export function filterOwnOffersByExpiry<T extends {offer:{status:string;expiresAt:Date|null}}>(
 rows:readonly T[],filter:LearnerOfferExpiryFilter,nowMs:number
):T[]{
 if(filter==="all")return [...rows];
 if(!Number.isFinite(nowMs))return [];
 return rows.filter(row=>row.offer.status==="ISSUED" &&
  (filter==="undated"?row.offer.expiresAt===null:
   row.offer.expiresAt!==null&&row.offer.expiresAt.getTime()<=nowMs));
}
