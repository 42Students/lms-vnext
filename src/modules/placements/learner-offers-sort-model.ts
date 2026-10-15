import {z} from "zod";
export const learnerOfferSortSchema=z.enum(["priority","newest","company"]);
export type LearnerOfferSort=z.infer<typeof learnerOfferSortSchema>;
export function sortOwnOfferRows<T extends {offer:{id:string;status:string;issuedAt:Date;expiresAt:Date|null};company:{name:string}}>(
 rows:readonly T[], sort:LearnerOfferSort,nowMs:number
):T[]{
 const expiry=(row:T)=>row.offer.expiresAt?.getTime()??Number.POSITIVE_INFINITY;
 const rank=(row:T)=>row.offer.status!=="ISSUED"?2:expiry(row)<nowMs?1:0;
 return [...rows].sort((a,b)=>{
  if(sort==="company")return a.company.name.localeCompare(b.company.name, "en",{sensitivity:"base",numeric:true})||a.offer.id.localeCompare(b.offer.id);
  if(sort==="newest")return b.offer.issuedAt.getTime()-a.offer.issuedAt.getTime()||a.offer.id.localeCompare(b.offer.id);
  const ar=rank(a),br=rank(b);
  return ar-br || (ar===0?expiry(a)-expiry(b):b.offer.issuedAt.getTime()-a.offer.issuedAt.getTime())||a.offer.id.localeCompare(b.offer.id);
 });
}
