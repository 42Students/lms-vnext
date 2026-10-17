/** A placed learner must come from a persisted offer in this college,
 * never from recruiter stage, lead notes or merely an application. */
export type CompanyPlacementOfferFact={
 membershipId:string|null;offerStatus:string|null;offerKind:string|null;
 joiningStatus:string|null;joiningDate:string|null;
};
export type CountsAsPlacedPolicy="OFFER_RELEASED"|"OFFER_ACCEPTED"|"SELECTED";
export function companyPlacedCount(facts:readonly CompanyPlacementOfferFact[],
 policy:CountsAsPlacedPolicy){
 if(policy==="SELECTED")return null; // needs separate selection ledger
 const members=new Set<string>();
 for(const fact of facts){
  if(!fact.membershipId||fact.offerKind!=="OFFER")continue;
  if(policy==="OFFER_ACCEPTED"&&fact.offerStatus!=="ACCEPTED")continue;
  if(policy==="OFFER_RELEASED"&&fact.offerStatus!=="ISSUED"&&fact.offerStatus!=="ACCEPTED")continue;
  members.add(fact.membershipId);
 }
 return members.size;
}
export function companyHiredByYear(facts:readonly CompanyPlacementOfferFact[]){
 const years=new Map<string,Set<string>>();
 for(const f of facts){
  if(!f.membershipId||f.offerStatus!=="ACCEPTED"||
   f.joiningStatus!=="JOINED"||!f.joiningDate)continue;
  const year=f.joiningDate.slice(0,4);
  if(!/^\d{4}$/.test(year))continue;
  const members=years.get(year)??new Set<string>();members.add(f.membershipId);years.set(year,members);
 }
 return [...years.entries()].sort((a,b)=>b[0].localeCompare(a[0]))
  .map(([year,members])=>({year,hired:members.size}));
}
