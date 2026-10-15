/** UI-only filtering of already authorized, persisted own offers.
 * A response is actionable only if still issued and expiry strictly in the future.
 */
export function ownOffersDueWithinWeek<T extends {offer:{status:string;expiresAt:Date|null}}>(
 rows:readonly T[], nowMs:number
):T[]{
 return rows.filter(row=>{
  if(row.offer.status!=="ISSUED"||!row.offer.expiresAt||!Number.isFinite(nowMs))return false;
  const diff=row.offer.expiresAt.getTime()-nowMs;
  return diff>0&&diff<=7*86400000;
 });
}
