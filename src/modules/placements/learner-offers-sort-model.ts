import {z} from "zod";
export const learnerOfferSortSchema=z.enum(["priority","newest","company"]);
export type LearnerOfferSort=z.infer<typeof learnerOfferSortSchema>;
export function sortOwnOfferRows<T extends {offer:{id:string;status:string;issuedAt:Date;expiresAt:Date|null};company:{name:string}}>(
 rows:readonly T[], sort:LearnerOfferSort,nowMs:number
):T[]{
 const expiry=(row:T)=>{
  if(row.offer.expiresAt===null)return Number.POSITIVE_INFINITY;
  const time=row.offer.expiresAt.getTime();
  // A malformed saved deadline must never appear actionable.
  return Number.isFinite(time)?time:Number.NEGATIVE_INFINITY;
 };
 const issued=(row:T)=>{
  const time=row.offer.issuedAt.getTime();
  return Number.isFinite(time)?time:Number.NEGATIVE_INFINITY;
 };
 const rank=(row:T)=>row.offer.status!=="ISSUED"?2:expiry(row)<=nowMs?1:0;
 return [...rows].sort((a,b)=>{
  if(sort==="company")return a.company.name.localeCompare(b.company.name, "en",{sensitivity:"base",numeric:true})||a.offer.id.localeCompare(b.offer.id);
  if(sort==="newest")return issued(b)-issued(a)||a.offer.id.localeCompare(b.offer.id);
  const ar=rank(a),br=rank(b);
  return ar-br || (ar===0?expiry(a)-expiry(b):issued(b)-issued(a))||a.offer.id.localeCompare(b.offer.id);
 });
}
