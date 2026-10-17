/** Learner-offer facts must be derived from persisted official records. */
export function safeLearnerOfferLetterHref(raw:string|null|undefined):string|null {
 if(!raw || raw.length>2048)return null;
 try{
  const link=new URL(raw);
  if(link.protocol!=="https:" || link.username || link.password || !link.hostname || link.hash)return null;
  return link.href;
 }catch{return null;}
}
/** Must agree with the acceptance cascade's internship exemption. */
export function learnerOfferCountsAsPlaced(input:{
 kind:"OFFER"|"LOI"; jobEmploymentType:string; roleEmploymentType:string;
}):boolean {
 return input.kind==="OFFER" &&
  input.jobEmploymentType!=="INTERNSHIP" &&
  input.roleEmploymentType!=="INTERNSHIP";
}
