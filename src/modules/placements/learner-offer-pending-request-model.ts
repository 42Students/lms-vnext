export type LearnerOfferRequestStatus={offerId:string|null;status:string;requestType:string};
export function learnerPendingOfferExtensions(rows:readonly LearnerOfferRequestStatus[]){
  return new Set(rows.filter(row=>row.offerId &&
    row.requestType==="OFFER_EXTENSION"&&row.status==="PENDING")
    .map(row=>row.offerId!));
}
