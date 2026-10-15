/** Past-deadline ISSUED is still a stored response state, not permission to act. */
export function learnerExpiredIssuedOffers<T extends {offer:{status:string;expiresAt:Date|null}}>(
 rows:readonly T[],snapshotNowMs:number,
):number{
 if(!Number.isFinite(snapshotNowMs))return 0;
 return rows.filter(row=>row.offer.status==="ISSUED"&&row.offer.expiresAt!==null&&
  (!Number.isFinite(row.offer.expiresAt.getTime())||row.offer.expiresAt.getTime()<=snapshotNowMs)
 ).length;
}
