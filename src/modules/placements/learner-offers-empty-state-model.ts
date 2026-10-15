/** Only a persisted own-offer count may establish that offers exist. */
export function learnerOffersEmptyState(totalOwnOffers:number,hasFacets:boolean):{
 title:string;description:string
}{
 if(totalOwnOffers===0)return {
  title:"No offers recorded",
  description:"Official offers will appear after the placement team issues them. A round result is not an offer.",
 };
 if(hasFacets)return {
  title:"No matching offers",
  description:"No own persisted offer matches the selected filters. Clear them to restore the selected status.",
 };
 return {
  title:"No offers in this view",
  description:"No persisted offer currently matches this status. Choose another status to see other offers.",
 };
}
