/** Learner-offer facts must be derived from persisted official records. */
export function safeLearnerOfferLetterHref(raw:string|null|undefined):string|null {
 if(!raw || raw.length>2048)return null;
 try{
  const link=new URL(raw);
  if(link.protocol!=="https:" || link.username || link.password || !link.hostname || link.hash)return null;
  return link.href;
 }catch{return null;}
}
/** Counts-as-placed is the audited per-drive college policy, not a guess
 * from employment type. The offer-acceptance cascade has its own distinct
 * internship exemption and must not be inferred from this presentation fact.
 * A NULL legacy/uncertified policy stays unknown rather than becoming YES. */
export function learnerOfferCountsAsPlaced(input:{
 kind:"OFFER"|"LOI"; jobCountsAsPlaced:boolean|null;
}):boolean|null {
 if(input.kind==="LOI")return false;
 return input.jobCountsAsPlaced;
}
