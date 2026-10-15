/** A round result or shortlisted application is not an issued offer. */
export function learnerPlacementCellOfferEmptyMessage(ownOfficialOffers:number):string{
 return ownOfficialOffers===0
  ?"No official offers have been recorded for your membership. Screening and round results are not offer letters."
  :"Official offers are available below.";
}
